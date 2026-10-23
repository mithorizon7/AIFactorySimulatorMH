import { getEraIndex, getNextEra, Era } from "./domain/era";
import {
  canUnlockBreakthrough,
  getBaseTrainingRunForEra,
  getScaledInvestmentCost,
  TrainingStatus,
  type Breakthrough,
  type GameEvent,
  type TrainingRun,
} from "./domain/gameState";
import {
  creditFunding,
  creditOtherCashAdjustment,
  creditRevenue,
  recordSpend,
} from "./ledger";
import {
  assertGameStateInvariants,
  calculateMaxComputeCapacity,
  normalizeGameState,
  trainingPrerequisitesMet,
} from "./normalize";
import { drawRandom } from "./random";
import { parseGameCommand, type GameCommand } from "./schemas/commands";
import type { EngineEffect } from "./schemas/effects";
import {
  gameStateSchema,
  type EngineResult,
  type GameStateV2,
  type SpendCategory,
} from "./schemas/state";

const MIN_TRAINING_MONEY_MULTIPLIER = 0.65;
const MIN_TRAINING_COMPUTE_MULTIPLIER = 0.7;
const RECOVERY_RUNWAY = 30_000;
const CONTINUITY_RUNWAYS: Partial<
  Record<Era, { earliestTick: number; amount: number; id: string }>
> = {
  [Era.GNT3]: {
    earliestTick: 180,
    amount: 130_000,
    id: "gnt3_continuity_v1",
  },
  [Era.GNT4]: {
    earliestTick: 300,
    amount: 650_000,
    id: "gnt4_continuity_v1",
  },
  [Era.GNT5]: {
    earliestTick: 420,
    amount: 2_500_000,
    id: "gnt5_continuity_v1",
  },
  [Era.GNT6]: {
    earliestTick: 540,
    amount: 12_000_000,
    id: "gnt6_completion_v1",
  },
};

type MutableEffects = EngineEffect[];
type EffectInput<T = EngineEffect> = T extends EngineEffect
  ? Omit<T, "id" | "tick">
  : never;

function reject(
  state: GameStateV2,
  command: GameCommand,
  reasonId: string,
  params?: Record<string, number | string | boolean>,
): EngineResult {
  return {
    state,
    effects: [
      {
        id: `${state.clock.activeTick}:COMMAND_REJECTED:${command.id}`,
        tick: state.clock.activeTick,
        type: "COMMAND_REJECTED",
        commandId: command.id,
        reasonId,
        ...(params ? { params } : {}),
      },
    ],
  };
}

function pushEffect(
  state: GameStateV2,
  effects: MutableEffects,
  effect: EffectInput,
): void {
  const sequence = state.mechanics.nextEffectSequence;
  state.mechanics.nextEffectSequence += 1;
  effects.push({
    ...effect,
    id: `${state.clock.activeTick}:${sequence}:${effect.type}`,
    tick: state.clock.activeTick,
  } as EngineEffect);
}

function getTrainingRun(state: GameStateV2, target: Era): TrainingRun | null {
  return (state.training.runs[target as keyof typeof state.training.runs] ??
    null) as TrainingRun | null;
}

function applyTrainingDiscount(
  state: GameStateV2,
  computeMultiplier = 1,
  moneyMultiplier = 1,
): void {
  for (const target of [Era.GNT3, Era.GNT4, Era.GNT5, Era.GNT6, Era.GNT7]) {
    const run = getTrainingRun(state, target);
    const base = getBaseTrainingRunForEra(target);
    if (
      !run ||
      !base ||
      (run.status !== TrainingStatus.AVAILABLE &&
        run.status !== TrainingStatus.LOCKED)
    ) {
      continue;
    }
    run.moneyCost = Math.max(
      Math.floor(base.moneyCost * MIN_TRAINING_MONEY_MULTIPLIER),
      Math.floor(run.moneyCost * moneyMultiplier),
    );
    run.computeRequired = Math.max(
      Math.floor(base.computeRequired * MIN_TRAINING_COMPUTE_MULTIPLIER),
      Math.floor(run.computeRequired * computeMultiplier),
    );
  }
}

const cap = (value: number, multiplier: number, max = 2.5): number =>
  Math.min(max, value * multiplier);

const BREAKTHROUGH_INTELLIGENCE: Record<number, number> = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 30,
  6: 35,
  7: 50,
  8: 70,
  9: 80,
  10: 120,
  11: 60,
  12: 90,
  13: 95,
  14: 105,
  15: 110,
  16: 55,
  17: 40,
  18: 45,
  19: 50,
  20: 85,
  21: 55,
};

