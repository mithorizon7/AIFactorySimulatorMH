import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import {
  TELEMETRY_MIGRATION_VERSION,
  TELEMETRY_RETENTION_DAYS,
  clientTimeIsBounded,
  telemetryEventSchema,
  type MigrationAttestation,
  type TelemetryEvent,
  type TelemetrySink,
  type TelemetryStatus,
} from "../../shared/telemetry/contracts";
import { TELEMETRY_MIGRATION_CHECKSUM } from "./migration-contract";
import { telemetryEvents } from "./schema";

const PROBE_INITIAL_DELAY_MS = 1_000;
const PROBE_MAX_DELAY_MS = 60_000;
const MAX_BATCH_SIZE = 20;

export class TelemetryUnavailableError extends Error {
  constructor(message = "Optional telemetry is temporarily unavailable.") {
    super(message);
    this.name = "TelemetryUnavailableError";
  }
}

type QueryResult<Row> = { rows: Row[] };

export interface TelemetryPool {
  on?(event: "error", listener: (error: unknown) => void): unknown;
  off?(event: "error", listener: (error: unknown) => void): unknown;
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<Row>>;
  end(): Promise<void>;
}

export interface TelemetryWriter {
  insert(events: readonly TelemetryEvent[], receivedAt: Date): Promise<void>;
}

export interface TelemetrySinkFactoryOptions {
  startInBackground?: boolean;
  environment?: NodeJS.ProcessEnv;
  poolFactory?: (configuration: PoolConfig) => TelemetryPool;
  writerFactory?: (pool: TelemetryPool) => TelemetryWriter;
  clock?: () => number;
  setTimer?: typeof setTimeout;
  clearTimer?: typeof clearTimeout;
}

export interface TelemetryRoleVerification {
  current_user: string;
  session_user: string;
  database_owner: string | null;
  database_create: boolean;
  analytics_owner: string | null;
  research_owner: string | null;
  reachable_memberships: string[] | null;
  analytics_member: boolean;
  analytics_schema_usage: boolean;
  analytics_schema_create: boolean;
  telemetry_insert: boolean;
  telemetry_read: boolean;
  telemetry_update: boolean;
  telemetry_delete: boolean;
  telemetry_truncate: boolean;
  migration_read: boolean;
  migration_insert: boolean;
  migration_update: boolean;
  migration_delete: boolean;
  research_usage: boolean;
  research_create: boolean;
  research_read: boolean;
  reachable_table_grants: string[] | null;
  reachable_column_grants: string[] | null;
  reachable_schema_grants: string[] | null;
  rolsuper: boolean;
  rolcreaterole: boolean;
  rolcreatedb: boolean;
  rolreplication: boolean;
  rolbypassrls: boolean;
  analytics_rolsuper: boolean;
  analytics_rolcreaterole: boolean;
  analytics_rolcreatedb: boolean;
  analytics_rolreplication: boolean;
  analytics_rolbypassrls: boolean;
  analytics_rolcanlogin: boolean;
}

type MigrationRow = { version: string; checksum: string };

class TelemetryMigrationMismatchError extends Error {
  constructor(readonly attestation: MigrationAttestation) {
    super("Telemetry migration does not match the deployed contract.");
    this.name = "TelemetryMigrationMismatchError";
  }
}

function safeVersion(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9._-]{1,64}$/.test(value)
    ? value
    : null;
}

function safeChecksum(value: unknown): string | null {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value)
    ? value
    : null;
}

function unverifiedAttestation(): MigrationAttestation {
  return { state: "unverified", version: null, checksum: null };
}

function configurationAttestation(): MigrationAttestation {
  return { state: "not_configured", version: null, checksum: null };
}

function parseVerifiedTlsConnectionString(connectionString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new TelemetryUnavailableError(
      "Telemetry configuration is invalid and has not been activated.",
    );
  }
  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !parsed.hostname
  )
    throw new TelemetryUnavailableError(
      "Telemetry configuration is invalid and has not been activated.",
    );

  // node-postgres lets connection-string SSL settings override `ssl`; reject
  // non-verifying modes and remove all SSL query controls before supplying the
  // fixed verified TLS policy below.
  const sslMode = parsed.searchParams.get("sslmode");
  if (sslMode && sslMode !== "verify-full")
    throw new TelemetryUnavailableError(
      "Telemetry configuration requires verified TLS and has not been activated.",
    );
  for (const name of ["sslmode", "ssl", "sslrootcert", "sslcert", "sslkey"])
    parsed.searchParams.delete(name);
  return parsed.toString();
}

