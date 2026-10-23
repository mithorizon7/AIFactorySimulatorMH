import { z } from "zod";
import { SUPPORTED_RULESET_VERSIONS } from "../version";

export const TELEMETRY_SCHEMA_VERSION = 1;
export const TELEMETRY_MIGRATION_VERSION = "c001-telemetry-research";
export const OUTBOX_DATABASE_VERSION = 2;
export const OUTBOX_STORE = "telemetryOutbox";
export const OUTBOX_MAX_EVENTS = 100;
export const OUTBOX_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const TELEMETRY_RETENTION_DAYS = 90;
export const RESEARCH_RETENTION_DAYS = 180;

const base = {
  schemaVersion: z.literal(TELEMETRY_SCHEMA_VERSION),
  eventId: z.string().uuid(),
  runId: z.string().uuid(),
  buildSha: z.string().regex(/^[0-9a-f]{40}$/),
  rulesetVersion: z.enum(SUPPORTED_RULESET_VERSIONS),
  occurredAt: z.string().datetime(),
};
const empty = z.object({}).strict();
const era = z.enum(["GNT-2", "GNT-3", "GNT-4", "GNT-5", "GNT-6", "GNT-7"]);
// Each event has its own closed payload: this is deliberately not a generic
// property bag. No raw assessment answers, text, state or commands can enter it.
export const telemetryEventSchema = z.discriminatedUnion("type", [
  z
    .object({ ...base, type: z.literal("run_started"), properties: empty })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("first_investment"),
      properties: z
        .object({ activeTick: z.number().int().nonnegative().max(86400) })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("training_completed"),
      properties: z
        .object({ era, activeTick: z.number().int().nonnegative().max(86400) })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("era_reached"),
      properties: z.object({ era }).strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("run_completed"),
      properties: z
        .object({
          activeTick: z.number().int().nonnegative().max(86400),
          emergencyInterventions: z.number().int().nonnegative().max(1000),
        })
        .strict(),
    })
    .strict(),
  z
    .object({ ...base, type: z.literal("debrief_viewed"), properties: empty })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("save_recovery"),
      properties: z
        .object({
          outcome: z.enum(["recovered", "unavailable", "unsupported"]),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("assessment_completed"),
      properties: z
        .object({
          phase: z.enum(["pre", "post"]),
          correct: z.number().int().min(0).max(5),
          questionCount: z.literal(5),
          assessmentVersion: z.literal("pilot-v1"),
        })
        .strict(),
    })
    .strict(),
]);
export type TelemetryEvent = z.infer<typeof telemetryEventSchema>;
export type TelemetryIntent = TelemetryEvent extends infer T
  ? T extends TelemetryEvent
    ? Pick<T, "type" | "properties">
    : never
  : never;
export const telemetryBatchSchema = z
  .object({ events: z.array(telemetryEventSchema).min(1).max(20) })
  .strict();
export const outboxRecordSchema = z
  .object({
    event: telemetryEventSchema,
    queuedAt: z.number().int().nonnegative(),
    attempts: z.number().int().min(0).max(16),
    nextAttemptAt: z.number().int().nonnegative(),
  })
  .strict();
export type OutboxRecord = z.infer<typeof outboxRecordSchema>;
export type TelemetryStatus = "not_configured" | "ready" | "degraded";
export interface MigrationAttestation {
  state: "not_configured" | "unverified" | "verified" | "mismatch";
  version: string | null;
  checksum: string | null;
}
export interface TelemetrySink {
  status(): TelemetryStatus;
  migrationVersion(): string | null;
  migrationAttestation(): MigrationAttestation;
  accept(events: TelemetryEvent[], receivedAt: Date): Promise<void>;
  close(): Promise<void>;
}
export function clientTimeIsBounded(
  occurredAt: string,
  receivedAt: number,
): boolean {
  const time = Date.parse(occurredAt);
  return (
    Number.isFinite(time) &&
    time >= receivedAt - OUTBOX_MAX_AGE_MS &&
    time <= receivedAt + 5 * 60 * 1000
  );
}