function applyBreakthroughEffect(state: GameStateV2, id: number): void {
  if (state.mechanics.appliedBreakthroughEffectIds.includes(id)) return;
  state.mechanics.appliedBreakthroughEffectIds.push(id);
  state.intelligence += BREAKTHROUGH_INTELLIGENCE[id] ?? 15;

  switch (id) {
    case 1:
      state.bonuses.computeToData = cap(state.bonuses.computeToData, 1.08);
      state.bonuses.computeToAlgorithm = cap(
        state.bonuses.computeToAlgorithm,
        1.08,
      );
      state.bonuses.dataToAlgorithm = cap(state.bonuses.dataToAlgorithm, 1.12);
      break;
    case 2:
      state.bonuses.dataToCompute = cap(state.bonuses.dataToCompute, 1.15);
      state.bonuses.dataToAlgorithm = cap(state.bonuses.dataToAlgorithm, 1.15);
      state.bonuses.dataToIntelligence = cap(
        state.bonuses.dataToIntelligence,
        1.2,
      );
      applyTrainingDiscount(state, 1, 0.9);
      break;
    case 3:
      state.bonuses.computeToIntelligence = cap(
        state.bonuses.computeToIntelligence,
        1.25,
      );
      if (state.revenue.apiPlatformBuilt) state.revenue.baseApiRate += 200;
      break;
    case 4:
      applyTrainingDiscount(state, 0.9, 0.9);
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 200;
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.2,
          3,
        );
      }
      break;
    case 5:
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.15,
      );
      if (state.revenue.chatbotPlatformBuilt && state.revenue.chatbotEnabled) {
        state.revenue.monthlyFee += 8;
        state.revenue.subscriberGrowthRate = cap(
          state.revenue.subscriberGrowthRate,
          1.3,
          3,
        );
      }
      break;
    case 6:
      state.bonuses.dataToCompute = cap(state.bonuses.dataToCompute, 1.2);
      state.bonuses.dataToAlgorithm = cap(state.bonuses.dataToAlgorithm, 1.2);
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 300;
      }
      if (state.revenue.chatbotPlatformBuilt && state.revenue.chatbotEnabled) {
        state.revenue.monthlyFee += 10;
      }
      break;
    case 7:
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.25,
      );
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 500;
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.4,
          3,
        );
      }
      break;
    case 8:
      state.bonuses.algorithmToCompute = cap(
        state.bonuses.algorithmToCompute,
        1.2,
      );
      state.bonuses.algorithmToData = cap(state.bonuses.algorithmToData, 1.2);
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.3,
      );
      applyTrainingDiscount(state, 0.9, 0.9);
      break;
    case 9:
      state.bonuses.computeToData = cap(state.bonuses.computeToData, 1.15);
      state.bonuses.computeToIntelligence = cap(
        state.bonuses.computeToIntelligence,
        1.2,
      );
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 800;
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.5,
          3,
        );
      }
      if (state.revenue.chatbotPlatformBuilt && state.revenue.chatbotEnabled) {
        state.revenue.subscriberGrowthRate = cap(
          state.revenue.subscriberGrowthRate,
          1.4,
          3,
        );
      }
      break;
    case 10:
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 1_500;
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          2,
          3,
        );
      }
      if (state.revenue.chatbotPlatformBuilt && state.revenue.chatbotEnabled) {
        state.revenue.monthlyFee += 50;
        state.revenue.subscriberGrowthRate = cap(
          state.revenue.subscriberGrowthRate,
          2,
          3,
        );
      }
      for (const key of [
        "computeToData",
        "computeToAlgorithm",
        "dataToCompute",
        "dataToAlgorithm",
        "algorithmToCompute",
        "algorithmToData",
      ] as const) {
        state.bonuses[key] = cap(state.bonuses[key], 1.25);
      }
      for (const key of [
        "computeToIntelligence",
        "dataToIntelligence",
        "algorithmToIntelligence",
      ] as const) {
        state.bonuses[key] = cap(state.bonuses[key], 1.4);
      }
      break;
    case 11:
      if (state.revenue.chatbotPlatformBuilt && state.revenue.chatbotEnabled) {
        state.revenue.subscriberGrowthRate = cap(
          state.revenue.subscriberGrowthRate,
          1.15,
          3,
        );
        state.revenue.monthlyFee += 8;
      }
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.12,
          3,
        );
      }
      state.bonuses.dataToAlgorithm = cap(state.bonuses.dataToAlgorithm, 1.18);
      break;
    case 12:
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 600;
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.25,
          3,
        );
      }
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.22,
      );
      state.bonuses.dataToIntelligence = cap(
        state.bonuses.dataToIntelligence,
        1.15,
      );
      break;
    case 13:
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 450;
      }
      state.bonuses.computeToData = cap(state.bonuses.computeToData, 1.2);
      state.bonuses.dataToCompute = cap(state.bonuses.dataToCompute, 1.2);
      state.bonuses.computeToIntelligence = cap(
        state.bonuses.computeToIntelligence,
        1.18,
      );
      break;
    case 14:
      applyTrainingDiscount(state, 0.85, 0.85);
      state.bonuses.algorithmToCompute = cap(
        state.bonuses.algorithmToCompute,
        1.25,
      );
      state.bonuses.algorithmToData = cap(state.bonuses.algorithmToData, 1.25);
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.35,
      );
      break;
    case 15:
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 1_200;
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.8,
          3,
        );
      }
      if (state.revenue.chatbotPlatformBuilt && state.revenue.chatbotEnabled) {
        state.revenue.monthlyFee += 30;
        state.revenue.subscriberGrowthRate = cap(
          state.revenue.subscriberGrowthRate,
          1.6,
          3,
        );
      }
      state.bonuses.computeToData = cap(state.bonuses.computeToData, 1.2);
      state.bonuses.computeToAlgorithm = cap(
        state.bonuses.computeToAlgorithm,
        1.2,
      );
      state.bonuses.dataToAlgorithm = cap(state.bonuses.dataToAlgorithm, 1.2);
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.3,
      );
      break;
    case 16:
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 180;
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.15,
          3,
        );
      }
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.2,
      );
      break;
    case 17:
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 150;
      }
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.18,
      );
      state.bonuses.dataToAlgorithm = cap(state.bonuses.dataToAlgorithm, 1.15);
      break;
    case 18:
      state.computeCapacity.breakthroughMultiplier = cap(
        state.computeCapacity.breakthroughMultiplier,
        1.5,
        4,
      );
      applyTrainingDiscount(state, 0.7, 0.75);
      state.bonuses.computeToAlgorithm = cap(
        state.bonuses.computeToAlgorithm,
        1.2,
      );
      state.bonuses.computeToIntelligence = cap(
        state.bonuses.computeToIntelligence,
        1.15,
      );
      break;
    case 19:
      state.bonuses.dataToCompute = cap(state.bonuses.dataToCompute, 1.4);
      state.bonuses.dataToAlgorithm = cap(state.bonuses.dataToAlgorithm, 1.35);
      state.bonuses.dataToIntelligence = cap(
        state.bonuses.dataToIntelligence,
        1.25,
      );
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 160;
      }
      break;
    case 20:
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.baseApiRate += 300;
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.25,
          3,
        );
      }
      if (state.revenue.chatbotPlatformBuilt && state.revenue.chatbotEnabled) {
        state.revenue.monthlyFee += 15;
        state.revenue.subscriberGrowthRate = cap(
          state.revenue.subscriberGrowthRate,
          1.2,
          3,
        );
      }
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.3,
      );
      state.bonuses.algorithmToData = cap(state.bonuses.algorithmToData, 1.25);
      break;
    case 21:
      if (state.revenue.chatbotPlatformBuilt && state.revenue.chatbotEnabled) {
        state.revenue.monthlyFee += 12;
        state.revenue.subscriberGrowthRate = cap(
          state.revenue.subscriberGrowthRate,
          1.25,
          3,
        );
      }
      if (state.revenue.apiPlatformBuilt && state.revenue.apiEnabled) {
        state.revenue.developerGrowthRate = cap(
          state.revenue.developerGrowthRate,
          1.18,
          3,
        );
      }
      state.bonuses.algorithmToIntelligence = cap(
        state.bonuses.algorithmToIntelligence,
        1.18,
      );
      state.bonuses.algorithmToCompute = cap(
        state.bonuses.algorithmToCompute,
        1.15,
      );
      break;
  }
}

