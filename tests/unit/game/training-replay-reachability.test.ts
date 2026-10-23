import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { Era, ERA_ORDER, getNextEra } from "@shared/game/domain/era";
import { TrainingStatus } from "@shared/game/domain/gameState";
import {
  advanceGameOneTick,
  advanceGameTicks,
  applyGameCommand,
} from "@shared/game/engine";
import { normalizeGameState } from "@shared/game/normalize";
import { COMMAND_SCHEMA_VERSION } from "@shared/version";
import {
  completedTrainingCount,
  expectCoreInvariants,
  fresh,
  issue,
  runBalancedRecoveryStrategy,
  withCash,
} from "./helpers";

function trainingReadyState(currentEra: Era) {
  let state = withCash(fresh(), 25_000_000);
  state = structuredClone(state);
  state.currentEra = currentEra;
  for (const era of ERA_ORDER.slice(1)) {
    if (ERA_ORDER.indexOf(era) <= ERA_ORDER.indexOf(currentEra)) {
      state.training.runs[era].status = TrainingStatus.COMPLETE;
      state.training.runs[era].daysRemaining = 0;
    }
  }
  const target = getNextEra(currentEra);
  if (!target) throw new Error("current era must have a next training run");
  const run = state.training.runs[target as keyof typeof state.training.runs];
  state.levels.compute = run.prerequisites.compute;
  state.levels.data = run.prerequisites.data.quality;
  state.levels.algorithm = run.prerequisites.algorithm.architectures;
  state.dataInputs.quality = run.prerequisites.data.quality;
  state.dataInputs.quantity = run.prerequisites.data.quantity;
  state.dataInputs.formats = run.prerequisites.data.formats;
  state.algorithmInputs.architectures =
    run.prerequisites.algorithm.architectures;
  state.computeInputs.money = run.prerequisites.compute;
  state.computeInputs.electricity = run.prerequisites.computeInputs.electricity;
  state.computeInputs.hardware = run.prerequisites.computeInputs.hardware;
  state.computeInputs.regulation = run.prerequisites.computeInputs.regulation;
  state.training.algorithmResearchProgress = 100;
  state.computeCapacity.breakthroughMultiplier = 4;
  state.computeCapacity.available = Number.MAX_SAFE_INTEGER;
  state = normalizeGameState(state);
  return {
    state,
    target,
    run: state.training.runs[target as keyof typeof state.training.runs],
  };
}

describe.each([Era.GNT2, Era.GNT3, Era.GNT4, Era.GNT5, Era.GNT6])(
  "%s training boundary",
  (currentEra) => {
    it("starts only the immediate target and completes after exactly 30 active ticks", () => {
      const ready = trainingReadyState(currentEra);
      let { state } = ready;
      const { target, run } = ready;
      state = issue(state, "START_RUN", {}).result.state;
      const moneyBefore = state.money;
      const started = issue(state, "START_TRAINING", { targetEra: target });
      expect(started.result.acceptedCommandId).toBeDefined();
      state = started.result.state;
      expect(state.money).toBe(moneyBefore - run.moneyCost);
      expect(state.facts.spendByCategory.training).toBe(run.moneyCost);
      expect(state.training.computeReserved).toBe(run.computeRequired);
      state = advanceGameTicks(state, 29).state;
      expect(state.training.active).toBe(true);
      expect(state.training.daysRemaining).toBe(1);
      const paused = issue(state, "PAUSE_RUN", {}).result.state;
      expect(advanceGameTicks(paused, 10).state).toEqual(paused);
      state = issue(paused, "RESUME_RUN", {}).result.state;
      state = advanceGameOneTick(state).state;
      expect(state.training.active).toBe(false);
      expect(
        state.training.runs[target as keyof typeof state.training.runs].status,
      ).toBe(TrainingStatus.COMPLETE);
      expect(state.currentEra).toBe(target);
      expect(state.training.computeReserved).toBe(0);
      expectCoreInvariants(state);
    });

    it("rejects one-below prerequisites and wrong targets without spending", () => {
      const ready = trainingReadyState(currentEra);
      let { state } = ready;
      const { target } = ready;
      state = issue(state, "START_RUN", {}).result.state;
      const below = structuredClone(state);
      below.training.algorithmResearchProgress = 99.999;
      const normalized = normalizeGameState(below);
      const rejected = issue(normalized, "START_TRAINING", {
        targetEra: target,
      }).result;
      expect(rejected.effects[0]).toMatchObject({
        reasonId: "training_prerequisites_missing",
      });
      expect(rejected.state.facts.totalSpend).toBe(0);

      const wrong = target === Era.GNT7 ? Era.GNT6 : Era.GNT7;
      const wrongCommand = {
        id: "00000000-0000-4000-8000-00000000ff01",
        tick: state.clock.activeTick,
        commandSchemaVersion: COMMAND_SCHEMA_VERSION,
        type: "START_TRAINING" as const,
        payload: { targetEra: wrong },
      };
      const wrongResult = applyGameCommand(state, wrongCommand);
      expect(wrongResult.effects[0]).toMatchObject({
        reasonId: "invalid_training_target",
      });
      expect(wrongResult.state.facts.totalSpend).toBe(0);
    });
  },
);

