import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_SCHEMA_VERSION,
  applyExperienceCommand,
  createFreshExperienceState,
  experienceCommandSchema,
  experienceStateSchema,
} from "@shared/experience/schemas";
import { createFreshGameState } from "@shared/game/factory";
import { gameCommandSchema } from "@shared/game/schemas/commands";
import { engineEffectSchema } from "@shared/game/schemas/effects";
import { gameStateSchema } from "@shared/game/schemas/state";
import {
  COMMAND_SCHEMA_VERSION,
  RULESET_VERSION,
  SNAPSHOT_VERSION,
} from "@shared/version";

describe("fresh deterministic state contracts", () => {
  it("creates equal but independently mutable object graphs", () => {
    const first = createFreshGameState({ ruleset: RULESET_VERSION, seed: 42 });
    const second = createFreshGameState({ ruleset: RULESET_VERSION, seed: 42 });
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.training).not.toBe(second.training);
    expect(first.training.runs).not.toBe(second.training.runs);
    expect(first.breakthroughs).not.toBe(second.breakthroughs);
    expect(first.events).not.toBe(second.events);
    first.breakthroughs[0].unlocked = true;
    expect(second.breakthroughs[0].unlocked).toBe(false);
  });

  it("starts with strict versions, clock, rng, and reconciled facts", () => {
    const state = createFreshGameState({ ruleset: RULESET_VERSION, seed: 1 });
    expect(gameStateSchema.parse(state)).toEqual(state);
    expect(state.rulesetVersion).toBe(RULESET_VERSION);
    expect(state.snapshotSchemaVersion).toBe(SNAPSHOT_VERSION);
    expect(state.clock).toEqual({ status: "not_started", activeTick: 0 });
    expect(state.random).toEqual({
      algorithm: "xorshift32-v1",
      seed: 1,
      state: 1,
      draws: 0,
    });
    expect(state.facts).toMatchObject({
      startingMoney: 1_000,
      totalSpend: 0,
      earnedRevenue: 0,
      externalFunding: 0,
      emergencyFunding: 0,
      otherCashAdjustments: 0,
      peakMoney: 1_000,
    });
    expect(Object.values(state.facts.spendByCategory)).toEqual([
      0, 0, 0, 0, 0, 0,
    ]);
    expect(state.mechanics.appliedCommandIds).toEqual([]);
    expect(state).not.toHaveProperty("tutorial");
    expect(state).not.toHaveProperty("narrativeFlags");
    expect(state).not.toHaveProperty("victoryStats");
    expect(state).not.toHaveProperty("runId");
  });

  it("canonicalizes zero seed and rejects unsupported rulesets", () => {
    const zero = createFreshGameState({ ruleset: RULESET_VERSION, seed: 0 });
    expect(zero.random.seed).not.toBe(0);
    expect(() =>
      createFreshGameState({
        ruleset: "future" as typeof RULESET_VERSION,
        seed: 1,
      }),
    ).toThrow(/Unsupported ruleset/);
    expect(() =>
      createFreshGameState({ ruleset: RULESET_VERSION, seed: 1.5 }),
    ).toThrow(/integer/);
  });

  it("rejects persisted absorbing RNG state zero", () => {
    const state = createFreshGameState({ ruleset: RULESET_VERSION, seed: 1 });
    expect(() =>
      gameStateSchema.parse({
        ...state,
        random: { ...state.random, state: 0 },
      }),
    ).toThrow();
  });

  it("uses strict versioned discriminated command schemas", () => {
    const valid = {
      id: "00000000-0000-4000-8000-000000000001",
      tick: 0,
      commandSchemaVersion: COMMAND_SCHEMA_VERSION,
      type: "INVEST_COMPUTE",
      payload: {},
    };
    expect(gameCommandSchema.parse(valid)).toEqual(valid);
    expect(() =>
      gameCommandSchema.parse({ ...valid, payload: { arbitrary: true } }),
    ).toThrow();
    expect(() =>
      gameCommandSchema.parse({ ...valid, commandSchemaVersion: 99 }),
    ).toThrow();
    expect(
      gameCommandSchema.options.map((option) => option.shape.type.value),
    ).not.toContain("RESET_RUN");
    expect(
      gameCommandSchema.options.map((option) => option.shape.type.value),
    ).not.toContain("SET_API_RATE");
  });

  it("validates strict deterministic effect envelopes", () => {
    const effect = {
      id: "0:0:TRAINING_AVAILABLE",
      tick: 0,
      type: "TRAINING_AVAILABLE",
      targetEra: "GNT-3",
    };
    expect(engineEffectSchema.parse(effect)).toEqual(effect);
    expect(() =>
      engineEffectSchema.parse({ ...effect, arbitrary: true }),
    ).toThrow();
  });
});

describe("strict experience contract", () => {
  it("creates and validates a separate experience state", () => {
    const state = createFreshExperienceState();
    expect(experienceStateSchema.parse(state)).toEqual(state);
    expect(state.experienceSchemaVersion).toBe(EXPERIENCE_SCHEMA_VERSION);
    expect(state.tutorial.isActive).toBe(true);
    expect(() =>
      experienceStateSchema.parse({ ...state, unknown: true }),
    ).toThrow();
  });

  it("advances idempotently only from the expected tutorial position", () => {
    const state = createFreshExperienceState();
    const command = experienceCommandSchema.parse({
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "ADVANCE_TUTORIAL",
      payload: { expectedPhase: 1, expectedStep: 1 },
    });
    const advanced = applyExperienceCommand(state, command);
    expect(advanced.tutorial.step).toBe(2);
    expect(applyExperienceCommand(advanced, command)).toBe(advanced);
    expect(state.tutorial.step).toBe(1);
  });

  it("persists coaching deduplication and cooldown ticks", () => {
    const state = createFreshExperienceState();
    const command = experienceCommandSchema.parse({
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "RECORD_COACHING_MESSAGE",
      payload: { messageId: "stuck-no-money", tick: 120, isHint: true },
    });
    const recorded = applyExperienceCommand(state, command);
    expect(recorded.coaching).toMatchObject({
      seenIds: ["stuck-no-money"],
      lastHintId: "stuck-no-money",
      lastHintTick: 120,
    });
    expect(applyExperienceCommand(recorded, command).coaching.seenIds).toEqual([
      "stuck-no-money",
    ]);

    const achievement = experienceCommandSchema.parse({
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "RECORD_COACHING_MESSAGE",
      payload: { messageId: "first-revenue", tick: 150, isHint: false },
    });
    const afterAchievement = applyExperienceCommand(recorded, achievement);
    expect(afterAchievement.coaching.seenIds).toContain("first-revenue");
    expect(afterAchievement.coaching.lastHintId).toBe("stuck-no-money");
    expect(afterAchievement.coaching.lastHintTick).toBe(120);
  });
});