function unlockOneBreakthrough(
  state: GameStateV2,
  effects: MutableEffects,
): void {
  const breakthrough = state.breakthroughs.find((item) =>
    canUnlockBreakthrough(state as never, item as Breakthrough),
  );
  if (!breakthrough) return;
  breakthrough.unlocked = true;
  applyBreakthroughEffect(state, breakthrough.id);
  pushEffect(state, effects, {
    type: "BREAKTHROUGH_UNLOCKED",
    breakthroughId: breakthrough.id,
  });
  const next = state.breakthroughs.find((item) => !item.unlocked);
  if (next) {
    state.currentGoal = { id: next.id, progress: 0 };
  }
}

function triggerEvent(state: GameStateV2, effects: MutableEffects): void {
  const event = state.events.find(
    (candidate) => candidate.era === state.currentEra && !candidate.triggered,
  );
  if (!event) return;
  event.triggered = true;
  applyEventEffect(state, event as GameEvent);
  pushEffect(state, effects, { type: "EVENT_TRIGGERED", eventId: event.id });
}

function applyEventEffect(state: GameStateV2, event: GameEvent): void {
  const modifier =
    event.effect.impact === "positive"
      ? 1 + event.effect.magnitude / 100
      : event.effect.impact === "negative"
        ? 1 - event.effect.magnitude / 100
        : 1;
  switch (event.effect.type) {
    case "compute":
      state.production.compute *= modifier;
      break;
    case "data":
      state.production.data *= modifier;
      break;
    case "algorithm":
      state.production.algorithm *= modifier;
      break;
    case "money": {
      const delta = state.money * modifier - state.money;
      creditOtherCashAdjustment(state, delta);
      break;
    }
    case "regulation":
      state.computeInputs.regulation = Math.max(
        1,
        state.computeInputs.regulation +
          (event.effect.impact === "positive" ? 1 : -1),
      );
      break;
    case "hardware":
      state.computeInputs.hardware = Math.max(
        1,
        state.computeInputs.hardware +
          (event.effect.impact === "positive" ? 1 : -1),
      );
      break;
    case "multiple": {
      const shared = Math.sqrt(modifier);
      state.production.compute *= shared;
      state.production.data *= shared;
      state.production.algorithm *= shared;
      break;
    }
  }
}

function unlockEraServices(
  state: GameStateV2,
  era: Era,
  effects: MutableEffects,
): void {
  if (era === Era.GNT3 && !state.revenue.apiAvailable) {
    state.revenue.apiAvailable = true;
    pushEffect(state, effects, { type: "SERVICE_UNLOCKED", service: "api" });
  }
  if (era === Era.GNT4 && !state.revenue.chatbotAvailable) {
    state.revenue.chatbotAvailable = true;
    pushEffect(state, effects, {
      type: "SERVICE_UNLOCKED",
      service: "chatbot",
    });
  }
}

function advanceEra(
  state: GameStateV2,
  era: Era,
  effects: MutableEffects,
): void {
  state.currentEra = era;
  switch (era) {
    case Era.GNT3:
      state.production.compute *= 1.5;
      state.bonuses.computeToIntelligence *= 1.3;
      break;
    case Era.GNT4:
      state.production.algorithm *= 1.5;
      state.bonuses.algorithmToIntelligence *= 1.4;
      break;
    case Era.GNT5:
      state.production.data *= 1.6;
      state.bonuses.dataToIntelligence *= 1.5;
      break;
    case Era.GNT6:
      state.production.compute *= 1.7;
      state.production.data *= 1.7;
      state.production.algorithm *= 1.7;
      break;
    case Era.GNT7:
      state.bonuses.computeToIntelligence *= 2;
      state.bonuses.dataToIntelligence *= 2;
      state.bonuses.algorithmToIntelligence *= 2;
      break;
  }
  pushEffect(state, effects, { type: "ERA_ADVANCED", era });
  unlockEraServices(state, era, effects);
  triggerEvent(state, effects);
}

