import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  childEnvironment,
  classifyCanary,
  readCanaryConfiguration,
  normalizeTelemetryStatus,
  migrationEvidence,
  verifyCoreResponses,
} from "../../../scripts/canary-policy.mjs";
import CanaryReporter from "../../../scripts/canary-reporter.mjs";

const base = {
  BASE_URL: "https://aifactorysimulation.com",
  EXPECTED_BUILD_SHA: "a".repeat(40),
  EXPECTED_RULESET_VERSION: "release-b.1",
  EXPECTED_MIGRATION_VERSION: "null",
};
const healthyCore = {
  health: true,
  readiness: true,
  identity: true,
  artifact: true,
};
const source = (name: string) => readFileSync(path.resolve(name), "utf8");
const temporary: string[] = [];
const previousReport = process.env.CANARY_BROWSER_REPORT;
afterEach(() => {
  if (previousReport === undefined) delete process.env.CANARY_BROWSER_REPORT;
  else process.env.CANARY_BROWSER_REPORT = previousReport;
  for (const directory of temporary.splice(0))
    rmSync(directory, { recursive: true });
});

describe("production canary safety and evidence policy", () => {
  it("uses runner context only in step environments, not the pre-runner job environment", () => {
    const workflow = source(".github/workflows/production-canary.yml");
    const beforeSteps = workflow.split("    steps:")[0];
    expect(beforeSteps).not.toContain("${{ runner.");
    expect(
      workflow.match(/PLAYWRIGHT_BROWSERS_PATH: \$\{\{ runner\.temp \}\}/g),
    ).toHaveLength(2);
  });

  it("requires an explicit full deployed identity instead of inferring main", () => {
    expect(readCanaryConfiguration(base).migrationVersion).toBeNull();
    for (const key of [
      "EXPECTED_BUILD_SHA",
      "EXPECTED_RULESET_VERSION",
      "EXPECTED_MIGRATION_VERSION",
    ]) {
      expect(() => readCanaryConfiguration({ ...base, [key]: "" })).toThrow();
    }
    expect(() =>
      readCanaryConfiguration({ ...base, EXPECTED_BUILD_SHA: "abc123" }),
    ).toThrow();
    expect(
      readCanaryConfiguration({
        ...base,
        EXPECTED_MIGRATION_VERSION: "c-telemetry-1",
        EXPECTED_MIGRATION_CHECKSUM: "f".repeat(64),
      }).migrationVersion,
    ).toBe("c-telemetry-1");
  });

  it("requires the independent checksum for non-null expected migrations", () => {
    expect(() =>
      readCanaryConfiguration({
        ...base,
        EXPECTED_MIGRATION_VERSION: "c001-telemetry-research",
      }),
    ).toThrow();
    expect(() =>
      readCanaryConfiguration({
        ...base,
        EXPECTED_MIGRATION_VERSION: "c001-telemetry-research",
        EXPECTED_MIGRATION_CHECKSUM: "short",
      }),
    ).toThrow();
  });

  it("preserves legacy exact migration matching when no attestation exists", () => {
    const configuration = readCanaryConfiguration(base);
    expect(
      migrationEvidence(configuration, { migrationVersion: null }),
    ).toEqual({ state: "legacy", matches: true, verified: true });
    expect(
      migrationEvidence(configuration, { migrationVersion: "wrong" }).matches,
    ).toBe(false);
  });

  it("never verifies a non-null migration from its matching legacy marker alone", () => {
    const configuration = readCanaryConfiguration({
      ...base,
      EXPECTED_MIGRATION_VERSION: "c001-telemetry-research",
      EXPECTED_MIGRATION_CHECKSUM: "f".repeat(64),
    });
    const evidence = migrationEvidence(configuration, {
      migrationVersion: "c001-telemetry-research",
    });
    expect(evidence).toEqual({
      state: "legacy",
      matches: true,
      verified: false,
    });
    const core = verifyCoreResponses(
      configuration,
      { data: { status: "ok" } },
      { data: { status: "ready", rulesetLoaded: true } },
      { data: { ...configuration } },
      { buildSha: configuration.buildSha },
    );
    expect(core).toEqual(healthyCore);
    expect(classifyCanary(core, "passed", "ready", evidence.verified)).toEqual({
      status: "migration_unverified",
      exitCode: 0,
      rollback: "none",
    });
    expect(
      migrationEvidence(configuration, { migrationVersion: "wrong-nonnull" }),
    ).toEqual({
      state: "legacy",
      matches: false,
      verified: false,
    });
  });

  it("distinguishes cold-start DB uncertainty from a proven migration mismatch", () => {
    const configuration = readCanaryConfiguration({
      ...base,
      EXPECTED_MIGRATION_VERSION: "c001-telemetry-research",
      EXPECTED_MIGRATION_CHECKSUM: "f".repeat(64),
    });
    const uncertain = migrationEvidence(configuration, {
      migrationVersion: null,
      migrationAttestation: {
        state: "unverified",
        version: null,
        checksum: null,
      },
    });
    expect(uncertain).toEqual({
      state: "unverified",
      matches: true,
      verified: false,
    });
    expect(
      classifyCanary(healthyCore, "passed", "degraded", uncertain.verified),
    ).toEqual({
      status: "migration_unverified",
      exitCode: 0,
      rollback: "none",
    });
    expect(
      migrationEvidence(configuration, {
        migrationAttestation: { state: "not_configured" },
      }).verified,
    ).toBe(false);
    const mismatch = migrationEvidence(configuration, {
      migrationAttestation: {
        state: "mismatch",
        version: "private-remote-value",
        checksum: "private-value",
      },
    });
    expect(mismatch).toEqual({
      state: "mismatch",
      matches: false,
      verified: false,
    });
    expect(
      classifyCanary(
        { ...healthyCore, identity: mismatch.matches },
        "passed",
        "degraded",
        false,
      ).status,
    ).toBe("core_failed");
  });

  it("detects same-version wrong checksum without reporting remote values", () => {
    const configuration = readCanaryConfiguration({
      ...base,
      EXPECTED_MIGRATION_VERSION: "c001-telemetry-research",
      EXPECTED_MIGRATION_CHECKSUM: "f".repeat(64),
    });
    const result = (version: string, checksum: string) =>
      migrationEvidence(configuration, {
        migrationAttestation: { state: "verified", version, checksum },
      });
    expect(result(configuration.migrationVersion, "f".repeat(64))).toEqual({
      state: "verified",
      matches: true,
      verified: true,
    });
    expect(result(configuration.migrationVersion, "e".repeat(64)).matches).toBe(
      false,
    );
    expect(result("wrong", "f".repeat(64)).matches).toBe(false);
    expect(
      JSON.stringify(result("private-version", "private-checksum")),
    ).not.toMatch(/private/);
    expect(
      migrationEvidence(configuration, {
        migrationAttestation: { state: "unexpected-secret" },
      }).state,
    ).toBe("unverified");
  });

  it.each([
    "https://example.com",
    "https://aifactorysimulation.com.evil.invalid",
    "https://name:secret@aifactorysimulation.com",
    "https://aifactorysimulation.com/path",
    "https://aifactorysimulation.com/?secret=value",
    "https://aifactorysimulation.com/#token",
    "http://aifactorysimulation.com",
    "http://127.0.0.1:5016",
  ])("rejects unapproved or credential-bearing target %s", (url) => {
    expect(() => readCanaryConfiguration({ ...base, BASE_URL: url })).toThrow();
  });

  it("allows only explicitly enabled loopback for isolated local rehearsal", () => {
    expect(
      readCanaryConfiguration({
        ...base,
        BASE_URL: "http://127.0.0.1:5016",
        CANARY_ALLOW_LOOPBACK: "1",
      }).origin,
    ).toBe("http://127.0.0.1:5016");
    expect(() =>
      readCanaryConfiguration({
        ...base,
        BASE_URL: "http://10.0.0.1:5016",
        CANARY_ALLOW_LOOPBACK: "1",
      }),
    ).toThrow();
  });

  it("checks all core version fields without trusting returned expectation values", () => {
    const configuration = readCanaryConfiguration(base);
    const version = { data: { ...configuration } };
    const health = { data: { status: "ok" } };
    const ready = {
      data: { status: "ready", rulesetLoaded: true, telemetry: "degraded" },
    };
    const metadata = { buildSha: configuration.buildSha };
    expect(
      verifyCoreResponses(configuration, health, ready, version, metadata),
    ).toEqual(healthyCore);
    for (const [field, value] of Object.entries({
      buildSha: "b".repeat(40),
      rulesetVersion: "release-a.1",
      snapshotVersion: 2,
      commandSchemaVersion: 2,
      migrationVersion: "unexpected",
    })) {
      expect(
        verifyCoreResponses(
          configuration,
          health,
          ready,
          {
            data: { ...configuration, [field]: value },
          },
          metadata,
        ).identity,
      ).toBe(false);
    }
    expect(
      verifyCoreResponses(
        configuration,
        health,
        { data: { status: "not_ready", rulesetLoaded: false } },
        version,
        metadata,
      ).readiness,
    ).toBe(false);
    expect(
      verifyCoreResponses(configuration, health, ready, version, {
        buildSha: "b".repeat(40),
      }).artifact,
    ).toBe(false);
  });

  it("never turns telemetry-only degradation or missing browser evidence into rollback", () => {
    expect(classifyCanary(healthyCore, "passed", "degraded")).toEqual({
      status: "telemetry_degraded",
      exitCode: 0,
      rollback: "none",
    });
    expect(classifyCanary(healthyCore, "passed", "unknown").rollback).toBe(
      "none",
    );
    expect(classifyCanary(healthyCore, "not_run", "healthy")).toEqual({
      status: "inconclusive",
      exitCode: 2,
      rollback: "none",
    });
    expect(
      classifyCanary({ ...healthyCore, identity: false }, "passed", "degraded")
        .status,
    ).toBe("core_failed");
    expect(classifyCanary(healthyCore, "failed", "healthy").status).toBe(
      "core_failed",
    );
  });

  it("recognizes the frozen C ready telemetry contract without a false outage", () => {
    expect(normalizeTelemetryStatus("ready")).toBe("ready");
    expect(
      classifyCanary(healthyCore, "passed", normalizeTelemetryStatus("ready"))
        .status,
    ).toBe("healthy");
    expect(normalizeTelemetryStatus({ privateData: "not emitted" })).toBe(
      "unknown",
    );
  });

  it("does not pass arbitrary inherited secrets or Actions tokens to the browser child", () => {
    const env = childEnvironment(
      {
        ...base,
        PATH: "/bin",
        HOME: "/tmp",
        DATABASE_URL: "sensitive",
        GITHUB_TOKEN: "sensitive",
        STUDY_KEY: "sensitive",
        NODE_OPTIONS: "unsafe-preload",
      },
      readCanaryConfiguration(base),
      "/tmp/report.json",
    );
    expect(env).not.toHaveProperty("DATABASE_URL");
    expect(env).not.toHaveProperty("GITHUB_TOKEN");
    expect(env).not.toHaveProperty("STUDY_KEY");
    expect(env).not.toHaveProperty("NODE_OPTIONS");
  });

  it("reports only bounded counts, never error messages, test titles or attachments", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "canary-reporter-"));
    temporary.push(directory);
    process.env.CANARY_BROWSER_REPORT = path.join(directory, "report.json");
    const reporter = new CanaryReporter();
    reporter.onTestEnd(
      { title: "secret title" },
      {
        status: "failed",
        error: { message: "credential-value" },
        attachments: ["private-snapshot"],
      },
    );
    reporter.onEnd({ status: "failed" });
    const raw = source(process.env.CANARY_BROWSER_REPORT);
    expect(JSON.parse(raw)).toEqual({
      status: "failed",
      passed: 0,
      failed: 1,
      other: 0,
    });
    expect(raw).not.toMatch(/secret|credential|snapshot/);
  });

  it("does not accept zero, missing, skipped or excess tests as a healthy canary", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "canary-count-"));
    temporary.push(directory);
    process.env.CANARY_BROWSER_REPORT = path.join(directory, "report.json");
    for (const statuses of [
      [],
      ["passed"],
      ["passed", "skipped"],
      ["passed", "passed", "passed"],
    ]) {
      const reporter = new CanaryReporter();
      for (const status of statuses) reporter.onTestEnd({}, { status });
      reporter.onEnd({ status: "passed" });
      expect(JSON.parse(source(process.env.CANARY_BROWSER_REPORT)).status).toBe(
        "inconclusive",
      );
    }
    const reporter = new CanaryReporter();
    reporter.onTestEnd({}, { status: "passed" });
    reporter.onTestEnd({}, { status: "passed" });
    reporter.onEnd({ status: "passed" });
    expect(JSON.parse(source(process.env.CANARY_BROWSER_REPORT)).status).toBe(
      "passed",
    );
  });

  it("uses an opt-in read-only schedule and no private evidence uploads or local server", () => {
    const workflow = source(".github/workflows/production-canary.yml");
    expect(workflow).toContain("vars.PRODUCTION_CANARY_ENABLED == 'true'");
    expect(workflow).toContain('cron: "7,17,27,37,47,57 * * * *"');
    expect(workflow).toContain("contents: read");
    expect(workflow).not.toMatch(
      /upload-artifact|issues:\s*write|contents:\s*write|github\.sha/,
    );
    const config = source("scripts/canary-playwright.config.ts");
    expect(config).toContain("webServer: []");
    for (const option of ["trace", "screenshot", "video"])
      expect(config).toContain(`${option}: "off"`);
    const browser = source("scripts/canary-browser.spec.ts");
    expect(browser).toContain('import "../tests/e2e/session-lifecycle.spec"');
    expect(browser).toContain('"globalPrivacyControl", { value: true }');
    expect(browser).not.toContain("ai-factory.analytics-consent");
  });

  it("freezes exactly five questions and matching key without fabricated cohort evidence", () => {
    const assessment = source("docs/pilot/assessment-v1.md");
    expect(assessment.match(/^## Q[1-5] /gm)).toHaveLength(5);
    const key = source("docs/pilot/assessment-key-v1.md");
    for (const [question, answer] of [
      ["Q1", "B"],
      ["Q2", "C"],
      ["Q3", "A"],
      ["Q4", "D"],
      ["Q5", "B"],
    ]) {
      expect(key).toMatch(
        new RegExp(`\\| ${question}\\s+\\| ${answer}\\s+\\|`),
      );
    }
    expect(source("docs/pilot-operations.md")).toContain(
      "study collection disabled; recruitment not authorized",
    );
    expect(source("docs/pilot/evidence-template.md")).toContain(
      "Status: NOT COLLECTED",
    );
    expect(source("docs/pilot-operations.md")).toContain("`studyId: pilot-v1`");
    expect(source("docs/pilot-operations.md")).toContain(
      "`consentVersion: pilot-consent-v1`",
    );
    expect(key).toContain("Incomplete");
    expect(source("docs/pilot/data-boundaries-and-withdrawal.md")).toContain(
      "randomBytes(32)",
    );
  });
});
