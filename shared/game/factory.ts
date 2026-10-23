import { createInitialGameState } from "./domain/gameState";
import {
  isSupportedRuleset,
  SNAPSHOT_VERSION,
  type RulesetVersion,
} from "../version";
import { gameStateSchema, type GameStateV2 } from "./schemas/state";

export interface FreshGameStateOptions {
  ruleset: RulesetVersion;
  seed: number;
}

const ZERO_SEED_FALLBACK = 0x6d2b_79f5;

export function normalizeSeed(seed: number): number {
  if (!Number.isInteger(seed)) {
    throw new TypeError("seed must be an integer");
  }

  const unsigned = seed >>> 0;
  return unsigned === 0 ? ZERO_SEED_FALLBACK : unsigned;
}

/**
 * Creates a completely independent simulation graph. Run/session lifecycle is
 * intentionally absent: callers own run IDs, abandonment, and replacement.
 */
export function createFreshGameState({
  ruleset,
  seed,
}: FreshGameStateOptions): GameStateV2 {
  if (!isSupportedRuleset(ruleset)) {
    throw new RangeError(`Unsupported ruleset: ${ruleset}`);
  }

  const legacy = createInitialGameState();
  const {
    isRunning: _isRunning,
    timeElapsed: _timeElapsed,
    tutorial: _tutorial,
    narrativeFlags: _narrativeFlags,
    victoryStats: _victoryStats,
    ...simulation
  } = legacy;
  const randomSeed = normalizeSeed(seed);

  return gameStateSchema.parse({
    ...simulation,
    rulesetVersion: ruleset,
    snapshotSchemaVersion: SNAPSHOT_VERSION,
    computeCapacity: {
      ...simulation.computeCapacity,
      freeCompute:
        simulation.computeCapacity.freeCompute ??
        simulation.computeCapacity.available,
      customerUsage: simulation.computeCapacity.customerUsage ?? 0,
      breakthroughMultiplier:
        simulation.computeCapacity.breakthroughMultiplier ?? 1,
    },
    clock: { status: "not_started", activeTick: 0 },
    random: {
      algorithm: "xorshift32-v1",
      seed: randomSeed,
      state: randomSeed,
      draws: 0,
    },
    facts: {
      startingMoney: simulation.money,
      totalSpend: 0,
      spendByCategory: {
        compute: 0,
        data: 0,
        algorithm: 0,
        commercial: 0,
        regulationResilience: 0,
        training: 0,
      },
      earnedRevenue: 0,
      externalFunding: 0,
      emergencyFunding: 0,
      otherCashAdjustments: 0,
      peakMoney: simulation.money,
      peakB2BCustomers: 0,
      peakB2CCustomers: 0,
      capacityPressureTicks: 0,
      capacityShortfallRatioSum: 0,
      peakCapacityShortfallRatio: 0,
      emergencyFundingInterventions: 0,
      emergencyCapacityInterventions: 0,
    },
    mechanics: {
      appliedRecoveryGrantIds: [],
      appliedBreakthroughEffectIds: [],
      appliedCommandIds: [],
      nextEffectSequence: 0,
      lastSeedFundingTick: null,
      lastInvestorFundingTick: null,
    },
  });
}