function grantFunding(
  state: GameStateV2,
  effects: MutableEffects,
  fundingId: string,
  amount: number,
  emergency: boolean,
): void {
  if (
    amount <= 0 ||
    state.mechanics.appliedRecoveryGrantIds.includes(fundingId)
  )
    return;
  state.mechanics.appliedRecoveryGrantIds.push(fundingId);
  creditFunding(state, amount, emergency);
  pushEffect(state, effects, {
    type: "FUNDING_GRANTED",
    fundingId,
    amount,
    emergency,
  });
}

function processFunding(state: GameStateV2, effects: MutableEffects): void {
  if (
    state.clock.activeTick === 30 &&
    state.mechanics.lastSeedFundingTick === null
  ) {
    const amount = 2_000 + Math.floor(state.intelligence * 10);
    state.mechanics.lastSeedFundingTick = state.clock.activeTick;
    grantFunding(state, effects, "seed_assist_v1", amount, false);
  }

  if (
    state.clock.activeTick >= 60 &&
    state.currentEra === Era.GNT2 &&
    !state.mechanics.appliedRecoveryGrantIds.includes("gnt2_continuity_v1")
  ) {
    grantFunding(
      state,
      effects,
      "gnt2_continuity_v1",
      Math.max(0, RECOVERY_RUNWAY - state.money),
      true,
    );
  }

  const runway = CONTINUITY_RUNWAYS[state.currentEra];
  if (
    runway &&
    state.clock.activeTick >= runway.earliestTick &&
    !state.mechanics.appliedRecoveryGrantIds.includes(runway.id)
  ) {
    grantFunding(
      state,
      effects,
      runway.id,
      Math.max(0, runway.amount - state.money),
      true,
    );
  }

  const milestone = state.investmentMilestones.find(
    (item) => item.id === state.nextMilestoneId,
  );
  if (
    milestone &&
    !milestone.unlocked &&
    state.intelligence >= milestone.requiredIntelligence &&
    getEraIndex(state.currentEra) >= getEraIndex(milestone.era)
  ) {
    milestone.unlocked = true;
    state.nextMilestoneId += 1;
    state.mechanics.lastInvestorFundingTick = state.clock.activeTick;
    const id = `milestone_${milestone.id}`;
    grantFunding(state, effects, id, milestone.funding, false);
  }
}

function productionTick(state: GameStateV2): void {
  const computeInputs =
    0.2 * state.computeInputs.money +
    0.15 * state.computeInputs.electricity +
    0.3 * state.computeInputs.hardware +
    0.1 * state.computeInputs.regulation;
  const computeSynergy =
    state.bonuses.dataToCompute - 1 + (state.bonuses.algorithmToCompute - 1);
  const dataInputs =
    0.25 * state.dataInputs.quality +
    0.2 * state.dataInputs.quantity +
    0.15 * state.dataInputs.formats;
  const dataSynergy =
    state.bonuses.computeToData - 1 + (state.bonuses.algorithmToData - 1);
  const algorithmInputs = 0.35 * state.algorithmInputs.architectures;
  const algorithmSynergy =
    state.bonuses.computeToAlgorithm - 1 + (state.bonuses.dataToAlgorithm - 1);
  state.production = {
    compute:
      state.production.compute * 0.8 + computeInputs * (1 + computeSynergy),
    data: state.production.data * 0.8 + dataInputs * (1 + dataSynergy),
    algorithm:
      state.production.algorithm * 0.8 +
      algorithmInputs * (1 + algorithmSynergy),
  };
  state.resources.compute += state.production.compute;
  state.resources.data += state.production.data;
  state.resources.algorithm += state.production.algorithm;
}

function updateResearchOrTraining(
  state: GameStateV2,
  effects: MutableEffects,
): void {
  if (state.training.active) {
    const target = getNextEra(state.currentEra);
    if (!target) return;
    const run = getTrainingRun(state, target);
    if (!run || run.status !== TrainingStatus.IN_PROGRESS) return;
    state.training.daysRemaining -= 1;
    run.daysRemaining -= 1;
    if (state.training.daysRemaining > 0) return;

    run.status = TrainingStatus.COMPLETE;
    run.daysRemaining = 0;
    run.isTrainingReserveActive = false;
    state.computeCapacity.used = Math.max(
      0,
      state.computeCapacity.used - state.training.computeReserved,
    );
    state.training.active = false;
    state.training.daysRemaining = 0;
    state.training.computeReserved = 0;
    state.training.algorithmResearchProgress = 0;
    state.intelligence += run.intelligenceGain;
    pushEffect(state, effects, {
      type: "TRAINING_COMPLETED",
      targetEra: target,
    });
    advanceEra(state, target, effects);
    unlockOneBreakthrough(state, effects);
    return;
  }

  const freeCompute = Math.max(
    0,
    state.computeCapacity.maxCapacity - state.computeCapacity.used,
  );
  state.computeCapacity.available = freeCompute;
  state.computeCapacity.freeCompute = freeCompute;
  const architectureMultiplier = 1 + state.algorithmInputs.architectures * 0.1;
  const computeEfficiency = Math.log10(freeCompute + 1) * 0.5;
  const engineerBonus = state.algorithmInputs.researchEngineers * 0.25;
  state.training.algorithmResearchRate = Math.max(
    0.1,
    0.5 + engineerBonus + computeEfficiency * architectureMultiplier,
  );
  state.training.algorithmResearchProgress = Math.min(
    100,
    state.training.algorithmResearchProgress +
      state.training.algorithmResearchRate,
  );

  const target = getNextEra(state.currentEra);
  if (!target) return;
  const run = getTrainingRun(state, target);
  if (
    run &&
    run.status === TrainingStatus.LOCKED &&
    trainingPrerequisitesMet(state, target)
  ) {
    run.status = TrainingStatus.AVAILABLE;
    pushEffect(state, effects, {
      type: "TRAINING_AVAILABLE",
      targetEra: target,
    });
  }
}

