import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  childEnvironment,
  classifyCanary,
  readCanaryConfiguration,
  normalizeTelemetryStatus,
  migrationEvidence,
  verifyCoreResponses,
} from "./canary-policy.mjs";

const startedAt = new Date().toISOString();
const directory = path.resolve("output/canary");
await mkdir(directory, { recursive: true });
let report;
try {
  const configuration = readCanaryConfiguration(process.env);
  const request = async (pathname) => {
    const response = await fetch(new URL(pathname, configuration.origin), {
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
      headers: { "Sec-GPC": "1" },
    });
    if (response.status !== 200) throw new Error("CORE_HTTP_STATUS");
    return response.json();
  };
  let core = {
    health: false,
    readiness: false,
    identity: false,
    artifact: false,
  };
  let telemetry = "unknown";
  let migration = { state: "unverified", matches: true, verified: false };
  let browser = { status: "not_run", passed: 0, failed: 0, other: 0 };
  try {
    const [health, ready, version, metadata] = await Promise.all([
      request("/api/healthz"),
      request("/api/readyz"),
      request("/api/version"),
      request("/build-meta.json"),
    ]);
    core = verifyCoreResponses(configuration, health, ready, version, metadata);
    migration = migrationEvidence(configuration, version?.data);
    const value = ready?.data?.telemetry;
    telemetry = normalizeTelemetryStatus(value);
    if (Object.values(core).every(Boolean)) {
      const browserPath = path.join(directory, `browser-${randomUUID()}.json`);
      const child = spawnSync(
        process.execPath,
        [
          "node_modules/@playwright/test/cli.js",
          "test",
          "--config=scripts/canary-playwright.config.ts",
        ],
        {
          env: childEnvironment(process.env, configuration, browserPath),
          stdio: "ignore",
          timeout: 540_000,
        },
      );
      try {
        const parsed = JSON.parse(await readFile(browserPath, "utf8"));
        if (
          ["passed", "failed", "inconclusive"].includes(parsed.status) &&
          [parsed.passed, parsed.failed, parsed.other].every(
            (value) => Number.isInteger(value) && value >= 0 && value <= 100,
          )
        )
          browser = parsed;
        if (
          browser.status === "passed" &&
          (browser.passed !== 2 || browser.failed !== 0 || browser.other !== 0)
        )
          browser.status = "inconclusive";
      } catch {
        /* Missing/invalid evidence is inconclusive, never healthy. */
      }
      if (child.status !== 0 && browser.status === "passed")
        browser.status = "inconclusive";
      // Fence a deployment change during the browser sequence, not just startup.
      const finalVersion = await request("/api/version");
      const finalMetadata = await request("/build-meta.json");
      const finalMigration = migrationEvidence(
        configuration,
        finalVersion?.data,
      );
      core.identity = verifyCoreResponses(
        configuration,
        health,
        ready,
        finalVersion,
        finalMetadata,
      ).identity;
      core.artifact = finalMetadata?.buildSha === configuration.buildSha;
      migration = {
        ...finalMigration,
        verified: migration.verified && finalMigration.verified,
      };
    }
  } catch {
    core = { ...core, requestCompleted: false };
  }
  const classification = classifyCanary(
    core,
    browser.status,
    telemetry,
    migration.verified,
  );
  report = {
    schemaVersion: 1,
    startedAt,
    finishedAt: new Date().toISOString(),
    origin: configuration.origin,
    expectedBuildSha: configuration.buildSha,
    expectedRulesetVersion: configuration.rulesetVersion,
    expectedMigrationVersion: configuration.migrationVersion,
    ...classification,
    core,
    browser: {
      status: browser.status,
      passed: browser.passed,
      failed: browser.failed,
      other: browser.other,
    },
    telemetry,
    migrationAttestationState: migration.state,
    migrationReleaseVerified: migration.verified,
  };
} catch {
  report = {
    schemaVersion: 1,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: "configuration_error",
    exitCode: 2,
    rollback: "none",
  };
}
await writeFile(
  path.join(directory, "report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report));
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `### Production canary\n\nStatus: ${report.status}. Core rollback: ${report.rollback}.\n\nBrowser cases: ${report.browser?.passed ?? 0} passed, ${report.browser?.failed ?? 0} failed. Migration sign-off verified: ${report.migrationReleaseVerified ?? false}. Schedule is best effort, not an SLA.\n`,
  );
}
if (report.status === "telemetry_degraded")
  console.log(
    "::warning::Telemetry degraded; core remains playable. No telemetry-only rollback.",
  );
if (report.status === "migration_unverified")
  console.log(
    "::warning::Migration attestation is unverified. Synthetic core checks remain authoritative; no telemetry-only rollback and no migration release sign-off.",
  );
if (report.status === "core_failed")
  console.log(
    "::error::Core canary failed. Investigate and confirm against the rollback runbook; no automatic rollback was performed.",
  );
process.exitCode = report.exitCode;
