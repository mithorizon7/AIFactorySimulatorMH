import pg from "pg";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  applyAdditiveMigration,
  readMigration,
} from "../../server/telemetry/migration";

const connectionString = process.env.C_DB_TEST_ADMIN_URL;
if (!connectionString)
  throw new Error(
    "C_DB_TEST_ADMIN_URL must point to a disposable local PostgreSQL cluster",
  );
const location = new URL(connectionString);
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
  !(location.searchParams.get("host") ?? "").startsWith("/private/tmp/")
)
  throw new Error("Database qualification refuses nonlocal targets");
const admin = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 3000,
  statement_timeout: 5000,
});
const clients: pg.Client[] = [];
async function restricted(role: string) {
  const login = `test_${randomUUID().replaceAll("-", "")}`;
  // Generated test identifiers only, never user input or production credentials.
  await admin.query(
    `CREATE ROLE ${login} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS IN ROLE ${role}`,
  );
  const url = new URL(connectionString!);
  url.username = login;
  url.password = "";
  const client = new pg.Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 3000,
    statement_timeout: 5000,
  });
  clients.push(client);
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