function calculateRevenue(state: GameStateV2, effects: MutableEffects): void {
  const apiActive =
    state.revenue.apiAvailable &&
    state.revenue.apiPlatformBuilt &&
    state.revenue.apiEnabled;
  const chatbotActive =
    state.revenue.chatbotAvailable &&
    state.revenue.chatbotPlatformBuilt &&
    state.revenue.chatbotEnabled;

  state.computeCapacity.used = Math.max(
    state.training.computeReserved,
    state.computeCapacity.used - state.computeCapacity.customerUsage,
  );
  state.computeCapacity.customerUsage = 0;
  state.computeCapacity.available = Math.max(
    0,
    state.computeCapacity.maxCapacity - state.computeCapacity.used,
  );

  if (apiActive) {
    if (state.revenue.developers === 0) {
      state.revenue.developers = Math.max(
        5,
        Math.floor(state.intelligence / 20),
      );
    } else {
      const intelligenceInfluence = (state.intelligence / 100) ** 1.2;
      let growth =
        0.05 *
        intelligenceInfluence *
        (1 + state.revenue.developerToolsLevel * 0.05);
      if (state.revenue.developers > 10_000) {
        growth *= Math.max(
          0.1,
          1 - (state.revenue.developers - 10_000) / 50_000,
        );
      } else if (state.revenue.developers > 5_000) {
        growth *= 1 - (state.revenue.developers - 5_000) / 25_000;
      }
      state.revenue.developerGrowthRate = Math.min(0.15, growth);
      state.revenue.developers = Math.floor(
        state.revenue.developers * (1 + state.revenue.developerGrowthRate),
      );
    }
  }

  if (chatbotActive && state.clock.activeTick % 10 === 0) {
    if (state.revenue.subscribers === 0) {
      state.revenue.subscribers = Math.max(
        50,
        Math.floor(state.intelligence / 4),
      );
    } else {
      const intelligenceImpact = (state.intelligence / 150) ** 1.3;
      let growth =
        (0.01 + intelligenceImpact * 0.01) *
        (1 + state.dataInputs.quality * 0.1) *
        (1 + state.revenue.chatbotImprovementLevel * 0.05);
      if (state.revenue.subscribers > 100_000) {
        growth *= Math.max(
          0.05,
          1 - (state.revenue.subscribers - 100_000) / 500_000,
        );
      } else if (state.revenue.subscribers > 50_000) {
        growth *= 1 - (state.revenue.subscribers - 50_000) / 250_000;
      }
      state.revenue.subscriberGrowthRate = Math.min(0.12, growth);
      state.revenue.subscribers = Math.floor(
        state.revenue.subscribers * (1 + state.revenue.subscriberGrowthRate),
      );
    }
  }

  const potentialB2b = apiActive
    ? Math.floor(
        (state.revenue.developers *
          state.revenue.baseApiRate *
          (1 + state.revenue.developerToolsLevel * 0.05)) /
          100,
      )
    : 0;
  const potentialB2c = chatbotActive
    ? Math.floor(state.revenue.subscribers * state.revenue.monthlyFee)
    : 0;
  const b2bDemand = apiActive ? Math.ceil((potentialB2b / 1_000) * 5) : 0;
  const b2cDemand = chatbotActive
    ? Math.ceil(state.revenue.subscribers * 0.01)
    : 0;
  const demand = b2bDemand + b2cDemand;
  const capacity = state.computeCapacity.available;
  const serviceRatio = demand === 0 ? 1 : Math.min(1, capacity / demand);
  const shortfallRatio = demand === 0 ? 0 : Math.max(0, 1 - serviceRatio);
  const prospectiveUsage = state.computeCapacity.used + demand;
  const pressureRatio =
    prospectiveUsage / Math.max(1, state.computeCapacity.maxCapacity);

  if (pressureRatio >= 0.9 || shortfallRatio > 0) {
    state.facts.capacityShortfallRatioSum += shortfallRatio;
    state.facts.peakCapacityShortfallRatio = Math.max(
      state.facts.peakCapacityShortfallRatio,
      shortfallRatio,
    );
    pushEffect(state, effects, {
      type: "CAPACITY_WARNING",
      severity: shortfallRatio > 0 ? "shortfall" : "pressure",
      ratio: shortfallRatio > 0 ? shortfallRatio : pressureRatio,
    });
  }

  if (shortfallRatio > 0 && state.clock.activeTick % 10 === 0) {
    const churn = 0.25 * shortfallRatio;
    if (chatbotActive && state.revenue.subscribers > 0) {
      const before = state.revenue.subscribers;
      state.revenue.subscribers = Math.floor(before * (1 - churn));
      const count = before - state.revenue.subscribers;
      if (count > 0)
        pushEffect(state, effects, {
          type: "CUSTOMERS_LOST",
          service: "chatbot",
          count,
        });
    }
    if (apiActive && state.revenue.developers > 0) {
      const before = state.revenue.developers;
      state.revenue.developers = Math.floor(before * (1 - churn * 0.8));
      const count = before - state.revenue.developers;
      if (count > 0)
        pushEffect(state, effects, {
          type: "CUSTOMERS_LOST",
          service: "api",
          count,
        });
    }
  }

  state.revenue.b2b = Math.floor(potentialB2b * serviceRatio);
  state.revenue.b2c = Math.floor(potentialB2c * serviceRatio);
  const actualUsage = Math.min(capacity, demand);
  state.computeCapacity.customerUsage = actualUsage;
  state.computeCapacity.used += actualUsage;
  state.computeCapacity.available -= actualUsage;
  creditRevenue(state, state.revenue.b2b + state.revenue.b2c);
}

