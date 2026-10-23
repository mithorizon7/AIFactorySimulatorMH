import { describe, expect, it } from "vitest";
import { Era } from "@shared/game/domain/era";
import { TrainingStatus } from "@shared/game/domain/gameState";
import { advanceGameOneTick, advanceGameTicks } from "@shared/game/engine";
import { normalizeGameState } from "@shared/game/normalize";
import { expectCoreInvariants, fresh, issue, withCash } from "./helpers";

describe("deterministic breakthroughs, events, and funding", () => {
  it("triggers at most one eligible random event per draw window", () => {
    let state = issue(fresh(1), "START_RUN", {}).result.state;
    state = advanceGameTicks(state, 30).state;
    expect(
      state.events.filter((event) => event.triggered).map((event) => event.id),
    ).toEqual([1]);
    expect(state.random.draws).toBe(1);
    state = advanceGameTicks(state, 30).state;
    expect(
      state.events.filter((event) => event.triggered).map((event) => event.id),
    ).toEqual([1, 2]);
    expect(state.random.draws).toBe(2);
    state = advanceGameTicks(state, 30).state;
    expect(state.events.filter((event) => event.triggered)).toHaveLength(2);
    expect(state.random.draws).toBe(3);
  });

  it("applies a breakthrough effect exactly once", () => {
    let state = withCash(fresh(), 100_000);
    state = issue(state, "START_RUN", {}).result.state;
    state = issue(state, "INVEST_COMPUTE", {}).result.state;
    state = issue(state, "INVEST_DATA_QUALITY", {}).result.state;
    state = issue(state, "INVEST_ALGORITHM_ARCHITECTURE", {}).result.state;
    const ids = state.mechanics.appliedBreakthroughEffectIds;
    expect(new Set(ids).size).toBe(ids.length);
    const intelligence = state.intelligence;
    state = advanceGameOneTick(state).state;
    expect(
      state.mechanics.appliedBreakthroughEffectIds.filter((id) => id === 1),
    ).toHaveLength(1);
    expect(state.intelligence).toBeGreaterThan(intelligence);
  });

  it("assigns unique persisted effect IDs across commands at the same tick", () => {
    let state = withCash(fresh(), 100_000);
    state = issue(state, "START_RUN", {}).result.state;
    const effectIds: string[] = [];
    for (const type of [
      "INVEST_COMPUTE",
      "INVEST_DATA_QUALITY",
      "INVEST_ALGORITHM_ARCHITECTURE",
      "INVEST_COMPUTE",
    ] as const) {
      const operation = issue(state, type, {});
      state = operation.result.state;
      effectIds.push(...operation.result.effects.map((effect) => effect.id));
    }
    expect(new Set(effectIds).size).toBe(effectIds.length);
    expect(state.mechanics.nextEffectSequence).toBe(effectIds.length);
  });

  it("applies every breakthrough's commercial and mechanical branch once", () => {
    let state = withCash(fresh(), 1_000_000_000);
    state = structuredClone(state);
    state.currentEra = Era.GNT7;
    for (const run of Object.values(state.training.runs)) {
      run.status = TrainingStatus.COMPLETE;
      run.daysRemaining = 0;
    }
    state.levels = { compute: 10, data: 10, algorithm: 10 };
    state.computeInputs = {
      money: 10,
      electricity: 10,
      hardware: 10,
      regulation: 10,
    };
    state.dataInputs = { quality: 10, quantity: 10, formats: 10 };
    state.algorithmInputs.architectures = 10;
    state.revenue.apiAvailable = true;
    state.revenue.chatbotAvailable = true;
    state.revenue.apiPlatformBuilt = true;
    state.revenue.chatbotPlatformBuilt = true;
    state.revenue.apiEnabled = true;
    state.revenue.chatbotEnabled = true;
    state = normalizeGameState(state);
    state = issue(state, "START_RUN", {}).result.state;
    for (let index = 0; index < state.breakthroughs.length; index += 1) {
      state = issue(state, "INVEST_COMPUTE", {}).result.state;
    }
    expect(state.breakthroughs.every((item) => item.unlocked)).toBe(true);
    expect(state.mechanics.appliedBreakthroughEffectIds).toHaveLength(
      state.breakthroughs.length,
    );
    expect(new Set(state.mechanics.appliedBreakthroughEffectIds).size).toBe(
      state.breakthroughs.length,
    );
    expect(state.revenue.baseApiRate).toBeGreaterThan(1_000);
    expect(state.revenue.monthlyFee).toBeGreaterThan(10);
    expectCoreInvariants(state);
  });

  it("does not unlock an era-specific milestone while idling in GNT-2", () => {
    let state = fresh();
    state = structuredClone(state);
    state.intelligence = 400;
    state = normalizeGameState(state);
    state = issue(state, "START_RUN", {}).result.state;
    state = advanceGameOneTick(state).state;
    expect(
      state.investmentMilestones.find((item) => item.id === 2)?.unlocked,
    ).toBe(false);
    expect(state.facts.externalFunding).toBe(0);
  });

  it("applies each continuity grant at most once", () => {
    let state = issue(fresh(), "START_RUN", {}).result.state;
    state = advanceGameTicks(state, 120).state;
    expect(
      state.mechanics.appliedRecoveryGrantIds.filter(
        (id) => id === "seed_assist_v1",
      ),
    ).toHaveLength(1);
    expect(
      state.mechanics.appliedRecoveryGrantIds.filter(
        (id) => id === "gnt2_continuity_v1",
      ),
    ).toHaveLength(1);
    expect(state.facts.emergencyFundingInterventions).toBe(1);
    expectCoreInvariants(state);
  });
});

