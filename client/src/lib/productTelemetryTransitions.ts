import type { TelemetryIntent } from "@shared/telemetry/contracts";
import type { RulesetVersion } from "@shared/version";

/** Deliberately scalar projection: this boundary cannot accept a saved run. */
export interface ProductTelemetryFrame {
  runId: string;
  rulesetVersion: RulesetVersion;
  writable: boolean;
  activeTick: number;
  status: "not_started" | "running" | "paused" | "completed";
  era: "GNT-2" | "GNT-3" | "GNT-4" | "GNT-5" | "GNT-6" | "GNT-7";
  nonTrainingSpend: number;
  emergencyInterventions: number;
  debriefViewed: boolean;
}

// Capture only transitions observed in this mounted document. Hydration and
// enabling consent mid-run do not manufacture past events. Analysts deduplicate
// lifecycle events by run ID; these are not verified participant counts.
export function observedProductTransitions(
  before: ProductTelemetryFrame | null,
  after: ProductTelemetryFrame,
): TelemetryIntent[] {
  if (
    !before ||
    before.runId !== after.runId ||
    before.rulesetVersion !== after.rulesetVersion ||
    after.activeTick < before.activeTick ||
    !before.writable ||
    !after.writable
  )
    return [];
  const events: TelemetryIntent[] = [];
  if (
    before.status === "not_started" &&
    after.status === "running" &&
    before.activeTick === 0
  )
    events.push({ type: "run_started", properties: {} });
  if (before.nonTrainingSpend === 0 && after.nonTrainingSpend > 0)
    events.push({
      type: "first_investment",
      properties: { activeTick: after.activeTick },
    });
  const eras = ["GNT-2", "GNT-3", "GNT-4", "GNT-5", "GNT-6", "GNT-7"];
  if (eras.indexOf(after.era) === eras.indexOf(before.era) + 1) {
    events.push({
      type: "training_completed",
      properties: { era: after.era, activeTick: after.activeTick },
    });
    events.push({ type: "era_reached", properties: { era: after.era } });
  }
  if (before.status !== "completed" && after.status === "completed")
    events.push({
      type: "run_completed",
      properties: {
        activeTick: after.activeTick,
        emergencyInterventions: after.emergencyInterventions,
      },
    });
  if (!before.debriefViewed && after.debriefViewed)
    events.push({ type: "debrief_viewed", properties: {} });
  return events;
}