function intelligenceTick(state: GameStateV2): void {
  const compute = state.levels.compute * state.bonuses.computeToIntelligence;
  const data = state.levels.data * state.bonuses.dataToIntelligence;
  const algorithm =
    state.levels.algorithm * state.bonuses.algorithmToIntelligence;
  const synergy =
    Math.min(state.levels.compute, state.levels.data, state.levels.algorithm) *
    0.05;
  state.intelligence += 0.02 * (compute + data + algorithm) * (1 + synergy);
}

function validateSpend(state: GameStateV2, amount: number): boolean {
  return (
    Number.isFinite(amount) && amount >= 0 && state.money + 0.000_001 >= amount
  );
}

function investmentCost(
  state: GameStateV2,
  command: GameCommand,
): number | null {
  switch (command.type) {
    case "INVEST_COMPUTE":
      return getScaledInvestmentCost(
        100,
        state.levels.compute,
        state.currentEra,
      );
    case "INVEST_DATA_QUALITY":
      return getScaledInvestmentCost(75, state.levels.data, state.currentEra);
    case "INVEST_ALGORITHM_ARCHITECTURE":
      return getScaledInvestmentCost(
        125,
        state.levels.algorithm,
        state.currentEra,
      );
    case "INVEST_ELECTRICITY":
      return getScaledInvestmentCost(
        85,
        state.computeInputs.electricity,
        state.currentEra,
      );
    case "INVEST_HARDWARE":
      return getScaledInvestmentCost(
        160,
        state.computeInputs.hardware,
        state.currentEra,
      );
    case "INVEST_REGULATION":
      return getScaledInvestmentCost(
        140,
        state.computeInputs.regulation,
        state.currentEra,
      );
    case "INVEST_DATA_QUANTITY":
      return getScaledInvestmentCost(
        120,
        state.dataInputs.quantity,
        state.currentEra,
      );
    case "INVEST_DATA_FORMATS":
      return getScaledInvestmentCost(
        140,
        state.dataInputs.formats,
        state.currentEra,
      );
    case "HIRE_RESEARCH_ENGINEER":
      return 250;
    case "BUILD_API_PLATFORM":
      return state.revenue.apiPlatformCost;
    case "BUILD_CHATBOT_PLATFORM":
      return state.revenue.chatbotPlatformCost;
    case "UPGRADE_DEVELOPER_TOOLS":
      return state.revenue.developerToolsCost;
    case "UPGRADE_CHATBOT":
      return state.revenue.chatbotImprovementCost;
    case "RUN_MARKETING_CAMPAIGN":
      return state.revenue.marketingCampaignCost;
    default:
      return null;
  }
}

function spendCategory(command: GameCommand): SpendCategory {
  switch (command.type) {
    case "INVEST_COMPUTE":
    case "INVEST_ELECTRICITY":
    case "INVEST_HARDWARE":
      return "compute";
    case "INVEST_DATA_QUALITY":
    case "INVEST_DATA_QUANTITY":
    case "INVEST_DATA_FORMATS":
      return "data";
    case "INVEST_ALGORITHM_ARCHITECTURE":
    case "HIRE_RESEARCH_ENGINEER":
      return "algorithm";
    case "INVEST_REGULATION":
      return "regulationResilience";
    default:
      return "commercial";
  }
}

function validateCommandBusinessRules(
  state: GameStateV2,
  command: GameCommand,
): {
  reasonId: string;
  params?: Record<string, number | string | boolean>;
} | null {
  const cost = investmentCost(state, command);
  if (cost !== null && !validateSpend(state, cost)) {
    return {
      reasonId: "insufficient_funds",
      params: { required: cost, available: state.money },
    };
  }
  switch (command.type) {
    case "START_RUN":
      return state.clock.status === "paused" ||
        state.clock.status === "completed"
        ? {
            reasonId: "start_not_allowed",
            params: { status: state.clock.status },
          }
        : null;
    case "PAUSE_RUN":
      return state.clock.status !== "running"
        ? {
            reasonId: "pause_not_allowed",
            params: { status: state.clock.status },
          }
        : null;
    case "RESUME_RUN":
      return state.clock.status !== "paused"
        ? {
            reasonId: "resume_not_allowed",
            params: { status: state.clock.status },
          }
        : null;
    case "BUILD_API_PLATFORM":
      if (!state.revenue.apiAvailable) return { reasonId: "api_not_available" };
      if (state.revenue.apiPlatformBuilt)
        return { reasonId: "api_platform_already_built" };
      return null;
    case "BUILD_CHATBOT_PLATFORM":
      if (!state.revenue.chatbotAvailable)
        return { reasonId: "chatbot_not_available" };
      if (state.revenue.chatbotPlatformBuilt)
        return { reasonId: "chatbot_platform_already_built" };
      return null;
    case "TOGGLE_API_SERVICE":
      return !state.revenue.apiAvailable || !state.revenue.apiPlatformBuilt
        ? { reasonId: "api_platform_required" }
        : null;
    case "TOGGLE_CHATBOT_SERVICE":
      return !state.revenue.chatbotAvailable ||
        !state.revenue.chatbotPlatformBuilt
        ? { reasonId: "chatbot_platform_required" }
        : null;
    case "UPGRADE_DEVELOPER_TOOLS":
      return !state.revenue.apiPlatformBuilt
        ? { reasonId: "api_platform_required" }
        : null;
    case "UPGRADE_CHATBOT":
      return !state.revenue.chatbotPlatformBuilt
        ? { reasonId: "chatbot_platform_required" }
        : null;
    case "RUN_MARKETING_CAMPAIGN":
      return !(
        state.revenue.chatbotAvailable &&
        state.revenue.chatbotPlatformBuilt &&
        state.revenue.chatbotEnabled
      )
        ? { reasonId: "active_chatbot_required" }
        : null;
    case "START_TRAINING": {
      const expected = getNextEra(state.currentEra);
      if (command.payload.targetEra !== expected) {
        return {
          reasonId: "invalid_training_target",
          params: {
            expected: expected ?? "none",
            received: command.payload.targetEra,
          },
        };
      }
      if (state.training.active) return { reasonId: "training_already_active" };
      const run = getTrainingRun(state, command.payload.targetEra);
      if (!run || run.status === TrainingStatus.COMPLETE) {
        return { reasonId: "training_unavailable" };
      }
      if (!trainingPrerequisitesMet(state, command.payload.targetEra)) {
        return { reasonId: "training_prerequisites_missing" };
      }
      if (!validateSpend(state, run.moneyCost)) {
        return {
          reasonId: "insufficient_funds",
          params: { required: run.moneyCost, available: state.money },
        };
      }
      if (state.computeCapacity.available < run.computeRequired) {
        return {
          reasonId: "insufficient_compute",
          params: {
            required: run.computeRequired,
            available: state.computeCapacity.available,
          },
        };
      }
      return null;
    }
    default:
      return null;
  }
}

