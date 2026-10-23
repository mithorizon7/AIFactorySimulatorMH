const productionOrigins = new Set([
  "https://aifactorysimulation.com",
  "https://ai-factory-mithorizon.replit.app",
]);

export function readCanaryConfiguration(env) {
  const url = new URL(env.BASE_URL ?? "");
  const loopback =
    env.CANARY_ALLOW_LOOPBACK === "1" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (!productionOrigins.has(url.origin) && !loopback) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("CANARY_ORIGIN_NOT_APPROVED");
  if (!/^[a-f0-9]{40}$/.test(env.EXPECTED_BUILD_SHA ?? ""))
    throw new Error("CANARY_EXPECTED_FULL_SHA_REQUIRED");
  if (!/^release-[a-z]\.\d+$/.test(env.EXPECTED_RULESET_VERSION ?? ""))
    throw new Error("CANARY_EXPECTED_RULESET_REQUIRED");
  const migration = env.EXPECTED_MIGRATION_VERSION;
  if (!migration || !/^(?:null|[a-zA-Z0-9_.-]{1,80})$/.test(migration))
    throw new Error("CANARY_EXPECTED_MIGRATION_REQUIRED");
  const checksum = env.EXPECTED_MIGRATION_CHECKSUM;
  if (migration !== "null" && !/^[a-f0-9]{64}$/.test(checksum ?? ""))
    throw new Error("CANARY_EXPECTED_MIGRATION_CHECKSUM_REQUIRED");
  return {
    origin: url.origin,
    buildSha: env.EXPECTED_BUILD_SHA,
    rulesetVersion: env.EXPECTED_RULESET_VERSION,
    snapshotVersion: 1,
    commandSchemaVersion: 1,
    migrationVersion: migration === "null" ? null : migration,
    migrationChecksum: migration === "null" ? null : checksum,
  };
}

export function migrationEvidence(configuration, data) {
  const attestation = data?.migrationAttestation;
  if (attestation === undefined) {
    const matches = data?.migrationVersion === configuration.migrationVersion;
    return { state: "legacy", matches, verified: matches };
  }
  const state = [
    "not_configured",
    "unverified",
    "verified",
    "mismatch",
  ].includes(attestation?.state)
    ? attestation.state
    : "unverified";
  if (state === "mismatch") return { state, matches: false, verified: false };
  if (state === "verified") {
    const matches =
      attestation.version === configuration.migrationVersion &&
      attestation.checksum === configuration.migrationChecksum;
    return { state, matches, verified: matches };
  }
  if (state === "not_configured" && configuration.migrationVersion === null)
    return { state, matches: true, verified: true };
  // No verified DB observation is not evidence of a wrong migration. Continue
  // the authoritative synthetic core check, but never close migration sign-off.
  return { state, matches: true, verified: false };
}

export function verifyCoreResponses(
  configuration,
  health,
  ready,
  version,
  metadata,
) {
  const data = version?.data;
  return {
    health: health?.data?.status === "ok",
    readiness:
      ready?.data?.status === "ready" && ready?.data?.rulesetLoaded === true,
    artifact: metadata?.buildSha === configuration.buildSha,
    identity:
      data?.buildSha === configuration.buildSha &&
      data?.rulesetVersion === configuration.rulesetVersion &&
      data?.snapshotVersion === configuration.snapshotVersion &&
      data?.commandSchemaVersion === configuration.commandSchemaVersion &&
      migrationEvidence(configuration, data).matches,
  };
}

export function classifyCanary(
  core,
  browser,
  telemetry,
  migrationVerified = true,
) {
  if (
    Object.values(core).some((value) => value === false) ||
    browser === "failed"
  )
    return { status: "core_failed", exitCode: 1, rollback: "investigate_core" };
  if (browser !== "passed")
    return { status: "inconclusive", exitCode: 2, rollback: "none" };
  if (!migrationVerified)
    return { status: "migration_unverified", exitCode: 0, rollback: "none" };
  if (telemetry === "degraded" || telemetry === "unknown")
    return { status: "telemetry_degraded", exitCode: 0, rollback: "none" };
  return { status: "healthy", exitCode: 0, rollback: "none" };
}

export function normalizeTelemetryStatus(value) {
  return [
    "not_configured",
    "ready",
    "degraded",
    "healthy",
    "ok",
    "disabled",
  ].includes(value)
    ? value
    : "unknown";
}

export function childEnvironment(env, configuration, reportPath) {
  const permitted = ["PATH", "HOME", "TMPDIR", "PLAYWRIGHT_BROWSERS_PATH"];
  return {
    ...Object.fromEntries(
      permitted.filter((key) => env[key]).map((key) => [key, env[key]]),
    ),
    BASE_URL: configuration.origin,
    EXPECTED_BUILD_SHA: configuration.buildSha,
    EXPECTED_RULESET_VERSION: configuration.rulesetVersion,
    EXPECTED_MIGRATION_VERSION: configuration.migrationVersion ?? "null",
    ...(configuration.migrationChecksum
      ? { EXPECTED_MIGRATION_CHECKSUM: configuration.migrationChecksum }
      : {}),
    CANARY_BROWSER_REPORT: reportPath,
    CI: "1",
  };
}
