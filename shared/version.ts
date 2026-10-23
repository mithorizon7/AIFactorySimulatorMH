export const RULESET_VERSION = "release-a.1";
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
    migrationVersion,
  };
}
