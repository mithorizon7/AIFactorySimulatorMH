import { describe, expect, it, vi } from "vitest";
import {
  advanceGameOneTick,
  advanceGameTicks,
  applyGameCommand,
} from "@shared/game/engine";
import { COMMAND_SCHEMA_VERSION } from "@shared/version";
import {
  deepFreeze,
  fresh,
  issue,
  runBalancedRecoveryStrategy,
} from "./helpers";

describe("active clock", () => {
  it("starts idempotently without consuming time and uses distinct pause/resume", () => {
    let state = fresh();
    const first = issue(state, "START_RUN", {});
    state = first.result.state;
    expect(state.clock).toEqual({ status: "running", activeTick: 0 });

    const second = issue(state, "START_RUN", {});
    state = second.result.state;
    expect(second.result.acceptedCommandId).toBe(second.command.id);
    expect(state.clock).toEqual({ status: "running", activeTick: 0 });

    state = advanceGameOneTick(state).state;
    expect(state.clock.activeTick).toBe(1);
    expect(state.daysElapsed).toBe(1);
    state = issue(state, "PAUSE_RUN", {}).result.state;
    const paused = structuredClone(state);
    for (let index = 0; index < 100; index += 1) {
      state = advanceGameOneTick(state).state;
    }
    expect(state).toEqual(paused);
    state = issue(state, "RESUME_RUN", {}).result.state;
    state = advanceGameOneTick(state).state;
    expect(state.clock.activeTick).toBe(2);
  });

  it("rejects invalid clock transitions without changing facts", () => {
    const state = fresh();
    const before = structuredClone(state.facts);
    const paused = issue(state, "PAUSE_RUN", {}).result;
    expect(paused.state).toBe(state);
    expect(paused.effects[0]).toMatchObject({
      type: "COMMAND_REJECTED",
      reasonId: "pause_not_allowed",
    });
    expect(paused.state.facts).toEqual(before);
  });

  it("rejects every command after completion", () => {
    const completed = runBalancedRecoveryStrategy(1).state;
    expect(completed.clock.status).toBe("completed");
    const result = issue(completed, "INVEST_COMPUTE", {}).result;
    expect(result.state).toBe(completed);
    expect(result.effects[0]).toMatchObject({ reasonId: "run_completed" });
  });

  it("makes a single tick equivalent to each batched tick", () => {
    let state = issue(fresh(19), "START_RUN", {}).result.state;
    const batch = advanceGameTicks(state, 30);
    for (let index = 0; index < 30; index += 1) {
      state = advanceGameOneTick(state).state;
    }
    expect(batch.state).toEqual(state);
  });

  it("does not call wall-clock or ambient random APIs", () => {
    const dateSpy = vi.spyOn(Date, "now").mockImplementation(() => {
      throw new Error("Date.now must not be used by simulation");
    });
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random must not be used by simulation");
    });
    const state = issue(fresh(1), "START_RUN", {}).result.state;
    expect(() => advanceGameTicks(state, 90)).not.toThrow();
    dateSpy.mockRestore();
    randomSpy.mockRestore();
  });
});

describe("persisted xorshift32-v1", () => {
  it("matches the standard seed-one vector", () => {
    let state = issue(fresh(1), "START_RUN", {}).result.state;
    const vector = [270369, 67634689, 2647435461, 307599695, 2398689233];
    for (const expected of vector) {
      state = advanceGameTicks(state, 30).state;
      expect(state.random.state).toBe(expected);
    }
    expect(state.random.draws).toBe(5);
  });

  it("draws exactly once at each active tick divisible by 30", () => {
    let state = issue(fresh(1), "START_RUN", {}).result.state;
    state = advanceGameTicks(state, 29).state;
    expect(state.random.draws).toBe(0);
    state = advanceGameOneTick(state).state;
    expect(state.random.draws).toBe(1);
    state = issue(state, "PAUSE_RUN", {}).result.state;
    state = advanceGameTicks(state, 300).state;
    expect(state.random.draws).toBe(1);
  });

  it("continues identically after JSON snapshot parsing", () => {
    let state = issue(fresh(12345), "START_RUN", {}).result.state;
    state = advanceGameTicks(state, 67).state;
    const resumed = JSON.parse(JSON.stringify(state));
    expect(advanceGameTicks(resumed, 90)).toEqual(advanceGameTicks(state, 90));
  });
});

describe("command replay protection", () => {
  it("checks duplicate IDs before stale ticks", () => {
    const first = issue(fresh(), "START_RUN", {});
    const advanced = advanceGameOneTick(first.result.state).state;
    const replay = applyGameCommand(advanced, first.command);
    expect(replay.state).toBe(advanced);
    expect(replay.effects[0]).toMatchObject({ reasonId: "duplicate_command" });
  });

  it("rejects past and future ticks with no state or factual mutation", () => {
    const state = advanceGameOneTick(
      issue(fresh(), "START_RUN", {}).result.state,
    ).state;
    for (const tick of [0, 2]) {
      const command = {
        id:
          tick < 0
            ? "00000000-0000-4000-8000-00000000aa01"
            : "00000000-0000-4000-8000-00000000aa02",
        tick,
        commandSchemaVersion: COMMAND_SCHEMA_VERSION,
        type: "INVEST_COMPUTE" as const,
        payload: {},
      };
      const result = applyGameCommand(state, command);
      expect(result.state).toBe(state);
      expect(result.effects[0]).toMatchObject({
        reasonId: "command_tick_mismatch",
      });
    }
  });

  it("accepts deeply frozen inputs without mutation", () => {
    const state = deepFreeze(fresh());
    const result = issue(state, "START_RUN", {}).result;
    expect(result.state).not.toBe(state);
    expect(state.clock.status).toBe("not_started");
  });
});
