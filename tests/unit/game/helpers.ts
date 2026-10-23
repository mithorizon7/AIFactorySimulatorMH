import { getNextEra, type Era } from "@shared/game/domain/era";
import { TrainingStatus } from "@shared/game/domain/gameState";
import { advanceGameOneTick, applyGameCommand } from "@shared/game/engine";
import { createFreshGameState } from "@shared/game/factory";
import { normalizeGameState } from "@shared/game/normalize";
import type { GameCommand } from "@shared/game/schemas/commands";
import { gameStateSchema, type GameStateV2 } from "@shared/game/schemas/state";
import {
  COMMAND_SCHEMA_VERSION,
  LEGACY_RULESET_VERSION,
} from "@shared/version";

type CommandType = GameCommand["type"];
type CommandPayload<T extends CommandType> = Extract<
  GameCommand,
  { type: T }
>["payload"];

let commandSequence = 0;

export function resetCommandSequence(): void {
  commandSequence = 0;
}

export function issue<T extends CommandType>(
  state: GameStateV2,
  type: T,
  payload: CommandPayload<T>,
) {
  commandSequence += 1;
  const command = {
    id: `00000000-0000-4000-8000-${commandSequence
      .toString(16)
      .padStart(12, "0")}`,
    tick: state.clock.activeTick,
    commandSchemaVersion: COMMAND_SCHEMA_VERSION,
    type,
    payload,
  } as Extract<GameCommand, { type: T }>;
  return { command, result: applyGameCommand(state, command) };
}

export function fresh(seed = 1): GameStateV2 {
  resetCommandSequence();
  return createFreshGameState({ ruleset: LEGACY_RULESET_VERSION, seed });
}

export function withCash(input: GameStateV2, amount: number): GameStateV2 {
  const state = structuredClone(input);
  state.money = amount;
  state.facts.startingMoney = amount;
  state.facts.peakMoney = amount;
  return normalizeGameState(state);
}

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

export function expectCoreInvariants(state: GameStateV2): void {
  gameStateSchema.parse(state);
  const spendTotal = Object.values(state.facts.spendByCategory).reduce(
    (sum, value) => sum + value,
    0,
  );
  if (Math.abs(spendTotal - state.facts.totalSpend) > 0.001) {
    throw new Error("spend ledger mismatch");
  }
  const expectedMoney =
    state.facts.startingMoney +
    state.facts.earnedRevenue +
    state.facts.externalFunding +
    state.facts.otherCashAdjustments -
    state.facts.totalSpend;
  if (Math.abs(expectedMoney - state.money) > 0.011) {
    throw new Error("cash ledger mismatch");
  }
  if (
    state.computeCapacity.available + state.computeCapacity.used >
    state.computeCapacity.maxCapacity + 0.001
  ) {
    throw new Error("compute conservation mismatch");
  }
  if (state.training.computeReserved > state.computeCapacity.used) {
    throw new Error("training reserve exceeds used capacity");
  }
  if (state.computeCapacity.freeCompute > state.computeCapacity.available) {
    throw new Error("free compute exceeds available capacity");
  }
}

