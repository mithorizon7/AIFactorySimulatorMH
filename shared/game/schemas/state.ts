import { z } from "zod";
import { Era } from "../domain/era";
import { TrainingStatus } from "../domain/gameState";
import { SUPPORTED_RULESET_VERSIONS, SNAPSHOT_VERSION } from "../../version";
import type { EngineEffect } from "./effects";

const finite = z.number().finite();
const nonnegative = finite.nonnegative();
const nonnegativeInteger = z.number().int().nonnegative();
const positiveInteger = z.number().int().positive();

export const clockStatusSchema = z.enum([
  "not_started",
  "running",
  "paused",
  "completed",
]);

export const simulationClockSchema = z
  .object({
    status: clockStatusSchema,
    activeTick: nonnegativeInteger,
  })
  .strict();

export const randomStateSchema = z
  .object({
    algorithm: z.literal("xorshift32-v1"),
    seed: z.number().int().positive().max(0xffff_ffff),
    state: z.number().int().positive().max(0xffff_ffff),
    draws: nonnegativeInteger,
  })
  .strict();

export const spendCategorySchema = z.enum([
  "compute",
  "data",
  "algorithm",
  "commercial",
  "regulationResilience",
  "training",
]);

export const runFactsAccumulatorSchema = z
  .object({
    startingMoney: nonnegative,
    totalSpend: nonnegative,
    spendByCategory: z
      .object({
        compute: nonnegative,
        data: nonnegative,
        algorithm: nonnegative,
        commercial: nonnegative,
        regulationResilience: nonnegative,
        training: nonnegative,
      })
      .strict(),
    earnedRevenue: nonnegative,
    externalFunding: nonnegative,
    emergencyFunding: nonnegative,
    otherCashAdjustments: finite,
    peakMoney: nonnegative,
    peakB2BCustomers: nonnegativeInteger,
    peakB2CCustomers: nonnegativeInteger,
    capacityPressureTicks: nonnegativeInteger,
    capacityShortfallRatioSum: nonnegative,
    peakCapacityShortfallRatio: nonnegative,
    emergencyFundingInterventions: nonnegativeInteger,
    emergencyCapacityInterventions: nonnegativeInteger,
  })
  .strict();

export const mechanicalLedgerSchema = z
  .object({
    appliedRecoveryGrantIds: z.array(z.string().min(1)).max(64),
    appliedBreakthroughEffectIds: z.array(positiveInteger).max(256),
    appliedCommandIds: z.array(z.string().uuid()).max(100_000),
    nextEffectSequence: nonnegativeInteger,
    lastSeedFundingTick: nonnegativeInteger.nullable(),
    lastInvestorFundingTick: nonnegativeInteger.nullable(),
  })
  .strict();

export const trainingRunSchema = z
  .object({
    targetEra: z.nativeEnum(Era),
    status: z.nativeEnum(TrainingStatus),
    daysRequired: positiveInteger,
    daysRemaining: nonnegativeInteger,
    computeRequired: nonnegative,
    moneyCost: nonnegative,
    computePerCustomer: nonnegative,
    isTrainingReserveActive: z.boolean(),
    intelligenceGain: nonnegative,
    prerequisites: z
      .object({
        compute: nonnegativeInteger,
        data: z
          .object({
            quality: nonnegativeInteger,
            quantity: nonnegativeInteger,
            formats: nonnegativeInteger,
          })
          .strict(),
        algorithm: z
          .object({
            architectures: nonnegativeInteger,
            researchProgress: nonnegative,
          })
          .strict(),
        computeInputs: z
          .object({
            electricity: nonnegativeInteger,
            hardware: nonnegativeInteger,
            regulation: nonnegativeInteger,
          })
          .strict(),
      })
      .strict(),
    name: z.string(),
    description: z.string(),
    realWorldParallel: z.string(),
  })
  .strict();

export const breakthroughSchema = z
  .object({
    id: positiveInteger,
    name: z.string(),
    description: z.string(),
    unlocked: z.boolean(),
    requiredLevels: z
      .object({
        compute: nonnegativeInteger.optional(),
        data: nonnegativeInteger.optional(),
        algorithm: nonnegativeInteger.optional(),
      })
      .strict(),
    type: z.enum(["compute", "data", "algorithm", "combined"]),
    realWorldParallel: z.string(),
    gameEffect: z.string(),
    contributingFactors: z.string(),
    era: z.nativeEnum(Era).optional(),
  })
  .strict();

export const gameEventSchema = z
  .object({
    id: positiveInteger,
    title: z.string(),
    description: z.string(),
    triggered: z.boolean(),
    era: z.nativeEnum(Era),
    effect: z
      .object({
        type: z.enum([
          "compute",
          "data",
          "algorithm",
          "money",
          "regulation",
          "hardware",
          "multiple",
        ]),
        impact: z.enum(["positive", "negative", "mixed"]),
        magnitude: nonnegative,
      })
      .strict(),
    realWorldContext: z.string(),
  })
  .strict();

export const investmentMilestoneSchema = z
  .object({
    id: positiveInteger,
    name: z.string(),
    requiredIntelligence: nonnegative,
    funding: nonnegative,
    unlocked: z.boolean(),
    era: z.nativeEnum(Era),
    description: z.string(),
    realWorldParallel: z.string(),
  })
  .strict();

