export const SUPPORTED_RULESET_VERSIONS = [
  "release-a.1",
  "release-b.1",
] as const;
export type RulesetVersion = (typeof SUPPORTED_RULESET_VERSIONS)[number];
export const LEGACY_RULESET_VERSION = "release-a.1" as const;
// New runs use the calibrated B rules; saved runs retain their own version.
// Production promotion remains gated on the complete release acceptance suite.
export const RULESET_VERSION: RulesetVersion = "release-b.1";
export function isSupportedRuleset(value: unknown): value is RulesetVersion {
  return SUPPORTED_RULESET_VERSIONS.some((version) => version === value);
}
export const SNAPSHOT_VERSION = 1;
export const COMMAND_SCHEMA_VERSION = 1;
export const COMPLETED_RUN_SUMMARY_SCHEMA_VERSION = 1;
export const PERSONAL_BEST_SCHEMA_VERSION = 1;

export interface VersionInfo {
  buildSha: string | null;
  rulesetVersion: string;
  snapshotVersion: number;
  commandSchemaVersion: number;
  completedRunSummarySchemaVersion: number;
  personalBestSchemaVersion: number;
  scoreAlgorithmVersion: string | null;
  profileClassifierVersion: string | null;
  migrationVersion: string | null;
}

export function getVersionInfo(
  buildSha: string | null = null,
  migrationVersion: string | null = null,
): VersionInfo {
  return {
    buildSha,
    rulesetVersion: RULESET_VERSION,
    snapshotVersion: SNAPSHOT_VERSION,
    commandSchemaVersion: COMMAND_SCHEMA_VERSION,
    completedRunSummarySchemaVersion: COMPLETED_RUN_SUMMARY_SCHEMA_VERSION,
    personalBestSchemaVersion: PERSONAL_BEST_SCHEMA_VERSION,
    scoreAlgorithmVersion: null,
    profileClassifierVersion: null,
    migrationVersion,
  };
}
