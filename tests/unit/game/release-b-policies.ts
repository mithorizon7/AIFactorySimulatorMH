import { Era, getNextEra } from "../../../shared/game/domain/era";
import { createHash } from "node:crypto";
import { canonicalJson } from "../../../client/src/lib/persistence/repository";
import {
  applyGameCommand,
  advanceGameOneTick,
  getServiceDemand,
  inspectCommand,
} from "../../../shared/game/engine";
import { createFreshGameState } from "../../../shared/game/factory";
import { getRuleset } from "../../../shared/game/rulesets";
import type {
  GameCommand,
  GameCommandIntent,
} from "../../../shared/game/schemas/commands";
import type { EngineEffect } from "../../../shared/game/schemas/effects";
import type { GameStateV2 } from "../../../shared/game/schemas/state";
import { COMMAND_SCHEMA_VERSION } from "../../../shared/version";

export const CALIBRATION_SEEDS = [
  1, 7, 19, 42, 123, 777, 2026, 12345, 65537, 0x12345678, 0x7fffffff,
  0xfffffffe, 2, 3, 5, 11, 29, 61, 97, 127, 257, 1021, 4093, 8191, 65521, 99991,
  104729, 16777213, 0x31415926, 0x40000001, 0x80000001, 0xffffffff,
] as const;
export const RELEASE_B_POLICIES = [
  "prerequisite-minimal",
  "revenue-first",
  "capacity-first",
  "research-heavy",
  "commercial-heavy",
  "resilience-heavy",
  "adaptive",
] as const;
export type ReleaseBPolicy = (typeof RELEASE_B_POLICIES)[number];
type EmptyIntentType = Exclude<
  GameCommandIntent["type"],
  "SET_MONTHLY_FEE" | "START_TRAINING"
>;

