import { migrationEvidence } from "./canary-policy.mjs";

const baseUrl = process.env.BASE_URL;
const expectedBuildSha = process.env.EXPECTED_BUILD_SHA;
const expectedRuleset = process.env.EXPECTED_RULESET_VERSION;
const expectedMigration = process.env.EXPECTED_MIGRATION_VERSION ?? "null";
const expectedChecksum = process.env.EXPECTED_MIGRATION_CHECKSUM;
if (
  !/^(?:null|[A-Za-z0-9_.-]{1,80})$/.test(expectedMigration) ||
  (expectedMigration !== "null" &&
    !/^[a-f0-9]{64}$/.test(expectedChecksum ?? ""))
)
  throw new Error(
    "Non-null migrations require an independently expected version and SHA-256 checksum.",
  );

if (!baseUrl || !expectedBuildSha || !expectedRuleset) {
  throw new Error(
    "BASE_URL, EXPECTED_BUILD_SHA and EXPECTED_RULESET_VERSION are required.",
  );
}
if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i.test(expectedBuildSha)) {
  throw new Error(
    "EXPECTED_BUILD_SHA must be a full 40- or 64-character commit SHA.",
  );
}

async function jsonRequest(pathname, init) {
  const response = await fetch(new URL(pathname, baseUrl), {
    ...init,
    signal: AbortSignal.timeout(10_000),
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `${pathname} returned non-JSON content type ${contentType}.`,
    );
  }
  return { response, body: await response.json() };
}

const health = await jsonRequest("/api/healthz");
if (health.response.status !== 200 || health.body?.data?.status !== "ok") {
  throw new Error(`Health check failed: ${JSON.stringify(health.body)}`);
}
const csp = health.response.headers.get("content-security-policy") ?? "";
if (!csp.includes("script-src 'self'") || /unsafe-eval/.test(csp)) {
  throw new Error(
    "An enforced self-only script CSP without unsafe-eval is required.",
  );
}
if (health.response.headers.has("x-powered-by")) {
  throw new Error("Production must not expose x-powered-by.");
}
if (health.response.headers.get("cache-control") !== "no-store") {
  throw new Error("API responses must use Cache-Control: no-store.");
}
if (new URL(baseUrl).protocol === "https:") {
  const hsts = health.response.headers.get("strict-transport-security") ?? "";
  if (
    !/max-age=(\d+)/i.test(hsts) ||
    Number(hsts.match(/max-age=(\d+)/i)[1]) < 31536000
  ) {
    throw new Error("The HTTPS edge must enforce HSTS for at least one year.");
  }
}

const readiness = await jsonRequest("/api/readyz");
if (
  readiness.response.status !== 200 ||
  readiness.body?.data?.status !== "ready" ||
  readiness.body?.data?.rulesetLoaded !== true
) {
  throw new Error(`Core readiness failed: ${JSON.stringify(readiness.body)}`);
}

const version = await jsonRequest("/api/version");
if (version.response.status !== 200) {
  throw new Error(`Version endpoint failed with ${version.response.status}.`);
}
if (version.body?.data?.buildSha !== expectedBuildSha) {
  throw new Error(
    `Served SHA ${version.body?.data?.buildSha ?? "null"} does not match ${expectedBuildSha}.`,
  );
}
if (version.body?.data?.rulesetVersion !== expectedRuleset) {
  throw new Error(
    `Served ruleset ${version.body?.data?.rulesetVersion ?? "null"} does not match ${expectedRuleset}.`,
  );
}
const migration = migrationEvidence(
  {
    migrationVersion: expectedMigration === "null" ? null : expectedMigration,
    migrationChecksum: expectedMigration === "null" ? null : expectedChecksum,
  },
  version.body?.data,
);
if (
  !migration.matches ||
  !migration.verified ||
  version.body?.data?.migrationVersion !==
    (expectedMigration === "null" ? null : expectedMigration)
) {
  throw new Error(
    "The served migration lacks the independently expected verified evidence.",
  );
}
const metadata = await jsonRequest("/build-meta.json");
if (
  metadata.response.status !== 200 ||
  metadata.body?.buildSha !== expectedBuildSha
)
  throw new Error(
    "The static artifact identity does not match the expected SHA.",
  );
const runtime = /^v22\.(\d+)\.(\d+)$/.exec(
  version.body?.data?.nodeVersion ?? "",
);
if (
  !runtime ||
  Number(runtime[1]) < 23 ||
  (Number(runtime[1]) === 23 && Number(runtime[2]) < 4)
) {
  throw new Error(
    "The served application must report patched Node 22.23.4 or newer 22.x.",
  );
}

for (const retired of [
  ["GET", "/api/game-state"],
  ["POST", "/api/game-state"],
  ["GET", "/api/leaderboard"],
  ["POST", "/api/leaderboard"],
  ["GET", "/api/ranking/999999"],
  ["POST", "/api/ranking/999999"],
  ["PUT", "/api/game-state"],
  ["PATCH", "/api/leaderboard"],
  ["DELETE", "/api/ranking/999999"],
]) {
  const [method, pathname] = retired;
  const result = await jsonRequest(pathname, {
    method,
    headers:
      method === "POST" ? { "content-type": "application/json" } : undefined,
    body: method === "POST" ? "{}" : undefined,
  });
  if (
    result.response.status !== 410 ||
    result.body?.error?.code !== "LEGACY_ENDPOINT_RETIRED"
  ) {
    throw new Error(`${method} ${pathname} is not safely retired.`);
  }
}

console.log(
  JSON.stringify({
    baseUrl,
    buildSha: version.body.data.buildSha,
    commandSchemaVersion: version.body.data.commandSchemaVersion,
    migrationVersion: version.body.data.migrationVersion,
    rulesetVersion: version.body.data.rulesetVersion,
    snapshotVersion: version.body.data.snapshotVersion,
    status: "release_truth_verified",
  }),
);
