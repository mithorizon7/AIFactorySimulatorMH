import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { Client } from "pg";
import { TELEMETRY_MIGRATION_VERSION } from "../../shared/telemetry/contracts";

export async function readMigration() {
  const source = await readFile(
    new URL("../../migrations/c001-telemetry-research.sql", import.meta.url),
    "utf8",
  );
  return {
    version: TELEMETRY_MIGRATION_VERSION,
    source,
    checksum: createHash("sha256").update(source).digest("hex"),
  };
}
/** Process-only admin operation. Never called by build/start or HTTP handlers. */
export async function applyAdditiveMigration(client: Client, apply: boolean) {
  const migration = await readMigration();
  if (!apply)
    return {
      mode: "dry_run",
      version: migration.version,
      checksum: migration.checksum,
    };
  await client.query("BEGIN");
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query("SELECT pg_advisory_xact_lock(892437, 1)");
    const exists = await client.query(
      "SELECT to_regclass('analytics.schema_migrations') IS NOT NULL AS exists",
    );
    if (exists.rows[0]?.exists) {
      const applied = await client.query<{ checksum: string }>(
        "SELECT checksum FROM analytics.schema_migrations WHERE version = $1",
        [migration.version],
      );
      if (
        applied.rows.length !== 1 ||
        applied.rows[0].checksum !== migration.checksum
      )
        throw new Error(
          "Existing schema has an unrecognized migration or checksum",
        );
      await client.query("COMMIT");
      return {
        mode: "already_applied",
        version: migration.version,
        checksum: migration.checksum,
      };
    }
    await client.query(migration.source);
    await client.query(
      "INSERT INTO analytics.schema_migrations(version,checksum) VALUES ($1,$2)",
      [migration.version, migration.checksum],
    );
    await client.query("COMMIT");
    return {
      mode: "applied",
      version: migration.version,
      checksum: migration.checksum,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
