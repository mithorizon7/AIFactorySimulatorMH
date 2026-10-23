import fc from "fast-check";
import { expect, it } from "vitest";
import { Era, getNextEra } from "../../../shared/game/domain/era";
import {
  advanceGameOneTick,
  applyGameCommand,
  inspectCommand,
} from "../../../shared/game/engine";
import { createFreshGameState } from "../../../shared/game/factory";
import type {
  GameCommand,
  GameCommandIntent,
} from "../../../shared/game/schemas/commands";
import type { GameStateV2 } from "../../../shared/game/schemas/state";
import { COMMAND_SCHEMA_VERSION } from "../../../shared/version";
import { deepFreeze, expectCoreInvariants } from "./helpers";
import { releaseBStrategy } from "./release-b-policies";

type Operation = GameCommand | { type: "TICK" };
const emptyTypes = [
  "INVEST_COMPUTE",
  "INVEST_DATA_QUALITY",
  "INVEST_DATA_QUANTITY",
  "INVEST_DATA_FORMATS",
  "INVEST_ALGORITHM_ARCHITECTURE",
  "HIRE_RESEARCH_ENGINEER",
  "INVEST_ELECTRICITY",
  "INVEST_HARDWARE",
  "INVEST_REGULATION",
  "BUILD_API_PLATFORM",
  "BUILD_CHATBOT_PLATFORM",
  "TOGGLE_API_SERVICE",
  "TOGGLE_CHATBOT_SERVICE",
  "RUN_MARKETING_CAMPAIGN",
  "UPGRADE_DEVELOPER_TOOLS",
  "UPGRADE_CHATBOT",
  "PAUSE_RUN",
  "RESUME_RUN",
] as const;
const execute = (state: GameStateV2, operation: Operation) =>
  operation.type === "TICK"
    ? advanceGameOneTick(state).state
    : applyGameCommand(state, operation).state;

it("qualifies B immutability, ledger/capacity invariants, pause, command rejection, JSON recovery and replay across all era checkpoints", () => {
  const agent = releaseBStrategy(42, "adaptive");
  const checkpoints: GameStateV2[] = [agent.state()];
  let era = Era.GNT2;
  while (agent.state().clock.status === "running") {
    const next = agent.step();
    if (next.currentEra !== era) {
      era = next.currentEra;
      checkpoints.push(next);
    }
  }
  // Explicit pre/post recovery states supplement the ordinary era checkpoints.
  const poor = releaseBStrategy(19, "adaptive", { poorOpening: true });
  while (poor.state().clock.activeTick < 119) poor.step();
  checkpoints.push(poor.state());
  poor.step();
  checkpoints.push(poor.state());
  let serial = 50000;
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: checkpoints.length - 1 }),
      fc.array(
        fc.oneof(
          fc.constantFrom(...emptyTypes),
          fc.constant("TICK" as const),
          fc.constant("TRAIN" as const),
          fc.constant("FEE" as const),
        ),
        { minLength: 5, maxLength: 60 },
      ),
      (checkpointIndex, inputs) => {
        const start = JSON.parse(
          JSON.stringify(checkpoints[checkpointIndex]),
        ) as GameStateV2;
        let state = start;
        const operations: Operation[] = [];
        const states: GameStateV2[] = [state];
        for (const input of inputs) {
          const target = getNextEra(state.currentEra);
          const intent: GameCommandIntent | null =
            input === "TRAIN"
              ? target
                ? { type: "START_TRAINING", payload: { targetEra: target } }
                : null
              : input === "FEE"
                ? { type: "SET_MONTHLY_FEE", payload: { fee: 25 } }
                : input === "TICK"
                  ? null
                  : { type: input, payload: {} };
          const operation: Operation = intent
            ? ({
                ...intent,
                id: `00000000-0000-4000-8000-${(++serial).toString(16).padStart(12, "0")}`,
                tick: state.clock.activeTick,
                commandSchemaVersion: COMMAND_SCHEMA_VERSION,
              } as GameCommand)
            : { type: "TICK" };
          const before = JSON.stringify(state);
          deepFreeze(state);
          if (intent) {
            const inspection = inspectCommand(state, intent);
            const result = applyGameCommand(state, operation);
            expect(Boolean(result.acceptedCommandId)).toBe(inspection.enabled);
            state = result.state;
          } else {
            const previous = state;
            state = advanceGameOneTick(state).state;
            if (previous.clock.status !== "running")
              expect(state).toBe(previous);
          }
          expect(JSON.stringify(states.at(-1))).toBe(before);
          expectCoreInvariants(state);
          operations.push(operation);
          states.push(state);
        }
        const replay = operations.reduce(
          execute,
          createFreshReplayStart(start),
        );
        expect(replay).toEqual(state);
        const split = Math.floor(operations.length / 2);
        const resumed = operations
          .slice(split)
          .reduce(
            execute,
            JSON.parse(JSON.stringify(states[split])) as GameStateV2,
          );
        expect(resumed).toEqual(state);
      },
    ),
    { seed: 20261023, numRuns: 100 },
  );
}, 30000);

function createFreshReplayStart(state: GameStateV2): GameStateV2 {
  return JSON.parse(JSON.stringify(state));
}

it("replays a complete B commercial/recovery run and resumes at a mid-command snapshot identically", () => {
  const agent = releaseBStrategy(777, "commercial-heavy", {
    poorOpening: true,
  });
  const expected = agent.finish();
  let state = createFreshGameState({ ruleset: "release-b.1", seed: 777 });
  const split = Math.floor(agent.accepted.length / 2);
  for (let index = 0; index < agent.accepted.length; index++) {
    const command = agent.accepted[index];
    while (state.clock.activeTick < command.tick)
      state = advanceGameOneTick(state).state;
    state = applyGameCommand(state, command).state;
    if (index === split) state = JSON.parse(JSON.stringify(state));
  }
  while (state.clock.activeTick < expected.clock.activeTick)
    state = advanceGameOneTick(state).state;
  expect(state).toEqual(expected);
});