function buyPrerequisites(state: GameStateV2, target: Era): GameStateV2 {
  const run = state.training.runs[target as keyof typeof state.training.runs];
  const commands: Array<[CommandType, Record<string, never>]> = [];
  while (
    state.levels.compute +
      commands.filter(([type]) => type === "INVEST_COMPUTE").length <
    run.prerequisites.compute
  ) {
    commands.push(["INVEST_COMPUTE", {}]);
  }
  while (
    state.dataInputs.quality +
      commands.filter(([type]) => type === "INVEST_DATA_QUALITY").length <
    run.prerequisites.data.quality
  ) {
    commands.push(["INVEST_DATA_QUALITY", {}]);
  }
  while (
    state.dataInputs.quantity +
      commands.filter(([type]) => type === "INVEST_DATA_QUANTITY").length <
    run.prerequisites.data.quantity
  ) {
    commands.push(["INVEST_DATA_QUANTITY", {}]);
  }
  while (
    state.dataInputs.formats +
      commands.filter(([type]) => type === "INVEST_DATA_FORMATS").length <
    run.prerequisites.data.formats
  ) {
    commands.push(["INVEST_DATA_FORMATS", {}]);
  }
  while (
    state.algorithmInputs.architectures +
      commands.filter(([type]) => type === "INVEST_ALGORITHM_ARCHITECTURE")
        .length <
    run.prerequisites.algorithm.architectures
  ) {
    commands.push(["INVEST_ALGORITHM_ARCHITECTURE", {}]);
  }
  while (
    state.computeInputs.electricity +
      commands.filter(([type]) => type === "INVEST_ELECTRICITY").length <
    run.prerequisites.computeInputs.electricity
  ) {
    commands.push(["INVEST_ELECTRICITY", {}]);
  }
  while (
    state.computeInputs.hardware +
      commands.filter(([type]) => type === "INVEST_HARDWARE").length <
    run.prerequisites.computeInputs.hardware
  ) {
    commands.push(["INVEST_HARDWARE", {}]);
  }
  while (
    state.computeInputs.regulation +
      commands.filter(([type]) => type === "INVEST_REGULATION").length <
    run.prerequisites.computeInputs.regulation
  ) {
    commands.push(["INVEST_REGULATION", {}]);
  }

  for (const [type] of commands) {
    const result = issue(state, type as "INVEST_COMPUTE", {}).result;
    if (!result.acceptedCommandId) break;
    state = result.state;
  }
  return state;
}

export interface StrategyResult {
  state: GameStateV2;
  operations: Array<GameCommand | { type: "TICK" }>;
}

/** A public-command-only recovery strategy used as reachability evidence. */
export function runBalancedRecoveryStrategy(
  seed: number,
  maxTicks = 750,
): StrategyResult {
  let state = fresh(seed);
  const operations: StrategyResult["operations"] = [];
  const started = issue(state, "START_RUN", {});
  state = started.result.state;
  operations.push(started.command);

  while (
    state.clock.status === "running" &&
    state.clock.activeTick < maxTicks
  ) {
    const target = getNextEra(state.currentEra);
    if (target && !state.training.active) {
      const beforeCommands = state.mechanics.appliedCommandIds.length;
      state = buyPrerequisites(state, target);
      const addedIds = state.mechanics.appliedCommandIds.slice(beforeCommands);
      for (const id of addedIds) {
        // The full replay is built separately in replay tests; reachability only
        // needs to prove that every mutation came through a command ID.
        if (!id) throw new Error("missing public command id");
      }

      const run =
        state.training.runs[target as keyof typeof state.training.runs];
      if (
        state.training.algorithmResearchProgress >=
          run.prerequisites.algorithm.researchProgress &&
        state.money >= run.moneyCost &&
        state.computeCapacity.available >= run.computeRequired
      ) {
        const training = issue(state, "START_TRAINING", { targetEra: target });
        state = training.result.state;
        operations.push(training.command);
      } else if (
        state.computeCapacity.available < run.computeRequired &&
        state.revenue.apiEnabled
      ) {
        const toggle = issue(state, "TOGGLE_API_SERVICE", {});
        state = toggle.result.state;
        operations.push(toggle.command);
      } else if (
        state.computeCapacity.available < run.computeRequired &&
        state.revenue.chatbotEnabled
      ) {
        const toggle = issue(state, "TOGGLE_CHATBOT_SERVICE", {});
        state = toggle.result.state;
        operations.push(toggle.command);
      }
    }

    const tick = advanceGameOneTick(state);
    state = tick.state;
    operations.push({ type: "TICK" });
    expectCoreInvariants(state);
  }
  return { state, operations };
}

export function completedTrainingCount(state: GameStateV2): number {
  return Object.values(state.training.runs).filter(
    (run) => run.status === TrainingStatus.COMPLETE,
  ).length;
}
