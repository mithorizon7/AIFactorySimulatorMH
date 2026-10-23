import {
  applyGameCommand,
  advanceGameOneTick,
} from "../../../shared/game/engine";
import { createFreshGameState } from "../../../shared/game/factory";
import { getNextEra } from "../../../shared/game/domain/era";
import {
  COMMAND_SCHEMA_VERSION,
  LEGACY_RULESET_VERSION,
} from "../../../shared/version";
import type { GameCommand } from "../../../shared/game/schemas/commands";
import type { GameStateV2 } from "../../../shared/game/schemas/state";
import { expectCoreInvariants } from "./helpers";

export type Policy =
  | "prerequisite-minimal"
  | "revenue-first"
  | "capacity-first"
  | "low-cash-recovery"
  | "service-capacity-stress";
type EmptyCommand = Exclude<
  GameCommand["type"],
  "START_TRAINING" | "SET_MONTHLY_FEE"
>;
export function strategy(
  seed: number,
  policy: Policy,
  options: { requireShortfall?: boolean } = {},
) {
  let serial = 0;
  const accepted: GameCommand[] = [];
  let minimumCash = Infinity;
  let pressureExercised = false;
  let serviceTicks = 0;
  const command = (
    state: GameStateV2,
    type: GameCommand["type"],
    payload = {},
  ) => {
    const input = {
      id: `00000000-0000-4000-8000-${(++serial).toString(16).padStart(12, "0")}`,
      tick: state.clock.activeTick,
      commandSchemaVersion: COMMAND_SCHEMA_VERSION,
      type,
      payload,
    } as GameCommand;
    const result = applyGameCommand(state, input);
    if (result.acceptedCommandId) accepted.push(input);
    minimumCash = Math.min(minimumCash, result.state.money);
    return result.state;
  };
  const buy = (
    state: GameStateV2,
    type: EmptyCommand,
    needed: (state: GameStateV2) => boolean,
  ) => {
    for (let count = 0; count < 20 && needed(state); count++) {
      const next = command(state, type);
      if (
        next === state ||
        next.mechanics.appliedCommandIds.length ===
          state.mechanics.appliedCommandIds.length
      )
        break;
      state = next;
    }
    return state;
  };
  let initial = createFreshGameState({ ruleset: LEGACY_RULESET_VERSION, seed });
  initial = command(initial, "START_RUN");
  if (policy === "low-cash-recovery")
    initial = buy(initial, "INVEST_COMPUTE", () => true);
  const step = (input: GameStateV2): GameStateV2 => {
    let state = input;
    if (state.clock.status !== "running") return state;
    if (policy === "capacity-first") {
      state = buy(
        state,
        "INVEST_COMPUTE",
        (current) => current.levels.compute < 4,
      );
      state = buy(
        state,
        "INVEST_HARDWARE",
        (current) => current.computeInputs.hardware < 3,
      );
    }
    const commercial =
      policy === "revenue-first" ||
      (policy === "service-capacity-stress" && !pressureExercised);
    if (commercial) {
      if (state.revenue.apiAvailable && !state.revenue.apiPlatformBuilt)
        state = command(state, "BUILD_API_PLATFORM");
      if (state.revenue.apiPlatformBuilt && !state.revenue.apiEnabled)
        state = command(state, "TOGGLE_API_SERVICE");
      if (state.revenue.chatbotAvailable && !state.revenue.chatbotPlatformBuilt)
        state = command(state, "BUILD_CHATBOT_PLATFORM");
      if (state.revenue.chatbotPlatformBuilt && !state.revenue.chatbotEnabled)
        state = command(state, "TOGGLE_CHATBOT_SERVICE");
      if (policy === "service-capacity-stress" && state.revenue.chatbotEnabled)
        state = command(state, "RUN_MARKETING_CAMPAIGN");
    }
    const target = getNextEra(state.currentEra);
    const waitForRecovery =
      policy === "low-cash-recovery" && state.clock.activeTick < 65;
    const waitForPressure =
      policy === "service-capacity-stress" &&
      state.revenue.chatbotAvailable &&
      !pressureExercised;
    if (
      target &&
      !state.training.active &&
      !waitForRecovery &&
      !waitForPressure
    ) {
      const requirements =
        state.training.runs[target as keyof typeof state.training.runs]
          .prerequisites;
      const needs: Array<[EmptyCommand, (current: GameStateV2) => boolean]> = [
        ["INVEST_COMPUTE", (s) => s.levels.compute < requirements.compute],
        [
          "INVEST_DATA_QUALITY",
          (s) => s.dataInputs.quality < requirements.data.quality,
        ],
        [
          "INVEST_DATA_QUANTITY",
          (s) => s.dataInputs.quantity < requirements.data.quantity,
        ],
        [
          "INVEST_DATA_FORMATS",
          (s) => s.dataInputs.formats < requirements.data.formats,
        ],
        [
          "INVEST_ALGORITHM_ARCHITECTURE",
          (s) =>
            s.algorithmInputs.architectures <
            requirements.algorithm.architectures,
        ],
        [
          "INVEST_ELECTRICITY",
          (s) =>
            s.computeInputs.electricity <
            requirements.computeInputs.electricity,
        ],
        [
          "INVEST_HARDWARE",
          (s) => s.computeInputs.hardware < requirements.computeInputs.hardware,
        ],
        [
          "INVEST_REGULATION",
          (s) =>
            s.computeInputs.regulation < requirements.computeInputs.regulation,
        ],
      ];
      for (const [type, needed] of needs) state = buy(state, type, needed);
      const run =
        state.training.runs[target as keyof typeof state.training.runs];
      if (
        state.computeCapacity.available < run.computeRequired ||
        (policy === "service-capacity-stress" && pressureExercised)
      ) {
        if (state.revenue.apiEnabled)
          state = command(state, "TOGGLE_API_SERVICE");
        if (state.revenue.chatbotEnabled)
          state = command(state, "TOGGLE_CHATBOT_SERVICE");
      }
      state = command(state, "START_TRAINING", { targetEra: target });
    }
    if (state.revenue.apiEnabled || state.revenue.chatbotEnabled)
      serviceTicks++;
    state = advanceGameOneTick(state).state;
    pressureExercised ||=
      (!options.requireShortfall && state.facts.capacityPressureTicks > 0) ||
      state.facts.peakCapacityShortfallRatio > 0;
    minimumCash = Math.min(minimumCash, state.money);
    expectCoreInvariants(state);
    return state;
  };
  const finish = (input = initial, maxTicks = 2_000) => {
    let state = input;
    while (
      state.clock.status === "running" &&
      state.clock.activeTick < maxTicks
    )
      state = step(state);
    return state;
  };
  return {
    initial,
    step,
    finish,
    command,
    accepted,
    evidence: () => ({ minimumCash, pressureExercised, serviceTicks }),
  };
}
