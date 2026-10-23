import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  TELEMETRY_MIGRATION_VERSION,
  TELEMETRY_RETENTION_DAYS,
  type TelemetryEvent,
  type TelemetrySink,
} from "../../shared/telemetry/contracts";
import { TELEMETRY_MIGRATION_CHECKSUM } from "../../server/telemetry/migration-contract";
import { applyAdditiveMigration } from "../../server/telemetry/migration";
import { operatorConnectionConfiguration } from "../../server/telemetry/operator-connection";
import { createTelemetrySink } from "../../server/telemetry/sink";

const connectionString = process.env.C_DB_TEST_ADMIN_URL;
if (!connectionString)
  throw new Error(
    "C_DB_TEST_ADMIN_URL must point to the disposable local PostgreSQL cluster",
  );

// This function rejects nonlocal hosts before any test connection is made. The
// checked-in test never accepts a production connection string as a shortcut.
const qualificationConnection = operatorConnectionConfiguration(
  connectionString,
  true,
);
const admin = new pg.Client({
  ...qualificationConnection,
  connectionTimeoutMillis: 3_000,
  statement_timeout: 5_000,
  application_name: "aifactory-telemetry-sink-qualification",
});

const openedClients = new Set<pg.Client>();
const openedSinks = new Set<TelemetrySink>();
const createdRoles: string[] = [];
const directGrantRoles: string[] = [];
const insertedEventIds: string[] = [];
const poolErrors: Error[] = [];
const rolePasswords = new Map<string, string>();
let legacyRelation: string | undefined;
let legacyTable: string | undefined;

function quotedIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(identifier))
    throw new Error("Test-generated identifier was invalid");
  return `"${identifier}"`;
}

function generatedRole(prefix: string): string {
  const role = `${prefix}_${randomUUID().replaceAll("-", "")}`;
  if (role.length > 63) throw new Error("Generated role name was too long");
  createdRoles.push(role);
  const password = randomBytes(32).toString("base64url");
  if (!/^[A-Za-z0-9_-]{43}$/.test(password))
    throw new Error("Generated role password was invalid");
  rolePasswords.set(role, password);
  return role;
}

function generatedPasswordLiteral(role: string): string {
  const password = rolePasswords.get(role);
  if (!password) throw new Error("Missing generated role password");
  // base64url has no quote characters; keep credentials out of test output and
  // never derive them from the environment or a checked-in fixture.
  return `'${password}'`;
}

function roleConfiguration(role: string): pg.ClientConfig {
  const password = rolePasswords.get(role);
  if (!password) throw new Error("Missing generated role password");
  return {
    ...qualificationConnection,
    user: role,
    password,
    connectionTimeoutMillis: 3_000,
    statement_timeout: 5_000,
    application_name: "aifactory-telemetry-sink-qualification",
  };
}

async function createAnalyticsRuntime(prefix: string): Promise<string> {
  const role = generatedRole(prefix);
  await admin.query(
    `CREATE ROLE ${quotedIdentifier(role)} LOGIN PASSWORD ${generatedPasswordLiteral(role)} INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS IN ROLE aifactory_analytics`,
  );
  return role;
}

