import pg from "pg";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  applyAdditiveMigration,
  readMigration,
} from "../../server/telemetry/migration";
import { operatorConnectionConfiguration } from "../../server/telemetry/operator-connection";

const connectionString = process.env.C_DB_TEST_ADMIN_URL;
if (!connectionString)
  throw new Error(
    "C_DB_TEST_ADMIN_URL must point to a disposable local PostgreSQL cluster",
  );
const admin = new pg.Client({
  ...operatorConnectionConfiguration(connectionString, true),
  connectionTimeoutMillis: 3000,
  statement_timeout: 5000,
});
const clients: pg.Client[] = [];
const urls = new WeakMap<pg.Client, string>();
async function restricted(role: string) {
  const login = `test_${randomUUID().replaceAll("-", "")}`;
  const password = randomUUID().replaceAll("-", "");
  // Generated test identifiers only, never user input or production credentials.
  await admin.query(
    `CREATE ROLE ${login} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS IN ROLE ${role}`,
  );
  const url = new URL(connectionString!);
  url.username = login;
  url.password = password;
  const client = new pg.Client({
    ...operatorConnectionConfiguration(url.toString(), true),
    connectionTimeoutMillis: 3000,
    statement_timeout: 5000,
  });
  clients.push(client);
  urls.set(client, url.toString());
  await client.connect();
  return client;
}
beforeAll(async () => {
  await admin.connect();
  await applyAdditiveMigration(admin, true);
});
afterAll(async () => {
  await Promise.all(clients.map((client) => client.end()));
  await admin.end();
});