function applyInvestment(
  state: GameStateV2,
  command: GameCommand,
  cost: number,
): void {
  recordSpend(state, cost, spendCategory(command));
  switch (command.type) {
    case "INVEST_COMPUTE":
      state.computeInputs.money += 1;
      state.levels.compute += 1;
      state.production.compute *= 1.1;
      state.bonuses.computeToData *= 1.05;
      state.bonuses.computeToAlgorithm *= 1.05;
      state.bonuses.computeToIntelligence *= 1.05;
      break;
    case "INVEST_ELECTRICITY":
      state.computeInputs.electricity += 1;
      state.production.compute *= 1.08;
      state.bonuses.computeToData *= 1.03;
      state.bonuses.computeToAlgorithm *= 1.03;
      state.bonuses.computeToIntelligence *= 1.03;
      break;
    case "INVEST_HARDWARE":
      state.computeInputs.hardware += 1;
      state.production.compute *= 1.2;
      state.bonuses.computeToIntelligence *= 1.1;
      break;
    case "INVEST_REGULATION":
      state.computeInputs.regulation += 1;
      state.production.compute *= 1.15;
      break;
    case "INVEST_DATA_QUALITY":
      state.dataInputs.quality += 1;
      state.levels.data += 1;
      state.production.data *= 1.1;
      state.bonuses.dataToCompute *= 1.05;
      state.bonuses.dataToAlgorithm *= 1.05;
      state.bonuses.dataToIntelligence *= 1.05;
      break;
    case "INVEST_DATA_QUANTITY":
      state.dataInputs.quantity += 1;
      state.production.data *= 1.15;
      state.bonuses.dataToIntelligence *= 1.03;
      break;
    case "INVEST_DATA_FORMATS":
      state.dataInputs.formats += 1;
      state.production.data *= 1.12;
      state.bonuses.dataToIntelligence *= 1.08;
      state.bonuses.dataToAlgorithm *= 1.05;
      break;
    case "INVEST_ALGORITHM_ARCHITECTURE":
      state.algorithmInputs.architectures += 1;
      state.levels.algorithm += 1;
      state.production.algorithm *= 1.15;
      state.bonuses.algorithmToCompute *= 1.05;
      state.bonuses.algorithmToData *= 1.05;
      state.bonuses.algorithmToIntelligence *= 1.07;
      break;
    case "HIRE_RESEARCH_ENGINEER":
      state.algorithmInputs.researchEngineers += 1;
      break;
    case "BUILD_API_PLATFORM":
      state.revenue.apiPlatformBuilt = true;
      break;
    case "BUILD_CHATBOT_PLATFORM":
      state.revenue.chatbotPlatformBuilt = true;
      break;
    case "UPGRADE_DEVELOPER_TOOLS":
      state.revenue.developerToolsLevel += 1;
      state.revenue.developerToolsCost = Math.round(
        state.revenue.developerToolsCost * 2,
      );
      break;
    case "UPGRADE_CHATBOT":
      state.revenue.chatbotImprovementLevel += 1;
      state.revenue.chatbotImprovementCost = Math.round(
        state.revenue.chatbotImprovementCost * 2.5,
      );
      break;
    case "RUN_MARKETING_CAMPAIGN":
      state.revenue.subscribers += Math.round(
        1_000 * Math.max(1, state.intelligence / 200),
      );
      state.revenue.lastMarketingCampaign = state.clock.activeTick;
      state.revenue.marketingCampaignCost = Math.round(
        state.revenue.marketingCampaignCost * 1.5,
      );
      break;
  }
}

