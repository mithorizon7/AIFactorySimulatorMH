import {
  boolean,
  index,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Operator-only definitions. No application entry point imports this module,
// and no study ingestion/reader credentials are accepted by the app runtime.
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