describe("service isolation", () => {
  it("never leaks B2B or B2C revenue from a disabled service", () => {
    let state = fresh();
    state = structuredClone(state);
    state.currentEra = Era.GNT4;
    state.training.runs[Era.GNT3].status = TrainingStatus.COMPLETE;
    state.training.runs[Era.GNT3].daysRemaining = 0;
    state.training.runs[Era.GNT4].status = TrainingStatus.COMPLETE;
    state.training.runs[Era.GNT4].daysRemaining = 0;
    state.revenue.apiAvailable = true;
    state.revenue.chatbotAvailable = true;
    state.revenue.apiPlatformBuilt = true;
    state.revenue.chatbotPlatformBuilt = true;
    state.revenue.apiEnabled = true;
    state.revenue.chatbotEnabled = true;
    state.revenue.developers = 100;
    state.revenue.subscribers = 1_000;
    state = normalizeGameState(state);
    state = issue(state, "START_RUN", {}).result.state;
    state = advanceGameTicks(state, 5).state;
    expect(state.revenue.b2b).toBeGreaterThan(0);
    expect(state.revenue.b2c).toBeGreaterThan(0);

    state = issue(state, "TOGGLE_API_SERVICE", {}).result.state;
    state = advanceGameTicks(state, 5).state;
    expect(state.revenue.b2b).toBe(0);
    expect(state.revenue.b2c).toBeGreaterThan(0);

    state = issue(state, "TOGGLE_CHATBOT_SERVICE", {}).result.state;
    state = advanceGameTicks(state, 5).state;
    expect(state.revenue.b2b).toBe(0);
    expect(state.revenue.b2c).toBe(0);
    expect(state.computeCapacity.customerUsage).toBe(0);
    expectCoreInvariants(state);
  });

  it("records fee-driven attrition as a deterministic effect", () => {
    let state = fresh();
    state = structuredClone(state);
    state.revenue.subscribers = 1_000;
    state = normalizeGameState(state);
    const result = issue(state, "SET_MONTHLY_FEE", { fee: 25 }).result;
    expect(result.state.revenue.subscribers).toBe(950);
    expect(result.effects).toContainEqual(
      expect.objectContaining({
        type: "CUSTOMERS_LOST",
        service: "chatbot",
        count: 50,
      }),
    );
  });
});