export function applyGameCommand(
  inputState: GameStateV2,
  inputCommand: GameCommand | unknown,
): EngineResult {
  gameStateSchema.parse(inputState);
  assertGameStateInvariants(inputState);
  const command = parseGameCommand(inputCommand);

  if (inputState.mechanics.appliedCommandIds.includes(command.id)) {
    return reject(inputState, command, "duplicate_command");
  }
  if (command.tick !== inputState.clock.activeTick) {
    return reject(inputState, command, "command_tick_mismatch", {
      expected: inputState.clock.activeTick,
      received: command.tick,
    });
  }
  if (inputState.clock.status === "completed") {
    return reject(inputState, command, "run_completed");
  }
  const businessRejection = validateCommandBusinessRules(inputState, command);
  if (businessRejection) {
    return reject(
      inputState,
      command,
      businessRejection.reasonId,
      businessRejection.params,
    );
  }

  const state = structuredClone(inputState);
  const effects: MutableEffects = [];
  const cost = investmentCost(state, command);
  if (cost !== null) applyInvestment(state, command, cost);

  switch (command.type) {
    case "START_RUN":
      state.clock.status = "running";
      break;
    case "PAUSE_RUN":
      state.clock.status = "paused";
      break;
    case "RESUME_RUN":
      state.clock.status = "running";
      break;
    case "TOGGLE_API_SERVICE":
      state.revenue.apiEnabled = !state.revenue.apiEnabled;
      if (state.revenue.apiEnabled && state.intelligence > 200) {
        state.revenue.baseApiRate = Math.max(1_500, state.revenue.baseApiRate);
      }
      break;
    case "TOGGLE_CHATBOT_SERVICE":
      state.revenue.chatbotEnabled = !state.revenue.chatbotEnabled;
      break;
    case "SET_MONTHLY_FEE": {
      const before = state.revenue.subscribers;
      if (
        command.payload.fee > state.revenue.monthlyFee * 1.5 &&
        before > 100
      ) {
        state.revenue.subscribers = Math.floor(before * 0.95);
        const count = before - state.revenue.subscribers;
        if (count > 0) {
          pushEffect(state, effects, {
            type: "CUSTOMERS_LOST",
            service: "chatbot",
            count,
          });
        }
      }
      state.revenue.monthlyFee = command.payload.fee;
      break;
    }
    case "START_TRAINING": {
      const run = getTrainingRun(state, command.payload.targetEra)!;
      recordSpend(state, run.moneyCost, "training");
      state.training.active = true;
      state.training.daysRemaining = run.daysRequired;
      state.training.computeReserved = run.computeRequired;
      state.computeCapacity.available -= run.computeRequired;
      state.computeCapacity.used += run.computeRequired;
      run.status = TrainingStatus.IN_PROGRESS;
      run.daysRemaining = run.daysRequired;
      run.isTrainingReserveActive = true;
      pushEffect(state, effects, {
        type: "TRAINING_STARTED",
        targetEra: command.payload.targetEra,
      });
      break;
    }
  }

  state.mechanics.appliedCommandIds.push(command.id);
  if (
    command.type === "INVEST_COMPUTE" ||
    command.type === "INVEST_DATA_QUALITY" ||
    command.type === "INVEST_DATA_QUANTITY" ||
    command.type === "INVEST_DATA_FORMATS" ||
    command.type === "INVEST_ALGORITHM_ARCHITECTURE" ||
    command.type === "INVEST_ELECTRICITY" ||
    command.type === "INVEST_HARDWARE" ||
    command.type === "INVEST_REGULATION"
  ) {
    unlockOneBreakthrough(state, effects);
  }
  processFunding(state, effects);
  const normalized = normalizeGameState(state);
  return { state: normalized, effects, acceptedCommandId: command.id };
}

export function advanceGameOneTick(inputState: GameStateV2): EngineResult {
  gameStateSchema.parse(inputState);
  assertGameStateInvariants(inputState);
  if (inputState.clock.status !== "running") {
    return { state: inputState, effects: [] };
  }

  const state = structuredClone(inputState);
  const effects: MutableEffects = [];
  state.clock.activeTick += 1;
  state.daysElapsed = state.clock.activeTick;
  productionTick(state);
  processFunding(state, effects);
  updateResearchOrTraining(state, effects);
  intelligenceTick(state);
  processFunding(state, effects);

  if (state.clock.activeTick % 5 === 0) {
    calculateRevenue(state, effects);
  }
  if (state.clock.activeTick % 30 === 0) {
    const draw = drawRandom(state.random);
    state.random = draw.random;
    if (draw.value < 0.2) triggerEvent(state, effects);
  }

  state.computeCapacity.maxCapacity = calculateMaxComputeCapacity(state);
  state.computeCapacity.available = Math.max(
    0,
    state.computeCapacity.maxCapacity - state.computeCapacity.used,
  );
  state.computeCapacity.freeCompute = state.computeCapacity.available;
  if (
    state.computeCapacity.used /
      Math.max(1, state.computeCapacity.maxCapacity) >=
    0.9
  ) {
    state.facts.capacityPressureTicks += 1;
  }

  if (
    state.currentEra === Era.GNT7 &&
    state.training.runs[Era.GNT7].status === TrainingStatus.COMPLETE &&
    state.intelligence >= state.agiThreshold
  ) {
    state.clock.status = "completed";
    pushEffect(state, effects, {
      type: "RUN_COMPLETED",
      activeTicks: state.clock.activeTick,
    });
  }

  return { state: normalizeGameState(state), effects };
}

export function advanceGameTicks(
  inputState: GameStateV2,
  count: number,
): EngineResult {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("tick count must be a nonnegative integer");
  }
  let state = inputState;
  const effects: EngineEffect[] = [];
  for (let index = 0; index < count; index += 1) {
    const result = advanceGameOneTick(state);
    state = result.state;
    effects.push(...result.effects);
    if (state.clock.status !== "running") break;
  }
  return { state, effects };
}
