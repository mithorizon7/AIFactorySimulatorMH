import { describe, expect, it } from "vitest";
import {
  getVersionInfo,
  isSupportedRuleset,
  LEGACY_RULESET_VERSION,
  RULESET_VERSION,
} from "@shared/version";

describe("independent release identities", () => {
  it("does not invent scoring, classification or database migrations", () => {
    expect(getVersionInfo("a".repeat(40))).toMatchObject({
      buildSha: "a".repeat(40),
      rulesetVersion: RULESET_VERSION,
      scoreAlgorithmVersion: null,
      profileClassifierVersion: null,
      migrationVersion: null,
    });
    expect(getVersionInfo(null, "explicit-migration").migrationVersion).toBe(
      "explicit-migration",
    );
  });
  it("supports old runs without accepting unknown future mechanics", () => {
    expect(isSupportedRuleset(LEGACY_RULESET_VERSION)).toBe(true);
    expect(isSupportedRuleset("release-b.1")).toBe(true);
    expect(isSupportedRuleset("release-c.999")).toBe(false);
    expect(isSupportedRuleset(null)).toBe(false);
  });
});