async function createUnprivilegedLogin(prefix: string): Promise<string> {
  const role = generatedRole(prefix);
  await admin.query(
    `CREATE ROLE ${quotedIdentifier(role)} LOGIN PASSWORD ${generatedPasswordLiteral(role)} INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
  );
  return role;
}

async function clientFor(role: string): Promise<pg.Client> {
  const client = new pg.Client(roleConfiguration(role));
  openedClients.add(client);
  await client.connect();
  return client;
}

async function closeClient(client: pg.Client): Promise<void> {
  openedClients.delete(client);
  await client.end();
}

async function sinkFor(role: string): Promise<TelemetrySink> {
  const pool = new pg.Pool({
    ...roleConfiguration(role),
    max: 2,
    min: 0,
    idleTimeoutMillis: 1_000,
    query_timeout: 6_000,
  });
  pool.on("error", (error) => {
    poolErrors.push(error);
  });

  // The production constructor still has to parse a verified-TLS URL. Only
  // the injected test pool talks to the explicitly approved local socket.
  const sink = await createTelemetrySink({
    environment: {
      TELEMETRY_ENABLED: "true",
      TELEMETRY_DATABASE_URL:
        "postgresql://telemetry:placeholder@telemetry.example.test/analytics?sslmode=verify-full",
    },
    poolFactory: () => pool,
  });
  openedSinks.add(sink);
  return sink;
}

async function closeSink(sink: TelemetrySink): Promise<void> {
  openedSinks.delete(sink);
  await sink.close();
}

function telemetryEvent(receivedAt: Date): TelemetryEvent {
  const eventId = randomUUID();
  insertedEventIds.push(eventId);
  return {
    schemaVersion: 1,
    eventId,
    runId: randomUUID(),
    buildSha: "a".repeat(40),
    rulesetVersion: "release-b.1",
    occurredAt: receivedAt.toISOString(),
    type: "run_started",
    properties: {},
  };
}

async function createLegacyFixture(): Promise<string> {
  const table = `test_legacy_${randomUUID().replaceAll("-", "")}`;
  const relation = `public.${quotedIdentifier(table)}`;
  await admin.query("BEGIN");
  try {
    // This is deliberately a test-owned relation in the approved disposable
    // cluster, not a migration or a mutation of any application schema.
    await admin.query(`CREATE TABLE ${relation} (id integer NOT NULL)`);
    await admin.query(`REVOKE ALL ON TABLE ${relation} FROM PUBLIC`);
    await admin.query("COMMIT");
  } catch (error) {
    await admin.query("ROLLBACK");
    throw error;
  }
  legacyTable = table;
  return relation;
}

beforeAll(async () => {
  await admin.connect();
  const applied = await applyAdditiveMigration(admin, true);
  expect(applied).toMatchObject({
    version: TELEMETRY_MIGRATION_VERSION,
    checksum: TELEMETRY_MIGRATION_CHECKSUM,
  });
  const migration = await admin.query<{ checksum: string }>(
    "SELECT checksum FROM analytics.schema_migrations WHERE version = $1",
    [TELEMETRY_MIGRATION_VERSION],
  );
  expect(migration.rows).toEqual([{ checksum: TELEMETRY_MIGRATION_CHECKSUM }]);
  legacyRelation = await createLegacyFixture();
});

afterAll(async () => {
  await Promise.allSettled(
    [...openedSinks].map(async (sink) => {
      await sink.close();
    }),
  );
  await Promise.allSettled(
    [...openedClients].map(async (client) => {
      await client.end();
    }),
  );

  try {
    if (insertedEventIds.length)
      await admin.query(
        "DELETE FROM analytics.telemetry_events WHERE event_id = ANY($1::uuid[])",
        [insertedEventIds],
      );
    // Tests never change group grants. Restore every direct role grant before
    // removing synthetic logins in case an assertion interrupted a test body.
    for (const role of directGrantRoles)
      await admin.query(
        `REVOKE SELECT ON TABLE analytics.telemetry_events FROM ${quotedIdentifier(role)}`,
      );
    for (const role of [...createdRoles].reverse())
      await admin.query(`DROP ROLE IF EXISTS ${quotedIdentifier(role)}`);
    if (legacyTable) {
      const relation = `public.${quotedIdentifier(legacyTable)}`;
      await admin.query("BEGIN");
      try {
        await admin.query(`REVOKE ALL ON TABLE ${relation} FROM PUBLIC`);
        await admin.query(`DROP TABLE IF EXISTS ${relation}`);
        await admin.query("COMMIT");
      } catch (error) {
        await admin.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await admin.end();
  }

  // A pool error would be a real qualification signal, not an ignored test
  // runner warning. Keep its details out of test output because pg errors can
  // include connection metadata.
  expect(poolErrors).toHaveLength(0);
});

describe("actual PostgreSQL telemetry sink qualification", () => {
  it("attests the isolated analytics role and writes exactly one 90-day event", async () => {
    const runtime = await createAnalyticsRuntime("c_sink_ready");
    const sink = await sinkFor(runtime);
    const receivedAt = new Date("2026-10-23T12:00:00.000Z");
    const event = telemetryEvent(receivedAt);

    try {
      expect(sink.status()).toBe("ready");
      expect(sink.migrationAttestation()).toEqual({
        state: "verified",
        version: TELEMETRY_MIGRATION_VERSION,
        checksum: TELEMETRY_MIGRATION_CHECKSUM,
      });

      await sink.accept([event], receivedAt);
      await sink.accept([event], receivedAt);

      const stored = await admin.query<{
        count: number;
        retention_seconds: number;
      }>(
        `SELECT count(*)::int AS count,
                COALESCE(extract(epoch FROM max(expires_at - received_at))::int, 0) AS retention_seconds
           FROM analytics.telemetry_events
          WHERE event_id = $1`,
        [event.eventId],
      );
      expect(stored.rows).toEqual([
        {
          count: 1,
          retention_seconds: TELEMETRY_RETENTION_DAYS * 24 * 60 * 60,
        },
      ]);
    } finally {
      await closeSink(sink);
    }
  });

  it("keeps the analytics runtime unable to read events, research, or legacy data", async () => {
    const runtime = await createAnalyticsRuntime("c_sink_boundary");
    const client = await clientFor(runtime);

    try {
      await expect(
        client.query("SELECT * FROM analytics.telemetry_events"),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        client.query("SELECT * FROM research.study_responses"),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        client.query(`SELECT * FROM ${legacyRelation} LIMIT 1`),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await closeClient(client);
    }
  });

  it("fails closed when a reachable nested membership is added", async () => {
    const runtime = await createAnalyticsRuntime("c_sink_nested_runtime");
    const middle = await createUnprivilegedLogin("c_sink_nested_middle");
    const leaf = await createUnprivilegedLogin("c_sink_nested_leaf");
    await admin.query(
      `GRANT ${quotedIdentifier(leaf)} TO ${quotedIdentifier(middle)}`,
    );
    await admin.query(
      `GRANT ${quotedIdentifier(middle)} TO ${quotedIdentifier(runtime)}`,
    );
    const sink = await sinkFor(runtime);

    try {
      expect(sink.status()).toBe("degraded");
      expect(sink.migrationAttestation()).toEqual({
        state: "unverified",
        version: null,
        checksum: null,
      });
    } finally {
      await closeSink(sink);
    }
  });

  it("fails closed when a direct SELECT grant drifts onto the runtime login", async () => {
    const runtime = await createAnalyticsRuntime("c_sink_acl_drift");
    directGrantRoles.push(runtime);
    await admin.query(
      `GRANT SELECT ON TABLE analytics.telemetry_events TO ${quotedIdentifier(runtime)}`,
    );
    const sink = await sinkFor(runtime);

    try {
      expect(sink.status()).toBe("degraded");
      expect(sink.migrationAttestation()).toEqual({
        state: "unverified",
        version: null,
        checksum: null,
      });
    } finally {
      await closeSink(sink);
    }
  });
});
