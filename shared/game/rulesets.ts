import { Era, getEraIndex } from "./domain/era";
import { getBaseTrainingRunForEra, type TrainingRun } from "./domain/gameState";
import type { GameStateV2 } from "./schemas/state";
import type { RulesetVersion } from "../version";

export type TrainingEra = Exclude<Era, Era.GNT2>;
export interface RunwayRule {
  readonly id: string;
  readonly earliestTick: number;
  readonly targetCash: number;
}
export interface RulesetTuning {
  readonly version: RulesetVersion;
  readonly training: Readonly<
    Record<
      TrainingEra,
      Pick<
        TrainingRun,
        | "daysRequired"
        | "computeRequired"
        | "moneyCost"
        | "intelligenceGain"
        | "prerequisites"
      >
    >
  >;
  readonly trainingTicks: Readonly<Record<TrainingEra, number>>;
  readonly research: {
    readonly base: number;
    readonly minimum: number;
    readonly maximum: number;
    readonly computeLogFactor: number;
    readonly architectureFactor: number;
    readonly engineerFactor: number;
    readonly engineerMaximum: number;
  };
  readonly costs: {
    readonly engineerBase: number;
    readonly engineerGrowth: number;
    readonly levelGrowth: number;
    readonly era: Readonly<Record<Era, number>>;
  };
  readonly commercial: {
    readonly apiGrowthMaximum: number;
    readonly chatbotGrowthMaximum: number;
    readonly apiDemandPerThousandRevenue: number;
    readonly chatbotDemandPerSubscriber: number;
    readonly churn: number;
    readonly qualityEfficiencyPerLevel: number;
    readonly architectureEfficiencyPerLevel: number;
    readonly efficiencyFloor: number;
    readonly marketingCustomers: number;
  };
  readonly governance: {
    readonly targetRegulation: number;
    readonly targetHardware: number;
    readonly missingLevelTrainingTicks: number;
    readonly shortfallRiskPerMissingLevel: number;
  };
  readonly seedAssistTick: number;
  readonly recovery: Readonly<Partial<Record<Era, RunwayRule>>>;
}

const legacy: RulesetTuning = {
  version: "release-a.1",
  training: Object.fromEntries(
    [Era.GNT3, Era.GNT4, Era.GNT5, Era.GNT6, Era.GNT7].map((era) => {
      const run = getBaseTrainingRunForEra(era)!;
      return [
        era,
        {
          daysRequired: run.daysRequired,
          computeRequired: run.computeRequired,
          moneyCost: run.moneyCost,
          intelligenceGain: run.intelligenceGain,
          prerequisites: run.prerequisites,
        },
      ];
    }),
  ) as RulesetTuning["training"],
  trainingTicks: {
    [Era.GNT3]: 30,
    [Era.GNT4]: 30,
    [Era.GNT5]: 30,
    [Era.GNT6]: 30,
    [Era.GNT7]: 30,
  },
  research: {
    base: 0.5,
    minimum: 0.1,
    maximum: Infinity,
    computeLogFactor: 0.5,
    architectureFactor: 0.1,
    engineerFactor: 0.25,
    engineerMaximum: Infinity,
  },
  costs: {
    engineerBase: 250,
    engineerGrowth: 1,
    levelGrowth: 1.4,
    era: {
      [Era.GNT2]: 1,
      [Era.GNT3]: 1.2,
      [Era.GNT4]: 1.5,
      [Era.GNT5]: 2,
      [Era.GNT6]: 3,
      [Era.GNT7]: 4,
    },
  },
  commercial: {
    apiGrowthMaximum: 0.15,
    chatbotGrowthMaximum: 0.12,
    apiDemandPerThousandRevenue: 5,
    chatbotDemandPerSubscriber: 0.01,
    churn: 0.25,
    qualityEfficiencyPerLevel: 0,
    architectureEfficiencyPerLevel: 0,
    efficiencyFloor: 1,
    marketingCustomers: 1000,
  },
  governance: {
    targetRegulation: 0,
    targetHardware: 0,
    missingLevelTrainingTicks: 0,
    shortfallRiskPerMissingLevel: 0,
  },
  seedAssistTick: 30,
  recovery: {
    [Era.GNT2]: {
      id: "gnt2_continuity_v1",
      earliestTick: 60,
      targetCash: 30000,
    },
    [Era.GNT3]: {
      id: "gnt3_continuity_v1",
      earliestTick: 180,
      targetCash: 130000,
    },
    [Era.GNT4]: {
      id: "gnt4_continuity_v1",
      earliestTick: 300,
      targetCash: 650000,
    },
    [Era.GNT5]: {
      id: "gnt5_continuity_v1",
      earliestTick: 420,
      targetCash: 2500000,
    },
    [Era.GNT6]: {
      id: "gnt6_completion_v1",
      earliestTick: 540,
      targetCash: 12000000,
    },
  },
};

