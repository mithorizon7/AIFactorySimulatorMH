import { getEraIndex, getNextEra, Era } from "./domain/era";
import { TrainingStatus } from "./domain/gameState";
import { expectedCash, roundMoney } from "./ledger";
import { gameStateSchema, type GameStateV2 } from "./schemas/state";

const roundCanonical = (value: number): number =>
  Math.round((Number.isFinite(value) ? value : 0) * 1_000_000) / 1_000_000;
const nonnegative = (value: number): number =>
  Math.max(0, roundCanonical(value));

export function calculateMaxComputeCapacity(state: GameStateV2): number {
  const computeLevelMultiplier = 2 ** Math.max(0, state.levels.compute - 1);
  const moneyMultiplier = 1 + Math.max(0, state.computeInputs.money - 1) * 0.12;
  const hardwareMultiplier =
    1 + Math.max(0, state.computeInputs.hardware - 1) * 0.15;
  const electricityMultiplier =
    1 + Math.max(0, state.computeInputs.electricity - 1) * 0.1;
  return Math.floor(
    2_000 *
      computeLevelMultiplier *
      moneyMultiplier *
      hardwareMultiplier *
      electricityMultiplier *
      state.computeCapacity.breakthroughMultiplier,
  );
}

export function trainingPrerequisitesMet(
  state: GameStateV2,
  targetEra: Era,
): boolean {
  const run =
    state.training.runs[targetEra as keyof typeof state.training.runs];
  return Boolean(
    run &&
    state.levels.compute >= run.prerequisites.compute &&
    state.dataInputs.quality >= run.prerequisites.data.quality &&
    state.dataInputs.quantity >= run.prerequisites.data.quantity &&
    state.dataInputs.formats >= run.prerequisites.data.formats &&
    state.algorithmInputs.architectures >=
      run.prerequisites.algorithm.architectures &&
    state.training.algorithmResearchProgress >=
      run.prerequisites.algorithm.researchProgress &&
    state.computeInputs.electricity >=
      run.prerequisites.computeInputs.electricity &&
    state.computeInputs.hardware >= run.prerequisites.computeInputs.hardware &&
    state.computeInputs.regulation >=
      run.prerequisites.computeInputs.regulation,
  );
}

export function assertGameStateInvariants(state: GameStateV2): void {
  if (state.daysElapsed !== state.clock.activeTick) {
    throw new Error(
      "clock invariant violated: daysElapsed must equal activeTick",
    );
  }
  if (state.facts.emergencyFunding > state.facts.externalFunding) {
    throw new Error(
      "funding invariant violated: emergency funding is not a subset",
    );
  }
  if (
    new Set(state.mechanics.appliedCommandIds).size !==
      state.mechanics.appliedCommandIds.length ||
    new Set(state.mechanics.appliedBreakthroughEffectIds).size !==
      state.mechanics.appliedBreakthroughEffectIds.length ||
    new Set(state.mechanics.appliedRecoveryGrantIds).size !==
      state.mechanics.appliedRecoveryGrantIds.length
  ) {
    throw new Error(
      "mechanical ledger invariant violated: duplicate applied ID",
    );
  }

  const currentIndex = getEraIndex(state.currentEra);
  const trainingEras = [
    Era.GNT3,
    Era.GNT4,
    Era.GNT5,
    Era.GNT6,
    Era.GNT7,
  ] as const;
  for (const era of trainingEras) {
    const run = state.training.runs[era];
    if (run.targetEra !== era) {
      throw new Error(
        `training invariant violated: ${era} target key mismatch`,
      );
    }
    const mustBeComplete = getEraIndex(era) <= currentIndex;
    if (mustBeComplete && run.status !== TrainingStatus.COMPLETE) {
      throw new Error(`training invariant violated: ${era} must be complete`);
    }
    if (!mustBeComplete && run.status === TrainingStatus.COMPLETE) {
      throw new Error(
        `training invariant violated: ${era} completed out of order`,
      );
    }
  }

  const inProgress = Object.values(state.training.runs).filter(
    (run) => run.status === TrainingStatus.IN_PROGRESS,
  );
  if (state.training.active) {
    const target = getNextEra(state.currentEra);
    if (
      !target ||
      inProgress.length !== 1 ||
      inProgress[0].targetEra !== target
    ) {
      throw new Error(
        "training invariant violated: active run is not the next era",
      );
    }
    if (
      state.training.computeReserved !== inProgress[0].computeRequired ||
      state.training.daysRemaining !== inProgress[0].daysRemaining
    ) {
      throw new Error(
        "training invariant violated: active reserve/countdown mismatch",
      );
    }
  } else if (inProgress.length > 0) {
    throw new Error(
      "training invariant violated: in-progress run without active training",
    );
  }

  if (
    state.clock.status === "completed" &&
    (state.currentEra !== Era.GNT7 ||
      state.training.runs[Era.GNT7].status !== TrainingStatus.COMPLETE ||
      state.intelligence < state.agiThreshold)
  ) {
    throw new Error("completion invariant violated");
  }
}

