import { completedRunSummaryV1Schema } from "./schemas/completedRuns";
import type { GameStateV2 } from "./schemas/state";
import {
  COMMAND_SCHEMA_VERSION,
  COMPLETED_RUN_SUMMARY_SCHEMA_VERSION,
  SNAPSHOT_VERSION,
} from "../version";

/** Converts only completed, reconciled engine facts. Schema rejects invalid ledgers. */
export function buildCompletedRunSummary(input: {
  simulation: GameStateV2;
  runId: string;
  revision: number;
  checksum: string;
  completedAt: string;
}) {
  const { simulation: state } = input;
  if (state.clock.status !== "completed")
    throw new Error("The run has not completed.");
  const facts = state.facts;
  const ticks = state.clock.activeTick;
  const ratio = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
  return completedRunSummaryV1Schema.parse({
    summarySchemaVersion: COMPLETED_RUN_SUMMARY_SCHEMA_VERSION,
    runId: input.runId,
    rulesetVersion: state.rulesetVersion,
    snapshotVersion: SNAPSHOT_VERSION,
    commandSchemaVersion: COMMAND_SCHEMA_VERSION,
    completedSnapshotRevision: input.revision,
    completedSnapshotChecksum: input.checksum,
    completedAt: input.completedAt,
    completionKind: "gnt7",
    activeTime: {
      activeTicks: ticks,
      tickDurationMs: 1000,
      activeTimeSeconds: ticks,
    },
    money: {
      startingMoney: facts.startingMoney,
      endingMoney: state.money,
      totalSpend: facts.totalSpend,
      earnedRevenue: facts.earnedRevenue,
      externalFunding: facts.externalFunding,
      emergencyFunding: facts.emergencyFunding,
      otherCashAdjustments: facts.otherCashAdjustments,
      peakMoney: facts.peakMoney,
    },
    spendByCategory: facts.spendByCategory,
    customers: {
      peakB2B: facts.peakB2BCustomers,
      peakB2C: facts.peakB2CCustomers,
    },
    capacity: {
      pressureTicks: facts.capacityPressureTicks,
      pressureRatio: ratio(ticks ? facts.capacityPressureTicks / ticks : 0),
      shortfallRatioSum: facts.capacityShortfallRatioSum,
      meanShortfallRatio: ratio(
        ticks ? facts.capacityShortfallRatioSum / ticks : 0,
      ),
      peakShortfallRatio: facts.peakCapacityShortfallRatio,
    },
    interventions: {
      emergencyFunding: facts.emergencyFundingInterventions,
      emergencyCapacity: facts.emergencyCapacityInterventions,
    },
    progress: {
      finalEra: state.currentEra,
      erasReached: 6,
      trainingRunsCompleted: Object.values(state.training.runs).filter(
        (run) => run.status === "complete",
      ).length,
      breakthroughsCompleted: state.breakthroughs.filter(
        (item) => item.unlocked,
      ).length,
      breakthroughsAvailable: state.breakthroughs.length,
      finalModelCapability: Math.round(state.intelligence * 1_000) / 1_000,
    },
  });
}
