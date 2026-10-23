import pg from "pg";
import { createHash } from "node:crypto";
import {
  applyAdditiveMigration,
  readMigration,
} from "../server/telemetry/migration";

async function main() {
  const [operation, ...flags] = process.argv.slice(2);
  const apply = flags.includes("--apply");
  const deleting = flags.includes("--confirm-delete-expired");
  if (
    !["migrate", "retention", "withdraw"].includes(operation) ||
    flags.some(
      (flag) => !["--apply", "--confirm-delete-expired"].includes(flag),
    )
  )
    throw new Error(
      "Usage: manage-pilot-data.ts migrate|retention|withdraw [--apply] [--confirm-delete-expired]",
    );
  if (operation === "migrate" && !apply) {
    const { version, checksum } = await readMigration();
    console.log(JSON.stringify({ mode: "dry_run", version, checksum }));
  } else {
    // Never inherit the app's owner-level fallback URLs. Pass this variable only
    // to this short-lived operator process, not the application deployment.
    const connectionString = process.env.PILOT_DATA_OPERATOR_URL;
    if (!connectionString)
      throw new Error(
        "PILOT_DATA_OPERATOR_URL is required for this operator process",
      );
    const url = new URL(connectionString);
    const local =
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      (url.searchParams.get("host") ?? "").startsWith("/private/tmp/");
    if (
      !local &&
      (url.searchParams.has("sslmode") || url.searchParams.has("ssl"))
    )
      throw new Error(
        "Remove URL SSL options; this operator enforces certificate verification",
      );
    const client = new pg.Client({
      connectionString,
      ssl: local ? false : { rejectUnauthorized: true },
      connectionTimeoutMillis: 5000,
      statement_timeout: 15000,
      application_name: "aifactory-data-operator",
    });
    try {
      await client.connect();
      if (operation === "migrate")
        console.log(
          JSON.stringify(await applyAdditiveMigration(client, apply)),
        );
      else {
        await client.query("BEGIN");
        try {
          await client.query("SET LOCAL lock_timeout = '5s'");
          const code = process.env.PILOT_WITHDRAWAL_CODE;
          if (
            operation === "withdraw" &&
            (!code || !/^[A-Za-z0-9_-]{32,128}$/.test(code))
          )
            throw new Error(
              "A valid process-only PILOT_WITHDRAWAL_CODE is required",
            );
          const hash = code
            ? createHash("sha256").update(code).digest("hex")
            : null;
          const researchPredicate =
            operation === "withdraw"
              ? "withdrawal_hash = $1"
              : "expires_at <= statement_timestamp()";
          const parameters = operation === "withdraw" ? [hash] : [];
          const research = await client.query(
            `SELECT count(*)::int AS count FROM research.study_responses WHERE ${researchPredicate}`,
            parameters,
          );
          const product =
            operation === "retention"
              ? await client.query(
                  "SELECT count(*)::int AS count FROM analytics.telemetry_events WHERE expires_at <= statement_timestamp()",
                )
              : null;
          if (apply && !deleting)
            throw new Error(
              "Deletion requires --confirm-delete-expired after reviewing the dry-run counts and authorization",
            );
          if (apply) {
            await client.query(
              `DELETE FROM research.study_responses WHERE ${researchPredicate}`,
              parameters,
            );
            if (operation === "retention")
              await client.query(
                "DELETE FROM analytics.telemetry_events WHERE expires_at <= statement_timestamp()",
              );
          }
          await client.query("COMMIT");
          console.log(
            JSON.stringify({
              operation,
              mode: apply ? "applied" : "dry_run",
              researchRows: research.rows[0].count,
              productRows: product?.rows[0].count ?? 0,
            }),
          );
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }
    } catch {
      // pg errors can include connection details, queries and private values.
      console.error(
        "Data operation failed; inspect through the authorized custodian channel. No credentials or response contents are logged.",
      );
      process.exitCode = 1;
    } finally {
      await client.end().catch(() => {});
    }
  }
}
main().catch(() => {
  // Includes malformed connection URLs and configuration errors: Node's default
  // uncaught-error formatter may otherwise print the supplied URL as `input`.
  console.error(
    "Data operation rejected. Check operation flags and process-only configuration through the authorized custodian channel.",
  );
  process.exitCode = 1;
});