describe("actual PostgreSQL additive schema and role boundaries", () => {
  it("dry-runs retention and withdrawal, requires deletion confirmation and never emits supplied credentials", async () => {
    const custodian = await restricted("aifactory_data_custodian");
    const code = "synthetic-withdrawal-code-0000000000";
    const withdrawalHash = createHash("sha256").update(code).digest("hex");
    const responseId = randomUUID();
    const expiredEventId = randomUUID();
    await admin.query(
      "INSERT INTO research.study_responses(response_id,study_id,participant_id,withdrawal_hash,consent_version,assessment_version,phase,answers) VALUES($1,'pilot-v1',$2,$3,'pilot-consent-v1','pilot-v1','post',$4)",
      [responseId, randomUUID(), withdrawalHash, ["A", "B", "C", "D", "A"]],
    );
    await admin.query(
      "INSERT INTO analytics.telemetry_events VALUES($1,$2,$3,'release-b.1',1,'run_started','{}',statement_timestamp()-interval '100 days',statement_timestamp()-interval '100 days',statement_timestamp()-interval '100 days'+interval '2160 hours')",
      [expiredEventId, randomUUID(), "a".repeat(40)],
    );
    const run = (
      operation: string,
      flags: string[] = [],
      overrides: Record<string, string> = {},
    ) =>
      spawnSync(
        process.execPath,
        [
          "--import",
          "tsx",
          path.resolve("scripts/manage-pilot-data.ts"),
          operation,
          ...flags,
        ],
        {
          encoding: "utf8",
          timeout: 15000,
          env: {
            ...process.env,
            PILOT_DATA_OPERATOR_URL: urls.get(custodian),
            PILOT_WITHDRAWAL_CODE: code,
            ...overrides,
          },
        },
      );
    const retention = run("retention");
    expect(retention.status).toBe(0);
    expect(JSON.parse(retention.stdout)).toMatchObject({
      mode: "dry_run",
      productRows: 1,
    });
    const rejected = run("retention", ["--apply"]);
    expect(rejected.status).toBe(1);
    expect(
      (
        await admin.query(
          "SELECT event_id FROM analytics.telemetry_events WHERE event_id=$1",
          [expiredEventId],
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      run("retention", ["--apply", "--confirm-delete-expired"]).status,
    ).toBe(0);
    expect(
      (
        await admin.query(
          "SELECT event_id FROM analytics.telemetry_events WHERE event_id=$1",
          [expiredEventId],
        )
      ).rows,
    ).toHaveLength(0);
    expect(JSON.parse(run("withdraw").stdout)).toMatchObject({
      mode: "dry_run",
      researchRows: 1,
    });
    expect(
      run("withdraw", ["--apply", "--confirm-delete-expired"]).status,
    ).toBe(0);
    expect(
      (
        await admin.query(
          "SELECT response_id FROM research.study_responses WHERE response_id=$1",
          [responseId],
        )
      ).rows,
    ).toHaveLength(0);
    const malformed = run("retention", [], {
      PILOT_DATA_OPERATOR_URL: "invalid-private-credential-marker",
    });
    expect(malformed.status).toBe(1);
    expect(malformed.stdout + malformed.stderr).not.toContain(
      "private-credential-marker",
    );
    expect(malformed.stdout + malformed.stderr).not.toContain(code);
  });
  it("records exact migration content and applies idempotently", async () => {
    const migration = await readMigration();
    expect(await applyAdditiveMigration(admin, true)).toMatchObject({
      mode: "already_applied",
      checksum: migration.checksum,
    });
    const result = await admin.query(
      "SELECT version,checksum FROM analytics.schema_migrations",
    );
    expect(result.rows).toEqual([
      { version: migration.version, checksum: migration.checksum },
    ]);
  });
  it("analytics can insert idempotently but cannot read research, events, legacy data or escalate", async () => {
    const client = await restricted("aifactory_analytics");
    const id = randomUUID();
    const query =
      "INSERT INTO analytics.telemetry_events VALUES ($1,$2,$3,'release-b.1',1,'run_started','{}',statement_timestamp(),statement_timestamp(),statement_timestamp()+interval '2160 hours') ON CONFLICT DO NOTHING";
    await expect(
      client.query(query, [id, randomUUID(), "a".repeat(40)]),
    ).resolves.toMatchObject({ rowCount: 1 });
    await expect(
      client.query(query, [id, randomUUID(), "a".repeat(40)]),
    ).resolves.toMatchObject({ rowCount: 0 });
    for (const sql of [
      "SELECT * FROM research.study_responses",
      "SELECT * FROM research.active_studies",
      "SELECT * FROM analytics.telemetry_events",
      "CREATE TABLE analytics.forbidden(id int)",
      "SET ROLE aifactory_researcher",
      "SET ROLE aifactory_data_custodian",
      "CREATE ROLE forbidden",
      "DELETE FROM analytics.telemetry_events",
    ])
      await expect(client.query(sql)).rejects.toMatchObject({ code: "42501" });
    expect(
      (await client.query("SELECT version FROM analytics.schema_migrations"))
        .rows,
    ).toHaveLength(1);
  });
  it("study submission is closed by default, insert-only after activation, with server-controlled retention", async () => {
    const submitter = await restricted("aifactory_study_submitter");
    const participant = randomUUID();
    const insert =
      "INSERT INTO research.study_responses(response_id,study_id,participant_id,withdrawal_hash,consent_version,assessment_version,phase,answers) VALUES($1,'pilot-v1',$2,$3,'pilot-consent-v1','pilot-v1','pre',$4)";
    const args = [
      randomUUID(),
      participant,
      "b".repeat(64),
      ["A", "B", "C", "D", "A"],
    ];
    await expect(submitter.query(insert, args)).rejects.toMatchObject({
      code: "42501",
    });
    await admin.query(
      "UPDATE research.active_studies SET enabled = true WHERE study_id = 'pilot-v1'",
    );
    try {
      await expect(submitter.query(insert, args)).resolves.toMatchObject({
        rowCount: 1,
      });
      await expect(
        submitter.query("SELECT * FROM research.study_responses"),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        submitter.query("DELETE FROM research.study_responses"),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        submitter.query("UPDATE research.active_studies SET enabled=false"),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        submitter.query(
          "INSERT INTO research.study_responses(response_id,received_at) VALUES($1,statement_timestamp())",
          [randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "42501" });
      const researcher = await restricted("aifactory_researcher");
      expect(
        (
          await researcher.query(
            "SELECT * FROM research.study_responses WHERE participant_id=$1",
            [participant],
          )
        ).rows,
      ).toHaveLength(1);
      await admin.query(
        "UPDATE research.active_studies SET enabled = false WHERE study_id = 'pilot-v1'",
      );
      expect(
        (await researcher.query("SELECT * FROM research.study_responses")).rows,
      ).toHaveLength(0);
      await expect(
        researcher.query(insert, [
          randomUUID(),
          randomUUID(),
          "b".repeat(64),
          ["A", "B", "C", "D", "A"],
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      const custodian = await restricted("aifactory_data_custodian");
      const rows = await custodian.query(
        "SELECT extract(epoch FROM expires_at-received_at)::int AS seconds FROM research.study_responses WHERE participant_id=$1",
        [participant],
      );
      expect(rows.rows).toEqual([{ seconds: 180 * 86400 }]);
    } finally {
      await admin.query(
        "UPDATE research.active_studies SET enabled = false WHERE study_id = 'pilot-v1'",
      );
    }
  });
});
