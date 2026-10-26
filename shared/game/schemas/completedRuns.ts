import { z } from "../../validation";
import { Era, ERA_ORDER } from "../domain/era";
import {
  COMMAND_SCHEMA_VERSION,
  COMPLETED_RUN_SUMMARY_SCHEMA_VERSION,
  PERSONAL_BEST_SCHEMA_VERSION,
  SNAPSHOT_VERSION,
} from "../../version";

const MONEY_TOLERANCE = 0.01;
const RATIO_TOLERANCE = 0.000001;

function normalizedNumber(decimals: number, minimum?: number) {
  const factor = 10 ** decimals;
  let schema = z.number().finite();
  if (minimum !== undefined) schema = schema.min(minimum);
  return schema.refine(
    (value) => Math.abs(value * factor - Math.round(value * factor)) < 1e-8,
    `Must be normalized to ${decimals} decimal places`,
  );
}

export const versionStringSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);
export const isoTimestampSchema = z.string().datetime({ offset: true });
export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
export const currencySchema = normalizedNumber(2, 0);
export const signedCurrencySchema = normalizedNumber(2);
export const ratioSchema = normalizedNumber(6, 0).refine(
  (value) => value <= 1,
  "Must be a ratio from 0 through 1",
);
export const nonnegativeSixDecimalSchema = normalizedNumber(6, 0);
export const capabilitySchema = normalizedNumber(3, 0);
export const eraSchema = z.nativeEnum(Era);

export const spendByCategorySchema = z
  .object({
    compute: currencySchema,
    data: currencySchema,
    algorithm: currencySchema,
    commercial: currencySchema,
    regulationResilience: currencySchema,
    training: currencySchema,
  })
  .strict();