function poolConfiguration(connectionString: string): PoolConfig {
  return {
    connectionString: parseVerifiedTlsConnectionString(connectionString),
    ssl: { rejectUnauthorized: true },
    max: 2,
    min: 0,
    connectionTimeoutMillis: 3_000,
    idleTimeoutMillis: 10_000,
    statement_timeout: 5_000,
    query_timeout: 6_000,
    application_name: "ai-factory-telemetry",
  };
}

/** Parameterized Drizzle writer; event IDs make retries idempotent. */
export function createDrizzleTelemetryWriter(
  pool: TelemetryPool,
): TelemetryWriter {
  const database = drizzle(pool as Pool);
  return {
    async insert(events, receivedAt) {
      const expiresAt = new Date(
        receivedAt.getTime() + TELEMETRY_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
      );
      await database
        .insert(telemetryEvents)
        .values(
          events.map((event) => ({
            eventId: event.eventId,
            runId: event.runId,
            buildSha: event.buildSha,
            rulesetVersion: event.rulesetVersion,
            schemaVersion: event.schemaVersion,
            eventType: event.type,
            properties: event.properties,
            clientOccurredAt: new Date(event.occurredAt),
            receivedAt,
            expiresAt,
          })),
        )
        .onConflictDoNothing();
    },
  };
}