const betterGame: RulesetTuning = {
  ...legacy,
  version: "release-b.1",
  trainingTicks: {
    [Era.GNT3]: 240,
    [Era.GNT4]: 140,
    [Era.GNT5]: 140,
    [Era.GNT6]: 140,
    [Era.GNT7]: 140,
  },
  research: {
    base: 0.22,
    minimum: 0.1,
    maximum: 0.85,
    computeLogFactor: 0.09,
    architectureFactor: 0.1,
    engineerFactor: 0.035,
    engineerMaximum: 0.14,
  },
  costs: { ...legacy.costs, engineerBase: 350, engineerGrowth: 1.8 },
  commercial: {
    apiGrowthMaximum: 0.035,
    chatbotGrowthMaximum: 0.025,
    apiDemandPerThousandRevenue: 300,
    chatbotDemandPerSubscriber: 90,
    churn: 0.3,
    qualityEfficiencyPerLevel: 0.035,
    architectureEfficiencyPerLevel: 0.025,
    efficiencyFloor: 0.45,
    marketingCustomers: 2000,
  },
  governance: {
    targetRegulation: 8,
    targetHardware: 10,
    missingLevelTrainingTicks: 20,
    shortfallRiskPerMissingLevel: 0.08,
  },
  seedAssistTick: 60,
  recovery: {
    [Era.GNT2]: { id: "b_seed_runway", earliestTick: 120, targetCash: 45000 },
    [Era.GNT3]: { id: "b_api_bridge", earliestTick: 540, targetCash: 150000 },
    [Era.GNT4]: {
      id: "b_growth_bridge",
      earliestTick: 800,
      targetCash: 750000,
    },
    [Era.GNT5]: {
      id: "b_efficiency_bridge",
      earliestTick: 1060,
      targetCash: 3000000,
    },
    [Era.GNT6]: {
      id: "b_resilience_bridge",
      earliestTick: 1320,
      targetCash: 14000000,
    },
  },
};

/** Immutable, version-selected mechanics. Configuration is never persisted. */
export function getRuleset(version: RulesetVersion): RulesetTuning {
  return version === "release-b.1" ? betterGame : legacy;
}

export function governanceGap(state: GameStateV2): number {
  if (state.rulesetVersion !== "release-b.1" || state.currentEra !== Era.GNT6)
    return 0;
  const rule = getRuleset(state.rulesetVersion).governance;
  return (
    Math.max(0, rule.targetRegulation - state.computeInputs.regulation) +
    Math.max(0, rule.targetHardware - state.computeInputs.hardware)
  );
}

export function serviceEfficiency(state: GameStateV2): number {
  if (
    state.rulesetVersion !== "release-b.1" ||
    getEraIndex(state.currentEra) < getEraIndex(Era.GNT5)
  )
    return 1;
  const rule = betterGame.commercial;
  return Math.max(
    rule.efficiencyFloor,
    1 -
      Math.max(0, state.dataInputs.quality - 1) *
        rule.qualityEfficiencyPerLevel -
      Math.max(0, state.algorithmInputs.architectures - 1) *
        rule.architectureEfficiencyPerLevel,
  );
}

export function configureFreshState(state: GameStateV2): GameStateV2 {
  if (state.rulesetVersion !== "release-b.1") return state;
  for (const [era, ticks] of Object.entries(betterGame.trainingTicks)) {
    const run = state.training.runs[era as TrainingEra];
    Object.assign(
      run,
      structuredClone(betterGame.training[era as TrainingEra]),
    );
    run.daysRequired = ticks;
    run.daysRemaining = ticks;
  }
  return state;
}

function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);
  for (const nested of Object.values(value))
    if (nested && typeof nested === "object" && !Object.isFrozen(nested))
      deepFreeze(nested);
  return value;
}

deepFreeze(legacy);
deepFreeze(betterGame);