export const completedRunSummaryV1Schema = z
  .object({
    summarySchemaVersion: z.literal(COMPLETED_RUN_SUMMARY_SCHEMA_VERSION),
    runId: z.string().uuid(),
    rulesetVersion: versionStringSchema,
    snapshotVersion: z.literal(SNAPSHOT_VERSION),
    commandSchemaVersion: z.literal(COMMAND_SCHEMA_VERSION),
    completedSnapshotRevision: z.number().int().nonnegative(),
    completedSnapshotChecksum: sha256Schema,
    completedAt: isoTimestampSchema,
    completionKind: z.literal("gnt7"),
    activeTime: z
      .object({
        activeTicks: z.number().int().nonnegative(),
        tickDurationMs: z.literal(1000),
        activeTimeSeconds: z.number().int().nonnegative(),
      })
      .strict(),
    money: z
      .object({
        startingMoney: currencySchema,
        endingMoney: currencySchema,
        totalSpend: currencySchema,
        earnedRevenue: currencySchema,
        externalFunding: currencySchema,
        emergencyFunding: currencySchema,
        otherCashAdjustments: signedCurrencySchema,
        peakMoney: currencySchema,
      })
      .strict(),
    spendByCategory: spendByCategorySchema,
    customers: z
      .object({
        peakB2B: z.number().int().nonnegative(),
        peakB2C: z.number().int().nonnegative(),
      })
      .strict(),
    capacity: z
      .object({
        pressureTicks: z.number().int().nonnegative(),
        pressureRatio: ratioSchema,
        shortfallRatioSum: nonnegativeSixDecimalSchema,
        meanShortfallRatio: ratioSchema,
        peakShortfallRatio: ratioSchema,
      })
      .strict(),
    interventions: z
      .object({
        emergencyFunding: z.number().int().nonnegative(),
        emergencyCapacity: z.number().int().nonnegative(),
      })
      .strict(),
    progress: z
      .object({
        finalEra: eraSchema,
        erasReached: z.number().int().min(1).max(ERA_ORDER.length),
        trainingRunsCompleted: z.number().int().min(0).max(5),
        breakthroughsCompleted: z.number().int().nonnegative(),
        breakthroughsAvailable: z.number().int().nonnegative(),
        finalModelCapability: capabilitySchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((summary, context) => {
    const issue = (path: Array<string | number>, message: string) =>
      context.addIssue({ code: z.ZodIssueCode.custom, path, message });

    if (
      summary.activeTime.activeTimeSeconds !== summary.activeTime.activeTicks
    ) {
      issue(
        ["activeTime", "activeTimeSeconds"],
        "Release A active seconds must equal active ticks",
      );
    }

    const categorizedSpend = Object.values(summary.spendByCategory).reduce(
      (total, value) => total + value,
      0,
    );
    if (
      Math.abs(summary.money.totalSpend - categorizedSpend) > MONEY_TOLERANCE
    ) {
      issue(
        ["money", "totalSpend"],
        "Total spend must reconcile to the six spend categories",
      );
    }

    const reconciledEndingMoney =
      summary.money.startingMoney +
      summary.money.earnedRevenue +
      summary.money.externalFunding +
      summary.money.otherCashAdjustments -
      summary.money.totalSpend;
    if (
      Math.abs(summary.money.endingMoney - reconciledEndingMoney) >
      MONEY_TOLERANCE
    ) {
      issue(
        ["money", "endingMoney"],
        "Ending money must reconcile to starting money, flows, and spend",
      );
    }
    if (summary.money.emergencyFunding > summary.money.externalFunding) {
      issue(
        ["money", "emergencyFunding"],
        "Emergency funding must be a subset of external funding",
      );
    }
    if (
      summary.money.peakMoney <
      Math.max(summary.money.startingMoney, summary.money.endingMoney)
    ) {
      issue(
        ["money", "peakMoney"],
        "Peak money cannot be below starting or ending money",
      );
    }

    if (summary.capacity.pressureTicks > summary.activeTime.activeTicks) {
      issue(
        ["capacity", "pressureTicks"],
        "Capacity pressure ticks cannot exceed active ticks",
      );
    }
    const expectedPressureRatio = summary.activeTime.activeTicks
      ? summary.capacity.pressureTicks / summary.activeTime.activeTicks
      : 0;
    if (
      Math.abs(summary.capacity.pressureRatio - expectedPressureRatio) >
      RATIO_TOLERANCE
    ) {
      issue(
        ["capacity", "pressureRatio"],
        "Capacity pressure ratio must derive from active ticks",
      );
    }
    const expectedMeanShortfall = summary.activeTime.activeTicks
      ? summary.capacity.shortfallRatioSum / summary.activeTime.activeTicks
      : 0;
    if (
      Math.abs(summary.capacity.meanShortfallRatio - expectedMeanShortfall) >
      RATIO_TOLERANCE
    ) {
      issue(
        ["capacity", "meanShortfallRatio"],
        "Mean shortfall ratio must derive from active ticks",
      );
    }
    if (
      summary.capacity.peakShortfallRatio < summary.capacity.meanShortfallRatio
    ) {
      issue(
        ["capacity", "peakShortfallRatio"],
        "Peak shortfall ratio cannot be below mean shortfall ratio",
      );
    }

    if (
      summary.progress.breakthroughsCompleted >
      summary.progress.breakthroughsAvailable
    ) {
      issue(
        ["progress", "breakthroughsCompleted"],
        "Completed breakthroughs cannot exceed available breakthroughs",
      );
    }
    if (
      summary.progress.finalEra !== Era.GNT7 ||
      summary.progress.trainingRunsCompleted !== 5
    ) {
      issue(
        ["progress"],
        "GNT-7 completion requires the final era and all five training runs",
      );
    }
  });

const personalBestBase = {
  personalBestSchemaVersion: z.literal(PERSONAL_BEST_SCHEMA_VERSION),
  rulesetVersion: versionStringSchema,
  runId: z.string().uuid(),
  summarySchemaVersion: z.literal(COMPLETED_RUN_SUMMARY_SCHEMA_VERSION),
  sourceSnapshotChecksum: sha256Schema,
  completedAt: isoTimestampSchema,
};

export const personalBestRecordV1Schema = z.discriminatedUnion("metric", [
  z
    .object({
      ...personalBestBase,
      metric: z.literal("active_time_seconds"),
      direction: z.literal("min"),
      unit: z.literal("seconds"),
      value: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      ...personalBestBase,
      metric: z.literal("total_spend"),
      direction: z.literal("min"),
      unit: z.literal("currency"),
      value: currencySchema,
    })
    .strict(),
  z
    .object({
      ...personalBestBase,
      metric: z.literal("earned_revenue"),
      direction: z.literal("max"),
      unit: z.literal("currency"),
      value: currencySchema,
    })
    .strict(),
  z
    .object({
      ...personalBestBase,
      metric: z.literal("mean_capacity_shortfall_ratio"),
      direction: z.literal("min"),
      unit: z.literal("ratio"),
      value: ratioSchema,
    })
    .strict(),
  z
    .object({
      ...personalBestBase,
      metric: z.literal("emergency_interventions"),
      direction: z.literal("min"),
      unit: z.literal("count"),
      value: z.number().int().nonnegative(),
    })
    .strict(),
]);

export type CompletedRunSummaryV1 = z.infer<typeof completedRunSummaryV1Schema>;
export type PersonalBestRecordV1 = z.infer<typeof personalBestRecordV1Schema>;
export type PersonalBestMetric = PersonalBestRecordV1["metric"];