const roleVerificationSql = `
  WITH RECURSIVE runtime_role(role_id) AS (
    SELECT oid FROM pg_roles WHERE rolname = current_user
  ),
  reachable(role_id) AS (
    SELECT membership.roleid
    FROM pg_auth_members membership
    JOIN runtime_role ON membership.member = runtime_role.role_id
    UNION
    SELECT membership.roleid
    FROM pg_auth_members membership
    JOIN reachable ON membership.member = reachable.role_id
  ),
  reachable_or_public(role_id) AS (
    SELECT role_id FROM runtime_role
    UNION
    SELECT role_id FROM reachable
    UNION
    SELECT 0::oid
  ),
  managed_relations(qualified_name, relation_id) AS (
    -- Resolve through catalogs, not textual regclass casts: the runtime must
    -- be able to prove it cannot read research without USAGE on that schema.
    SELECT namespace.nspname || '.' || relation.relname, relation.oid
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE (namespace.nspname, relation.relname) IN (
      ('analytics', 'telemetry_events'),
      ('analytics', 'schema_migrations'),
      ('research', 'study_responses')
    )
  )
  SELECT
    current_user AS current_user,
    session_user AS session_user,
    (SELECT rolname FROM pg_roles WHERE oid = (
      SELECT datdba FROM pg_database WHERE datname = current_database()
    )) AS database_owner,
    has_database_privilege(current_user, current_database(), 'CREATE') AS database_create,
    (SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname = 'analytics') AS analytics_owner,
    (SELECT pg_get_userbyid(nspowner) FROM pg_namespace WHERE nspname = 'research') AS research_owner,
    COALESCE((
      SELECT array_agg(member_role.rolname::text ORDER BY member_role.rolname)
      FROM reachable
      JOIN pg_roles member_role ON member_role.oid = reachable.role_id
    ), ARRAY[]::text[]) AS reachable_memberships,
    pg_has_role(current_user, 'aifactory_analytics', 'member') AS analytics_member,
    has_schema_privilege(current_user, 'analytics', 'USAGE') AS analytics_schema_usage,
    has_schema_privilege(current_user, 'analytics', 'CREATE') AS analytics_schema_create,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.telemetry_events'), 'INSERT') AS telemetry_insert,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.telemetry_events'), 'SELECT') AS telemetry_read,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.telemetry_events'), 'UPDATE') AS telemetry_update,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.telemetry_events'), 'DELETE') AS telemetry_delete,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.telemetry_events'), 'TRUNCATE') AS telemetry_truncate,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.schema_migrations'), 'SELECT') AS migration_read,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.schema_migrations'), 'INSERT') AS migration_insert,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.schema_migrations'), 'UPDATE') AS migration_update,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'analytics.schema_migrations'), 'DELETE') AS migration_delete,
    has_schema_privilege(current_user, 'research', 'USAGE') AS research_usage,
    has_schema_privilege(current_user, 'research', 'CREATE') AS research_create,
    has_table_privilege(current_user, (SELECT relation_id FROM managed_relations WHERE qualified_name = 'research.study_responses'), 'SELECT') AS research_read,
    COALESCE((
      SELECT array_agg(
        namespace.nspname || '.' || relation.relname || ':' || grant_item.privilege_type
        ORDER BY namespace.nspname, relation.relname, grant_item.privilege_type
      )
      FROM pg_class relation
      JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      CROSS JOIN LATERAL aclexplode(
        COALESCE(relation.relacl, acldefault('r', relation.relowner))
      ) AS grant_item(grantor, grantee, privilege_type, is_grantable)
      WHERE relation.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
        AND namespace.nspname NOT LIKE 'pg_%'
        AND namespace.nspname <> 'information_schema'
        AND grant_item.grantee IN (SELECT role_id FROM reachable_or_public)
    ), ARRAY[]::text[]) AS reachable_table_grants,
    COALESCE((
      SELECT array_agg(
        namespace.nspname || '.' || relation.relname || '.' || attribute.attname || ':' || grant_item.privilege_type
        ORDER BY namespace.nspname, relation.relname, attribute.attname, grant_item.privilege_type
      )
      FROM pg_attribute attribute
      JOIN pg_class relation ON relation.oid = attribute.attrelid
      JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      CROSS JOIN LATERAL aclexplode(attribute.attacl)
        AS grant_item(grantor, grantee, privilege_type, is_grantable)
      WHERE attribute.attnum > 0
        AND NOT attribute.attisdropped
        AND namespace.nspname NOT LIKE 'pg_%'
        AND namespace.nspname <> 'information_schema'
        AND grant_item.grantee IN (SELECT role_id FROM reachable_or_public)
    ), ARRAY[]::text[]) AS reachable_column_grants,
    COALESCE((
      SELECT array_agg(
        namespace.nspname || ':' || grant_item.privilege_type
        ORDER BY namespace.nspname, grant_item.privilege_type
      )
      FROM pg_namespace namespace
      CROSS JOIN LATERAL aclexplode(
        COALESCE(namespace.nspacl, acldefault('n', namespace.nspowner))
      ) AS grant_item(grantor, grantee, privilege_type, is_grantable)
      WHERE namespace.nspname NOT LIKE 'pg_%'
        AND namespace.nspname <> 'information_schema'
        AND grant_item.grantee IN (SELECT role_id FROM reachable_or_public)
        AND (
          grant_item.privilege_type = 'CREATE'
          OR namespace.nspname IN ('analytics', 'research')
        )
    ), ARRAY[]::text[]) AS reachable_schema_grants,
    role.rolsuper AS rolsuper,
    role.rolcreaterole AS rolcreaterole,
    role.rolcreatedb AS rolcreatedb,
    role.rolreplication AS rolreplication,
    role.rolbypassrls AS rolbypassrls,
    analytics_role.rolsuper AS analytics_rolsuper,
    analytics_role.rolcreaterole AS analytics_rolcreaterole,
    analytics_role.rolcreatedb AS analytics_rolcreatedb,
    analytics_role.rolreplication AS analytics_rolreplication,
    analytics_role.rolbypassrls AS analytics_rolbypassrls,
    analytics_role.rolcanlogin AS analytics_rolcanlogin
  FROM pg_roles role
  JOIN pg_roles analytics_role ON analytics_role.rolname = 'aifactory_analytics'
  WHERE role.rolname = current_user
`;

const EXPECTED_TABLE_GRANTS = [
  "analytics.schema_migrations:SELECT",
  "analytics.telemetry_events:INSERT",
];
const EXPECTED_SCHEMA_GRANTS = ["analytics:USAGE"];

function matchesExactly(
  actual: string[],
  expected: readonly string[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((grant, index) => grant === expected[index])
  );
}