export function releaseBStrategy(
  seed: number,
  policy: ReleaseBPolicy,
  options: { poorOpening?: boolean; maxTicks?: number } = {},
) {
  let state = createFreshGameState({ ruleset: "release-b.1", seed });
  let serial = 0;
  let pausedForTraining = false;
  let previousEra = state.currentEra;
  let minimumCash = state.money;
  let firstTrainingTick: number | null = null;
  let serviceTicks = 0;
  const accepted: GameCommand[] = [];
  const effects: EngineEffect[] = [];
  const eraTicks: Partial<Record<Era, number>> = {};
  const issue = (intent: GameCommandIntent): boolean => {
    if (!inspectCommand(state, intent).enabled) return false;
    const command = {
      ...intent,
      id: `00000000-0000-4000-8000-${(++serial).toString(16).padStart(12, "0")}`,
      tick: state.clock.activeTick,
      commandSchemaVersion: COMMAND_SCHEMA_VERSION,
    } as GameCommand;
    const result = applyGameCommand(state, command);
    if (!result.acceptedCommandId)
      throw new Error("inspection/application disagreement");
    state = result.state;
    accepted.push(command);
    effects.push(...result.effects);
    minimumCash = Math.min(minimumCash, state.money);
    return true;
  };
  const buy = (type: EmptyIntentType) => issue({ type, payload: {} });
  issue({ type: "START_RUN", payload: {} });
  if (options.poorOpening)
    for (let i = 0; i < 20 && buy("INVEST_COMPUTE"); i++);
  const step = () => {
    if (state.clock.status !== "running") return state;
    if (previousEra !== state.currentEra) {
      previousEra = state.currentEra;
      pausedForTraining = false;
    }
    if (state.clock.activeTick % 10 === 0) {
      const target = getNextEra(state.currentEra);
      const run = target
        ? state.training.runs[target as keyof typeof state.training.runs]
        : null;
      if (policy === "capacity-first" && !state.training.active) {
        if (
          state.levels.compute <
          Math.max(4, (run?.prerequisites.compute ?? 1) + 1)
        )
          buy("INVEST_COMPUTE");
        if (
          state.computeInputs.hardware <
          Math.max(3, (run?.prerequisites.computeInputs.hardware ?? 1) + 1)
        )
          buy("INVEST_HARDWARE");
      }
      if (policy === "research-heavy" && !state.training.active) {
        if (state.algorithmInputs.researchEngineers < 4)
          buy("HIRE_RESEARCH_ENGINEER");
        if (
          state.algorithmInputs.architectures <
          (run?.prerequisites.algorithm.architectures ?? 1) + 2
        )
          buy("INVEST_ALGORITHM_ARCHITECTURE");
      }
      if (
        policy === "resilience-heavy" &&
        !state.training.active &&
        state.money > (run?.moneyCost ?? 0) + 5000
      ) {
        const rule = getRuleset(state.rulesetVersion).governance;
        const hardware =
          state.currentEra === Era.GNT6
            ? rule.targetHardware
            : (run?.prerequisites.computeInputs.hardware ?? 1) + 1;
        const regulation =
          state.currentEra === Era.GNT6
            ? rule.targetRegulation
            : (run?.prerequisites.computeInputs.regulation ?? 1) + 1;
        if (state.computeInputs.hardware < hardware) buy("INVEST_HARDWARE");
        if (state.computeInputs.regulation < regulation)
          buy("INVEST_REGULATION");
      }
      const commercial =
        policy === "revenue-first" ||
        policy === "commercial-heavy" ||
        policy === "adaptive";
      if (commercial && !pausedForTraining) {
        if (state.revenue.apiAvailable && !state.revenue.apiPlatformBuilt)
          buy("BUILD_API_PLATFORM");
        if (state.revenue.apiPlatformBuilt && !state.revenue.apiEnabled)
          buy("TOGGLE_API_SERVICE");
        if (
          policy === "revenue-first" &&
          state.revenue.apiPlatformBuilt &&
          state.revenue.developerToolsLevel < 1
        )
          buy("UPGRADE_DEVELOPER_TOOLS");
        if (
          state.revenue.chatbotAvailable &&
          !state.revenue.chatbotPlatformBuilt
        )
          buy("BUILD_CHATBOT_PLATFORM");
        if (state.revenue.chatbotPlatformBuilt && !state.revenue.chatbotEnabled)
          buy("TOGGLE_CHATBOT_SERVICE");
        if (policy === "commercial-heavy") {
          if (
            state.facts.peakCapacityShortfallRatio > 0 &&
            getServiceDemand(state).total >
              state.computeCapacity.maxCapacity * 0.8
          )
            buy("INVEST_COMPUTE");
          if (state.revenue.developerToolsLevel < 3)
            buy("UPGRADE_DEVELOPER_TOOLS");
          if (
            state.revenue.chatbotEnabled &&
            state.clock.activeTick % 100 === 0 &&
            accepted.filter(
              (command) => command.type === "RUN_MARKETING_CAMPAIGN",
            ).length < 6
          )
            buy("RUN_MARKETING_CAMPAIGN");
          if (state.revenue.chatbotEnabled && state.revenue.monthlyFee !== 25)
            issue({ type: "SET_MONTHLY_FEE", payload: { fee: 25 } });
        }
      }
      if (policy === "adaptive" && !state.training.active) {
        if (state.algorithmInputs.researchEngineers < 2)
          buy("HIRE_RESEARCH_ENGINEER");
        if (
          getServiceDemand(state).total >
          state.computeCapacity.maxCapacity * 0.8
        )
          buy("INVEST_COMPUTE");
        if (state.currentEra === Era.GNT5 && state.dataInputs.quality < 9)
          buy("INVEST_DATA_QUALITY");
      }
      if (run && !state.training.active) {
        const r = run.prerequisites;
        const needed: Array<[EmptyIntentType, boolean]> = [
          ["INVEST_COMPUTE", state.levels.compute < r.compute],
          ["INVEST_DATA_QUALITY", state.dataInputs.quality < r.data.quality],
          ["INVEST_DATA_QUANTITY", state.dataInputs.quantity < r.data.quantity],
          ["INVEST_DATA_FORMATS", state.dataInputs.formats < r.data.formats],
          [
            "INVEST_ALGORITHM_ARCHITECTURE",
            state.algorithmInputs.architectures < r.algorithm.architectures,
          ],
          [
            "INVEST_ELECTRICITY",
            state.computeInputs.electricity < r.computeInputs.electricity,
          ],
          [
            "INVEST_HARDWARE",
            state.computeInputs.hardware < r.computeInputs.hardware,
          ],
          [
            "INVEST_REGULATION",
            state.computeInputs.regulation < r.computeInputs.regulation,
          ],
        ];
        for (const [type, required] of needed) if (required) buy(type);
        if (state.computeCapacity.maxCapacity < run.computeRequired)
          buy("INVEST_COMPUTE");
        if (
          state.training.algorithmResearchProgress >=
            r.algorithm.researchProgress &&
          state.money >= run.moneyCost
        ) {
          if (state.computeCapacity.available < run.computeRequired) {
            pausedForTraining = true;
            if (state.revenue.apiEnabled) buy("TOGGLE_API_SERVICE");
            if (state.revenue.chatbotEnabled) buy("TOGGLE_CHATBOT_SERVICE");
          }
          issue({ type: "START_TRAINING", payload: { targetEra: target! } });
        }
      }
    }
    if (state.revenue.apiEnabled || state.revenue.chatbotEnabled)
      serviceTicks++;
    const result = advanceGameOneTick(state);
    state = result.state;
    effects.push(...result.effects);
    for (const effect of result.effects)
      if (effect.type === "ERA_ADVANCED") {
        eraTicks[effect.era] = effect.tick;
        if (effect.era === Era.GNT3) firstTrainingTick = effect.tick;
      }
    minimumCash = Math.min(minimumCash, state.money);
    return state;
  };
  return {
    step,
    issue,
    accepted,
    effects,
    state: () => state,
    evidence: () => ({
      minimumCash,
      firstTrainingTick,
      eraTicks,
      serviceTicks,
    }),
    finish: () => {
      while (
        state.clock.status === "running" &&
        state.clock.activeTick < (options.maxTicks ?? 2400)
      )
        step();
      return state;
    },
  };
}

