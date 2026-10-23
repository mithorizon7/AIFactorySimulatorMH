import { describe, expect, it, vi } from "vitest";
import {
  TELEMETRY_MIGRATION_VERSION,
  type TelemetryEvent,
} from "../../../shared/telemetry/contracts";
import {
  createTelemetrySink,
  telemetrySinkInternals,
  TelemetryUnavailableError,
  type TelemetryPool,
  type TelemetryRoleVerification,
  type TelemetryWriter,
} from "../../../server/telemetry/sink";
import { TELEMETRY_MIGRATION_CHECKSUM } from "../../../server/telemetry/migration-contract";

function event(): TelemetryEvent {
  return {
    schemaVersion: 1,
    eventId: "11111111-1111-4111-8111-111111111111",
    runId: "22222222-2222-4222-8222-222222222222",
    buildSha: "a".repeat(40),
    rulesetVersion: "release-b.1",
    occurredAt: "2026-10-23T12:00:00.000Z",
    type: "run_started",
    properties: {},
  };
}

function restrictedRole(
  changes: Partial<TelemetryRoleVerification> = {},
): TelemetryRoleVerification {
  return {
    current_user: "runtime_telemetry",
    session_user: "runtime_telemetry",
    database_owner: "migration_owner",
    database_create: false,
    analytics_owner: "migration_owner",
    research_owner: "migration_owner",
    reachable_memberships: ["aifactory_analytics"],
    analytics_member: true,
    analytics_schema_usage: true,
    analytics_schema_create: false,
    telemetry_insert: true,
    telemetry_read: false,
    telemetry_update: false,
    telemetry_delete: false,
    telemetry_truncate: false,
    migration_read: true,
    migration_insert: false,
    migration_update: false,
    migration_delete: false,
    research_usage: false,
    research_create: false,
    research_read: false,
    reachable_table_grants: [
      "analytics.schema_migrations:SELECT",
      "analytics.telemetry_events:INSERT",
    ],
    reachable_column_grants: [],
    reachable_schema_grants: ["analytics:USAGE"],
    rolsuper: false,
    rolcreaterole: false,
    rolcreatedb: false,
    rolreplication: false,
    rolbypassrls: false,
    analytics_rolsuper: false,
    analytics_rolcreaterole: false,
    analytics_rolcreatedb: false,
    analytics_rolreplication: false,
    analytics_rolbypassrls: false,
    analytics_rolcanlogin: false,
    ...changes,
  };
}

function poolWith(responses: unknown[][]) {
  const query = vi.fn(async () => ({ rows: responses.shift() ?? [] }));
  const end = vi.fn(async () => {});
  return {
    pool: { query: query as TelemetryPool["query"], end },
    query,
    end,
  };
}

const enabledEnvironment = {
  TELEMETRY_ENABLED: "true",
  TELEMETRY_DATABASE_URL:
    "postgresql://telemetry:password@db.example.test/analytics?sslmode=verify-full",
};

