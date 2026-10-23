import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  childEnvironment,
  classifyCanary,
  readCanaryConfiguration,
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
      }).migrationVersion,
    ).toBe("c-telemetry-1");
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
    expect(workflow).toContain('cron: "17,47 * * * *"');
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
  });
});
