import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { TelemetryEvent } from "../../shared/telemetry/contracts";

export const analyticsSchema = pgSchema("analytics");
export const schemaMigrations = analyticsSchema.table("schema_migrations", {
  version: varchar("version", { length: 64 }).primaryKey(),
  checksum: varchar("checksum", { length: 64 }).notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const telemetryEvents = analyticsSchema.table(
  "telemetry_events",
  {
    eventId: uuid("event_id").primaryKey(),
    runId: uuid("run_id").notNull(),
    buildSha: varchar("build_sha", { length: 40 }).notNull(),
    rulesetVersion: varchar("ruleset_version", { length: 32 }).notNull(),
    schemaVersion: integer("schema_version").notNull(),
    eventType: varchar("event_type", { length: 40 }).notNull(),
    properties: jsonb("properties")
      .$type<TelemetryEvent["properties"]>()
      .notNull(),
    clientOccurredAt: timestamp("client_occurred_at", {
      withTimezone: true,
    }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("telemetry_events_expiry_idx").on(table.expiresAt)],
);

// Never imported by the application's telemetry writer. These tables have
// distinct credentials and are operated only by the consented-study custodian.
export const researchSchema = pgSchema("research");
export const activeStudies = researchSchema.table("active_studies", {
  studyId: varchar("study_id", { length: 32 }).primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
});
export const studyResponses = researchSchema.table(
  "study_responses",
  {
    responseId: uuid("response_id").primaryKey(),
    studyId: varchar("study_id", { length: 32 }).notNull(),
    participantId: uuid("participant_id").notNull(),
    withdrawalHash: varchar("withdrawal_hash", { length: 64 }).notNull(),
    consentVersion: varchar("consent_version", { length: 32 }).notNull(),
    assessmentVersion: varchar("assessment_version", { length: 32 }).notNull(),
    phase: varchar("phase", { length: 4 }).notNull(),
    answers: text("answers").array().notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("study_responses_expiry_idx").on(table.expiresAt)],
);