function roleIsRestricted(
  role: TelemetryRoleVerification | undefined,
): boolean {
  if (!role) return false;
  const memberships = Array.isArray(role.reachable_memberships)
    ? role.reachable_memberships
    : [];
  const tableGrants = Array.isArray(role.reachable_table_grants)
    ? role.reachable_table_grants
    : [];
  const columnGrants = Array.isArray(role.reachable_column_grants)
    ? role.reachable_column_grants
    : [];
  const schemaGrants = Array.isArray(role.reachable_schema_grants)
    ? role.reachable_schema_grants
    : [];
  return (
    role.current_user === role.session_user &&
    role.current_user !== "aifactory_analytics" &&
    role.current_user !== role.database_owner &&
    !role.database_create &&
    role.current_user !== role.analytics_owner &&
    role.current_user !== role.research_owner &&
    memberships.length === 1 &&
    memberships[0] === "aifactory_analytics" &&
    role.analytics_member &&
    role.analytics_schema_usage &&
    !role.analytics_schema_create &&
    role.telemetry_insert &&
    !role.telemetry_read &&
    !role.telemetry_update &&
    !role.telemetry_delete &&
    !role.telemetry_truncate &&
    role.migration_read &&
    !role.migration_insert &&
    !role.migration_update &&
    !role.migration_delete &&
    !role.research_usage &&
    !role.research_create &&
    !role.research_read &&
    matchesExactly(tableGrants, EXPECTED_TABLE_GRANTS) &&
    columnGrants.length === 0 &&
    matchesExactly(schemaGrants, EXPECTED_SCHEMA_GRANTS) &&
    !role.rolsuper &&
    !role.rolcreaterole &&
    !role.rolcreatedb &&
    !role.rolreplication &&
    !role.rolbypassrls &&
    !role.analytics_rolsuper &&
    !role.analytics_rolcreaterole &&
    !role.analytics_rolcreatedb &&
    !role.analytics_rolreplication &&
    !role.analytics_rolbypassrls &&
    !role.analytics_rolcanlogin
  );
}

class InactiveTelemetrySink implements TelemetrySink {
  constructor(
    private readonly state: "not_configured" | "unverified",
    private readonly statusValue: TelemetryStatus,
  ) {}

  status(): TelemetryStatus {
    return this.statusValue;
  }

  migrationVersion(): string | null {
    return null;
  }

  migrationAttestation(): MigrationAttestation {
    return this.state === "not_configured"
      ? configurationAttestation()
      : unverifiedAttestation();
  }

  async accept(): Promise<void> {
    throw new TelemetryUnavailableError();
  }

  async close(): Promise<void> {}
}

class PostgresTelemetrySink implements TelemetrySink {
  private readonly onPoolError = () => this.markTransientFailure();
  private statusValue: TelemetryStatus = "degraded";
  private attestationValue: MigrationAttestation = unverifiedAttestation();
  private lastVerified: MigrationAttestation | null = null;
  private verifying: Promise<void> | undefined;
  private probe: ReturnType<typeof setTimeout> | undefined;
  private probeDelay = PROBE_INITIAL_DELAY_MS;
  private closed = false;

  constructor(
    private readonly pool: TelemetryPool,
    private readonly writer: TelemetryWriter,
    private readonly clock: () => number,
    private readonly setTimer: typeof setTimeout,
    private readonly clearTimer: typeof clearTimeout,
  ) {
    // pg emits idle-client errors on the pool itself. Without a listener an
    // optional database outage could become an uncaught process-level error.
    this.pool.on?.("error", this.onPoolError);
  }

  status(): TelemetryStatus {
    return this.statusValue;
  }

  migrationVersion(): string | null {
    return this.attestationValue.version;
  }

  migrationAttestation(): MigrationAttestation {
    return { ...this.attestationValue };
  }

  async start(): Promise<void> {
    await this.verify();
  }

  async accept(events: TelemetryEvent[], receivedAt: Date): Promise<void> {
    if (
      events.length < 1 ||
      events.length > MAX_BATCH_SIZE ||
      new Set(events.map((event) => event.eventId)).size !== events.length ||
      !Number.isFinite(receivedAt.getTime())
    )
      throw new TelemetryUnavailableError("Telemetry batch was not accepted.");
    for (const event of events) {
      const parsed = telemetryEventSchema.safeParse(event);
      if (
        !parsed.success ||
        !clientTimeIsBounded(event.occurredAt, receivedAt.getTime())
      )
        throw new TelemetryUnavailableError(
          "Telemetry batch was not accepted.",
        );
    }

    if (this.statusValue !== "ready") await this.verify();
    if (this.statusValue !== "ready") throw new TelemetryUnavailableError();
    try {
      await this.writer.insert(events, receivedAt);
    } catch {
      this.markTransientFailure();
      throw new TelemetryUnavailableError();
    }
  }

  async close(): Promise<void> {
    this.closed = true;
    if (this.probe) this.clearTimer(this.probe);
    this.probe = undefined;
    try {
      await this.pool.end();
    } catch {
      // Closing an optional sink must never affect application shutdown.
    } finally {
      this.pool.off?.("error", this.onPoolError);
    }
  }

  private async verify(): Promise<void> {
    if (!this.verifying) {
      this.verifying = this.verifyOnce().finally(() => {
        this.verifying = undefined;
      });
    }
    await this.verifying;
  }