export const gameStateSchema = z
  .object({
    rulesetVersion: z.enum(SUPPORTED_RULESET_VERSIONS),
    snapshotSchemaVersion: z.literal(SNAPSHOT_VERSION),
    clock: simulationClockSchema,
    random: randomStateSchema,
    money: nonnegative,
    intelligence: nonnegative,
    currentEra: z.nativeEnum(Era),
    daysElapsed: nonnegativeInteger,
    training: z
      .object({
        active: z.boolean(),
        daysRemaining: nonnegativeInteger,
        computeReserved: nonnegative,
        algorithmResearchProgress: nonnegative.max(100),
        algorithmResearchRate: nonnegative,
        runs: z
          .object({
            [Era.GNT3]: trainingRunSchema,
            [Era.GNT4]: trainingRunSchema,
            [Era.GNT5]: trainingRunSchema,
            [Era.GNT6]: trainingRunSchema,
            [Era.GNT7]: trainingRunSchema,
          })
          .strict(),
      })
      .strict(),
    resources: z
      .object({
        compute: nonnegative,
        data: nonnegative,
        algorithm: nonnegative,
      })
      .strict(),
    production: z
      .object({
        compute: nonnegative,
        data: nonnegative,
        algorithm: nonnegative,
      })
      .strict(),
    levels: z
      .object({
        compute: positiveInteger,
        data: positiveInteger,
        algorithm: positiveInteger,
      })
      .strict(),
    computeCapacity: z
      .object({
        available: nonnegative,
        used: nonnegative,
        maxCapacity: nonnegative,
        freeCompute: nonnegative,
        customerUsage: nonnegative,
        breakthroughMultiplier: nonnegative,
      })
      .strict(),
    computeInputs: z
      .object({
        money: positiveInteger,
        electricity: positiveInteger,
        hardware: positiveInteger,
        regulation: positiveInteger,
      })
      .strict(),
    dataInputs: z
      .object({
        quality: positiveInteger,
        quantity: positiveInteger,
        formats: positiveInteger,
      })
      .strict(),
    algorithmInputs: z
      .object({
        architectures: positiveInteger,
        researchEngineers: nonnegativeInteger,
      })
      .strict(),
    revenue: z
      .object({
        b2b: nonnegative,
        b2c: nonnegative,
        investors: nonnegative,
        apiAvailable: z.boolean(),
        chatbotAvailable: z.boolean(),
        apiPlatformBuilt: z.boolean(),
        apiPlatformCost: nonnegative,
        chatbotPlatformBuilt: z.boolean(),
        chatbotPlatformCost: nonnegative,
        apiEnabled: z.boolean(),
        chatbotEnabled: z.boolean(),
        developers: nonnegativeInteger,
        developerGrowthRate: nonnegative,
        baseApiRate: nonnegative,
        developerToolsLevel: nonnegativeInteger,
        developerToolsCost: nonnegative,
        subscribers: nonnegativeInteger,
        subscriberGrowthRate: nonnegative,
        monthlyFee: nonnegative,
        chatbotImprovementLevel: nonnegativeInteger,
        chatbotImprovementCost: nonnegative,
        marketingCampaignCost: nonnegative,
        lastMarketingCampaign: nonnegativeInteger,
      })
      .strict(),
    investmentMilestones: z.array(investmentMilestoneSchema),
    nextMilestoneId: positiveInteger,
    bonuses: z
      .object({
        computeToData: nonnegative,
        computeToAlgorithm: nonnegative,
        computeToIntelligence: nonnegative,
        dataToCompute: nonnegative,
        dataToAlgorithm: nonnegative,
        dataToIntelligence: nonnegative,
        algorithmToCompute: nonnegative,
        algorithmToData: nonnegative,
        algorithmToIntelligence: nonnegative,
      })
      .strict(),
    upgradeCosts: z
      .object({
        compute: nonnegative,
        data: nonnegative,
        algorithm: nonnegative,
      })
      .strict(),
    breakthroughs: z.array(breakthroughSchema),
    events: z.array(gameEventSchema),
    currentGoal: z
      .object({ id: positiveInteger, progress: nonnegative })
      .strict(),
    agiThreshold: nonnegative,
    facts: runFactsAccumulatorSchema,
    mechanics: mechanicalLedgerSchema,
  })
  .strict();

export type ClockStatus = z.infer<typeof clockStatusSchema>;
export type SimulationClock = z.infer<typeof simulationClockSchema>;
export type RandomState = z.infer<typeof randomStateSchema>;
export type SpendCategory = z.infer<typeof spendCategorySchema>;
export type RunFactsAccumulator = z.infer<typeof runFactsAccumulatorSchema>;
export type MechanicalLedger = z.infer<typeof mechanicalLedgerSchema>;
export type GameStateV2 = z.infer<typeof gameStateSchema>;

export interface EngineResult {
  state: GameStateV2;
  effects: EngineEffect[];
  acceptedCommandId?: string;
}

export function parseGameState(input: unknown): GameStateV2 {
  return gameStateSchema.parse(input);
}
