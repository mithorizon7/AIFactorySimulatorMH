import {
  index,
  integer,
  jsonb,
  pgSchema,
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