  private async verifyOnce(): Promise<void> {
    try {
      const role =
        await this.pool.query<TelemetryRoleVerification>(roleVerificationSql);
      if (!roleIsRestricted(role.rows[0]))
        throw new TelemetryUnavailableError(
          "Telemetry role is not restricted to the analytics write boundary.",
        );
      // Always select the required version first. Looking only at the two most
      // recent rows would falsely mark a healthy database as mismatched once
      // later additive migrations have been applied.
      const migrations = await this.pool.query<MigrationRow>(
        `SELECT version, checksum
         FROM (
           SELECT version, checksum, applied_at, 0 AS priority
           FROM analytics.schema_migrations
           WHERE version = $1
           UNION ALL
           SELECT version, checksum, applied_at, 1 AS priority
           FROM analytics.schema_migrations
           WHERE version <> $1
         ) AS observed_migrations
         ORDER BY priority ASC, applied_at DESC, version ASC
         LIMIT 2`,
        [TELEMETRY_MIGRATION_VERSION],
      );
      const expected = migrations.rows.find(
        (migration) => migration.version === TELEMETRY_MIGRATION_VERSION,
      );
      if (!expected || expected.checksum !== TELEMETRY_MIGRATION_CHECKSUM) {
        const observed = expected ?? migrations.rows[0];
        throw new TelemetryMigrationMismatchError({
          state: "mismatch",
          version: safeVersion(observed?.version),
          checksum: safeChecksum(observed?.checksum),
        });
      }
      this.attestationValue = {
        state: "verified",
        version: TELEMETRY_MIGRATION_VERSION,
        checksum: TELEMETRY_MIGRATION_CHECKSUM,
      };
      this.lastVerified = this.attestationValue;
      this.statusValue = "ready";
      this.probeDelay = PROBE_INITIAL_DELAY_MS;
    } catch (error) {
      if (error instanceof TelemetryMigrationMismatchError) {
        this.attestationValue = error.attestation;
        this.lastVerified = null;
      } else {
        this.attestationValue = this.lastVerified ?? unverifiedAttestation();
      }
      this.statusValue = "degraded";
      this.scheduleProbe();
    }
  }

  private markTransientFailure(): void {
    this.statusValue = "degraded";
    this.attestationValue = this.lastVerified ?? unverifiedAttestation();
    this.scheduleProbe();
  }

  private scheduleProbe(): void {
    if (this.closed || this.probe) return;
    this.probe = this.setTimer(() => {
      this.probe = undefined;
      void this.verify();
    }, this.probeDelay);
    if (typeof this.probe === "object" && "unref" in this.probe)
      (this.probe as ReturnType<typeof setTimeout> & { unref(): void }).unref();
    this.probeDelay = Math.min(this.probeDelay * 2, PROBE_MAX_DELAY_MS);
  }
}

/**
 * Builds an isolated optional sink. Broad application credentials are rejected
 * rather than inherited, and configuration failures leave core gameplay alive.
 */
export async function createTelemetrySink(
  options: TelemetrySinkFactoryOptions = {},
): Promise<TelemetrySink> {
  const environment = options.environment ?? process.env;
  if (environment.TELEMETRY_ENABLED !== "true")
    return new InactiveTelemetrySink("not_configured", "not_configured");
  if (
    environment.DATABASE_URL ||
    environment.NEON_DATABASE_URL ||
    !environment.TELEMETRY_DATABASE_URL
  )
    return new InactiveTelemetrySink("unverified", "degraded");

  let pool: TelemetryPool | undefined;
  try {
    pool = (options.poolFactory ?? ((config) => new Pool(config)))(
      poolConfiguration(environment.TELEMETRY_DATABASE_URL),
    );
    const writer = (options.writerFactory ?? createDrizzleTelemetryWriter)(
      pool,
    );
    const sink = new PostgresTelemetrySink(
      pool,
      writer,
      options.clock ?? Date.now,
      options.setTimer ?? setTimeout,
      options.clearTimer ?? clearTimeout,
    );
    if (options.startInBackground) void sink.start().catch(() => sink.close());
    else await sink.start();
    return sink;
  } catch {
    await pool?.end().catch(() => {
      // The optional pool may not have connected yet; do not affect startup.
    });
    return new InactiveTelemetrySink("unverified", "degraded");
  }
}

export const telemetrySinkInternals = {
  parseVerifiedTlsConnectionString,
  roleIsRestricted,
};