/** Canonicalizes numeric boundaries and asserts all persisted invariants. */
export function normalizeGameState(input: GameStateV2): GameStateV2 {
  const state = structuredClone(input);
  state.money = roundMoney(Math.max(0, state.money));
  state.intelligence = nonnegative(state.intelligence);
  state.daysElapsed = Math.max(0, Math.floor(state.clock.activeTick));
  state.training.algorithmResearchProgress = Math.min(
    100,
    nonnegative(state.training.algorithmResearchProgress),
  );
  state.training.algorithmResearchRate = nonnegative(
    state.training.algorithmResearchRate,
  );

  for (const group of [state.resources, state.production, state.bonuses]) {
    for (const key of Object.keys(group)) {
      (group as Record<string, number>)[key] = nonnegative(
        (group as Record<string, number>)[key],
      );
    }
  }

  state.computeCapacity.maxCapacity = Math.max(
    0,
    calculateMaxComputeCapacity(state),
  );
  state.computeCapacity.used = Math.min(
    state.computeCapacity.maxCapacity,
    nonnegative(state.computeCapacity.used),
  );
  state.computeCapacity.available = Math.min(
    Math.max(0, state.computeCapacity.maxCapacity - state.computeCapacity.used),
    nonnegative(state.computeCapacity.available),
  );
  state.computeCapacity.customerUsage = Math.min(
    state.computeCapacity.used,
    nonnegative(state.computeCapacity.customerUsage),
  );
  state.computeCapacity.freeCompute = Math.min(
    state.computeCapacity.available,
    nonnegative(state.computeCapacity.freeCompute),
  );

  const nextEra = getNextEra(state.currentEra);
  if (!state.training.active) {
    state.training.daysRemaining = 0;
    state.training.computeReserved = 0;
  } else if (nextEra) {
    const run =
      state.training.runs[nextEra as keyof typeof state.training.runs];
    state.training.daysRemaining = Math.max(
      0,
      Math.floor(state.training.daysRemaining),
    );
    state.training.computeReserved = Math.min(
      state.computeCapacity.used,
      nonnegative(state.training.computeReserved),
    );
    run.daysRemaining = state.training.daysRemaining;
    run.status = TrainingStatus.IN_PROGRESS;
    run.isTrainingReserveActive = true;
  }

  for (const run of Object.values(state.training.runs)) {
    run.moneyCost = roundMoney(Math.max(0, run.moneyCost));
    run.computeRequired = nonnegative(run.computeRequired);
    run.daysRemaining = Math.max(0, Math.floor(run.daysRemaining));
    if (run.status === TrainingStatus.COMPLETE) {
      run.daysRemaining = 0;
      run.isTrainingReserveActive = false;
    } else if (run.status !== TrainingStatus.IN_PROGRESS) {
      run.isTrainingReserveActive = false;
    }
  }

  state.facts.totalSpend = roundMoney(
    Object.values(state.facts.spendByCategory).reduce(
      (sum, value) => sum + roundMoney(Math.max(0, value)),
      0,
    ),
  );
  for (const category of Object.keys(state.facts.spendByCategory)) {
    state.facts.spendByCategory[
      category as keyof typeof state.facts.spendByCategory
    ] = roundMoney(
      Math.max(
        0,
        state.facts.spendByCategory[
          category as keyof typeof state.facts.spendByCategory
        ],
      ),
    );
  }
  state.facts.earnedRevenue = roundMoney(
    Math.max(0, state.facts.earnedRevenue),
  );
  state.facts.externalFunding = roundMoney(
    Math.max(0, state.facts.externalFunding),
  );
  state.facts.emergencyFunding = roundMoney(
    Math.max(0, state.facts.emergencyFunding),
  );
  state.facts.otherCashAdjustments = roundMoney(
    state.facts.otherCashAdjustments,
  );
  state.facts.peakMoney = roundMoney(
    Math.max(state.facts.peakMoney, state.money),
  );
  state.facts.peakB2BCustomers = Math.max(
    state.facts.peakB2BCustomers,
    state.revenue.developers,
  );
  state.facts.peakB2CCustomers = Math.max(
    state.facts.peakB2CCustomers,
    state.revenue.subscribers,
  );

  const reconciled = expectedCash(state);
  if (Math.abs(reconciled - state.money) > 0.011) {
    throw new Error(
      `cash ledger invariant violated: expected ${reconciled}, received ${state.money}`,
    );
  }

  const parsed = gameStateSchema.parse(state);
  assertGameStateInvariants(parsed);
  return parsed;
}