export interface SimulationRow {
  seed: number;
  policy: ReleaseBPolicy;
  completed: boolean;
  activeTicks: number;
  firstTrainingTick: number | null;
  finalCapability: number;
  spend: number;
  revenue: number;
  meanShortfall: number;
  interventions: number;
  commandCount: number;
  rngState: number;
  rngDraws: number;
  eventIds: number[];
  stateDigest: string;
  categories: GameStateV2["facts"]["spendByCategory"];
}
export function simulatePolicy(
  seed: number,
  policy: ReleaseBPolicy,
): SimulationRow {
  const agent = releaseBStrategy(seed, policy);
  const state = agent.finish();
  return {
    seed,
    policy,
    completed: state.clock.status === "completed",
    activeTicks: state.clock.activeTick,
    firstTrainingTick: agent.evidence().firstTrainingTick,
    finalCapability: state.intelligence,
    spend: state.facts.totalSpend,
    revenue: state.facts.earnedRevenue,
    meanShortfall:
      state.facts.capacityShortfallRatioSum /
      Math.max(1, state.clock.activeTick),
    interventions: state.facts.emergencyFundingInterventions,
    commandCount: agent.accepted.length,
    rngState: state.random.state,
    rngDraws: state.random.draws,
    eventIds: state.events
      .filter((event) => event.triggered)
      .map((event) => event.id),
    stateDigest: createHash("sha256")
      .update(canonicalJson(state))
      .digest("hex"),
    categories: state.facts.spendByCategory,
  };
}

export function dominates(a: SimulationRow, b: SimulationRow): boolean {
  const differences = [
    b.activeTicks - a.activeTicks,
    (b.firstTrainingTick ?? Infinity) - (a.firstTrainingTick ?? Infinity),
    a.finalCapability - b.finalCapability,
    b.spend - a.spend,
    a.revenue - b.revenue,
    b.meanShortfall - a.meanShortfall,
    b.interventions - a.interventions,
  ];
  return (
    differences.every((difference) => difference >= -0.000001) &&
    differences.some((difference) => difference > 0.000001)
  );
}