describe("full deterministic completion", () => {
  it.each([1, 42, 0xffff_fffe])(
    "completes GNT-2 through GNT-7 with public commands for seed %i",
    (seed) => {
      const { state } = runBalancedRecoveryStrategy(seed);
      expect(state.clock.status).toBe("completed");
      expect(state.currentEra).toBe(Era.GNT7);
      expect(completedTrainingCount(state)).toBe(5);
      expect(state.clock.activeTick).toBeLessThanOrEqual(750);
      expect(state.facts.emergencyFundingInterventions).toBeGreaterThanOrEqual(
        1,
      );
      expect(state.mechanics.appliedCommandIds.length).toBeGreaterThan(0);
      expectCoreInvariants(state);
      const completedPrefix = ERA_ORDER.slice(1).filter(
        (era) => state.training.runs[era].status === TrainingStatus.COMPLETE,
      );
      expect(completedPrefix).toEqual(ERA_ORDER.slice(1));
    },
  );

  it("produces byte-equivalent final state for the same seed", () => {
    const first = runBalancedRecoveryStrategy(777).state;
    const second = runBalancedRecoveryStrategy(777).state;
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});

describe("committed replay semantics", () => {
  it("matches the committed GNT-2 through GNT-7 completion digest", () => {
    const fixture = JSON.parse(
      readFileSync(
        new URL(
          "./fixtures/gnt2-gnt7-balanced-recovery-v1.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const state = runBalancedRecoveryStrategy(
      fixture.seed,
      fixture.maxTicks,
    ).state;
    const digest = {
      activeTick: state.clock.activeTick,
      currentEra: state.currentEra,
      status: state.clock.status,
      completedTrainingRuns: completedTrainingCount(state),
      money: state.money,
      intelligence: state.intelligence,
      totalSpend: state.facts.totalSpend,
      spendByCategory: state.facts.spendByCategory,
      earnedRevenue: state.facts.earnedRevenue,
      externalFunding: state.facts.externalFunding,
      emergencyFunding: state.facts.emergencyFunding,
      emergencyFundingInterventions: state.facts.emergencyFundingInterventions,
      rngDraws: state.random.draws,
      rngState: state.random.state,
      breakthroughIds: state.breakthroughs
        .filter((item) => item.unlocked)
        .map((item) => item.id),
      eventIds: state.events
        .filter((item) => item.triggered)
        .map((item) => item.id),
    };
    expect(digest).toEqual(fixture.expected);
  });

  it("replays an operation log and resumes from a prefix snapshot identically", () => {
    const commands = [
      "START_RUN",
      "INVEST_COMPUTE",
      "INVEST_DATA_QUALITY",
      "INVEST_ALGORITHM_ARCHITECTURE",
    ] as const;
    let state = fresh(9);
    const log: Array<ReturnType<typeof issue>["command"] | { type: "TICK" }> =
      [];
    for (const type of commands) {
      const operation = issue(state, type, {});
      state = operation.result.state;
      log.push(operation.command);
      if (type !== "START_RUN") {
        state = advanceGameOneTick(state).state;
        log.push({ type: "TICK" });
      }
    }
    const expected = state;

    const replay = (start = fresh(9), from = 0) => {
      let replayState = start;
      for (const operation of log.slice(from)) {
        replayState =
          operation.type === "TICK"
            ? advanceGameOneTick(replayState).state
            : applyGameCommand(replayState, operation).state;
      }
      return replayState;
    };
    expect(replay()).toEqual(expected);

    let prefix = fresh(9);
    for (const operation of log.slice(0, 3)) {
      prefix =
        operation.type === "TICK"
          ? advanceGameOneTick(prefix).state
          : applyGameCommand(prefix, operation).state;
    }
    const snapshot = JSON.parse(JSON.stringify(prefix));
    expect(replay(snapshot, 3)).toEqual(expected);
  });
});
