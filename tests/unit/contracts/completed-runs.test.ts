import { describe, expect, it } from "vitest";
import { Era } from "../../../shared/game/domain/era";
import {
  completedRunSummaryV1Schema,
  personalBestRecordV1Schema,
  type CompletedRunSummaryV1,
} from "../../../shared/game/schemas/completedRuns";

function validSummary(): CompletedRunSummaryV1 {
  return {
    summarySchemaVersion: 1,
    runId: "11111111-1111-4111-8111-111111111111",
    rulesetVersion: "release-a.1",
    snapshotVersion: 1,
    commandSchemaVersion: 1,
    completedSnapshotRevision: 12,
    completedSnapshotChecksum: "a".repeat(64),
    completedAt: "2026-07-10T08:00:00.000Z",
    completionKind: "gnt7",
    activeTime: {
      activeTicks: 100,
      tickDurationMs: 1000,
      activeTimeSeconds: 100,
    },
    money: {
      startingMoney: 1000,
      endingMoney: 1140,
      totalSpend: 100,
      earnedRevenue: 50,
      externalFunding: 200,
      emergencyFunding: 50,
      otherCashAdjustments: -10,
      peakMoney: 1200,
    },
    spendByCategory: {
      compute: 20,
      data: 15,
      algorithm: 15,
      commercial: 10,
      regulationResilience: 10,
      training: 30,
    },
    customers: { peakB2B: 150, peakB2C: 250 },
    capacity: {
      pressureTicks: 20,
      pressureRatio: 0.2,
      shortfallRatioSum: 10,
      meanShortfallRatio: 0.1,
      peakShortfallRatio: 0.25,
    },
    interventions: { emergencyFunding: 1, emergencyCapacity: 1 },
    progress: {
      finalEra: Era.GNT7,
      erasReached: 6,
      trainingRunsCompleted: 5,
      breakthroughsCompleted: 18,
      breakthroughsAvailable: 21,
      finalModelCapability: 1000,
    },
  };
}

describe("completed-run factual contract", () => {
  it("accepts a fully reconciled factual GNT-7 summary", () => {
    expect(completedRunSummaryV1Schema.parse(validSummary())).toEqual(
      validSummary(),
    );
  });

  it("rejects subjective or unknown fields", () => {
    expect(
      completedRunSummaryV1Schema.safeParse({
        ...validSummary(),
        score: 100,
        strategyProfile: "resilient-operator",
      }).success,
    ).toBe(false);
  });

  it.each([
    [
      "active time",
      (value: CompletedRunSummaryV1) =>
        (value.activeTime.activeTimeSeconds = 99),
    ],
    [
      "spend ledger",
      (value: CompletedRunSummaryV1) => (value.spendByCategory.training = 29),
    ],
    [
      "cash ledger",
      (value: CompletedRunSummaryV1) => (value.money.endingMoney = 1139),
    ],
    [
      "funding subset",
      (value: CompletedRunSummaryV1) => (value.money.emergencyFunding = 201),
    ],
    [
      "peak cash",
      (value: CompletedRunSummaryV1) => (value.money.peakMoney = 999),
    ],
    [
      "pressure ticks",
      (value: CompletedRunSummaryV1) => (value.capacity.pressureTicks = 101),
    ],
    [
      "pressure ratio",
      (value: CompletedRunSummaryV1) => (value.capacity.pressureRatio = 0.3),
    ],
    [
      "mean shortfall",
      (value: CompletedRunSummaryV1) =>
        (value.capacity.meanShortfallRatio = 0.2),
    ],
    [
      "peak shortfall",
      (value: CompletedRunSummaryV1) =>
        (value.capacity.peakShortfallRatio = 0.05),
    ],
    [
      "breakthrough count",
      (value: CompletedRunSummaryV1) =>
        (value.progress.breakthroughsCompleted = 22),
    ],
    [
      "completion era",
      (value: CompletedRunSummaryV1) => (value.progress.finalEra = Era.GNT6),
    ],
    [
      "training completion",
      (value: CompletedRunSummaryV1) =>
        (value.progress.trainingRunsCompleted = 4),
    ],
  ])("rejects an invalid %s invariant", (_name, mutate) => {
    const summary = validSummary();
    mutate(summary);
    expect(completedRunSummaryV1Schema.safeParse(summary).success).toBe(false);
  });

  it("rejects values outside canonical numeric boundaries", () => {
    const summary = validSummary();
    summary.money.totalSpend = 100.001;
    expect(completedRunSummaryV1Schema.safeParse(summary).success).toBe(false);
  });
});

describe("personal-best factual contract", () => {
  const base = {
    personalBestSchemaVersion: 1 as const,
    rulesetVersion: "release-a.1",
    runId: "11111111-1111-4111-8111-111111111111",
    summarySchemaVersion: 1 as const,
    sourceSnapshotChecksum: "a".repeat(64),
    completedAt: "2026-07-10T08:00:00.000Z",
  };

  it.each([
    {
      metric: "active_time_seconds",
      direction: "min",
      unit: "seconds",
      value: 100,
    },
    { metric: "total_spend", direction: "min", unit: "currency", value: 100 },
    { metric: "earned_revenue", direction: "max", unit: "currency", value: 50 },
    {
      metric: "mean_capacity_shortfall_ratio",
      direction: "min",
      unit: "ratio",
      value: 0.1,
    },
    {
      metric: "emergency_interventions",
      direction: "min",
      unit: "count",
      value: 2,
    },
  ] as const)("accepts $metric with its fixed direction and unit", (metric) => {
    expect(
      personalBestRecordV1Schema.safeParse({ ...base, ...metric }).success,
    ).toBe(true);
  });

  it("rejects a metric paired with the wrong product value direction", () => {
    expect(
      personalBestRecordV1Schema.safeParse({
        ...base,
        metric: "earned_revenue",
        direction: "min",
        unit: "currency",
        value: 50,
      }).success,
    ).toBe(false);
  });
});