describe("telemetry sink privilege and availability boundaries", () => {
  it("permits only the exact transitive analytics role boundary", () => {
    const { roleIsRestricted } = telemetrySinkInternals;
    expect(roleIsRestricted(restrictedRole())).toBe(true);
    expect(
      roleIsRestricted(
        restrictedRole({
          reachable_memberships: ["aifactory_analytics", "legacy_reader"],
        }),
      ),
    ).toBe(false);
  });

  it("fails closed for direct runtime legacy grants, column grants, and schema CREATE", () => {
    const { roleIsRestricted } = telemetrySinkInternals;
    expect(
      roleIsRestricted(
        restrictedRole({
          reachable_table_grants: [
            "analytics.schema_migrations:SELECT",
            "analytics.telemetry_events:INSERT",
            "legacy.players:SELECT",
          ],
        }),
      ),
    ).toBe(false);
    expect(
      roleIsRestricted(
        restrictedRole({
          reachable_column_grants: ["legacy.players.email:SELECT"],
        }),
      ),
    ).toBe(false);
    expect(
      roleIsRestricted(
        restrictedRole({
          reachable_schema_grants: ["analytics:USAGE", "public:CREATE"],
        }),
      ),
    ).toBe(false);
    expect(roleIsRestricted(restrictedRole({ database_create: true }))).toBe(
      false,
    );
  });

  it("does not enable the sink with broad application credentials", async () => {
    const poolFactory = vi.fn();
    const sink = await createTelemetrySink({
      environment: {
        ...enabledEnvironment,
        DATABASE_URL: "postgresql://broad",
      },
      poolFactory,
    });

    expect(sink.status()).toBe("degraded");
    expect(sink.migrationAttestation()).toEqual({
      state: "unverified",
      version: null,
      checksum: null,
    });
    expect(poolFactory).not.toHaveBeenCalled();
  });

  it("uses verified TLS, checks the named migration directly after later migrations, and writes idempotently", async () => {
    const fixture = poolWith([
      [restrictedRole()],
      [
        {
          version: TELEMETRY_MIGRATION_VERSION,
          checksum: TELEMETRY_MIGRATION_CHECKSUM,
        },
        { version: "c003-future", checksum: "b".repeat(64) },
        { version: "c002-future", checksum: "c".repeat(64) },
      ],
    ]);
    const insert = vi.fn(async () => {});
    const writer: TelemetryWriter = { insert };
    const poolFactory = vi.fn(() => fixture.pool);
    const sink = await createTelemetrySink({
      environment: enabledEnvironment,
      poolFactory,
      writerFactory: () => writer,
    });

    expect(poolFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        max: 2,
        ssl: { rejectUnauthorized: true },
        connectionString: expect.not.stringContaining("sslmode"),
      }),
    );
    expect(fixture.query.mock.calls[1]?.[0]).toContain("WHERE version = $1");
    expect(fixture.query.mock.calls[1]?.[1]).toEqual([
      TELEMETRY_MIGRATION_VERSION,
    ]);
    expect(sink.status()).toBe("ready");
    expect(sink.migrationAttestation()).toEqual({
      state: "verified",
      version: TELEMETRY_MIGRATION_VERSION,
      checksum: TELEMETRY_MIGRATION_CHECKSUM,
    });

    await sink.accept([event()], new Date(event().occurredAt));
    expect(insert).toHaveBeenCalledWith(
      [event()],
      new Date(event().occurredAt),
    );
    await expect(
      sink.accept([event(), event()], new Date(event().occurredAt)),
    ).rejects.toBeInstanceOf(TelemetryUnavailableError);
    expect(insert).toHaveBeenCalledOnce();
    await sink.close();
    expect(fixture.end).toHaveBeenCalledOnce();
  });

  it("reports an actual observed migration mismatch, not a desired version", async () => {
    const fixture = poolWith([
      [restrictedRole()],
      [{ version: "c002-other", checksum: "b".repeat(64) }],
    ]);
    const sink = await createTelemetrySink({
      environment: enabledEnvironment,
      poolFactory: () => fixture.pool,
      writerFactory: () => ({ insert: async () => {} }),
    });

    expect(sink.status()).toBe("degraded");
    expect(sink.migrationAttestation()).toEqual({
      state: "mismatch",
      version: "c002-other",
      checksum: "b".repeat(64),
    });
    await sink.close();
  });

  it("retains a verified attestation during a transient insert outage and recovers by probing", async () => {
    const fixture = poolWith([
      [restrictedRole()],
      [
        {
          version: TELEMETRY_MIGRATION_VERSION,
          checksum: TELEMETRY_MIGRATION_CHECKSUM,
        },
      ],
    ]);
    const timer = { unref: vi.fn() };
    const setTimer = vi.fn(() => timer) as unknown as typeof setTimeout;
    const clearTimer = vi.fn() as unknown as typeof clearTimeout;
    const sink = await createTelemetrySink({
      environment: enabledEnvironment,
      poolFactory: () => fixture.pool,
      writerFactory: () => ({
        insert: async () => {
          throw new Error("temporary database outage");
        },
      }),
      setTimer,
      clearTimer,
    });

    await expect(
      sink.accept([event()], new Date(event().occurredAt)),
    ).rejects.toBeInstanceOf(TelemetryUnavailableError);
    expect(sink.status()).toBe("degraded");
    expect(sink.migrationAttestation()).toMatchObject({
      state: "verified",
      version: TELEMETRY_MIGRATION_VERSION,
    });
    expect(setTimer).toHaveBeenCalledOnce();
    await sink.close();
    expect(clearTimer).toHaveBeenCalledOnce();
  });
});
