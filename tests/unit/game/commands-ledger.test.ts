import { describe, expect, it } from "vitest";
import { getScaledInvestmentCost } from "@shared/game/domain/gameState";
import { Era } from "@shared/game/domain/era";
import { normalizeGameState } from "@shared/game/normalize";
import { advanceGameOneTick } from "@shared/game/engine";
import type { GameCommand } from "@shared/game/schemas/commands";
import { expectCoreInvariants, fresh, issue, withCash } from "./helpers";

describe("canonical investment boundaries", () => {
  it("corrects integer-boundary floating point drift", () => {
    expect(getScaledInvestmentCost(85, 1, Era.GNT2)).toBe(119);
    expect(getScaledInvestmentCost(75, 2, Era.GNT2)).toBe(147);
    expect(getScaledInvestmentCost(100, 2, Era.GNT2)).toBe(196);
    expect(getScaledInvestmentCost(125, 3, Era.GNT2)).toBe(343);
  });

  it("succeeds at exact funds and rejects one cent below from current state", () => {
    const cost = getScaledInvestmentCost(100, 1, Era.GNT2);
    const exact = issue(withCash(fresh(), cost), "INVEST_COMPUTE", {}).result;
    expect(exact.acceptedCommandId).toBeDefined();
    expect(exact.state.money).toBe(0);
    expect(exact.state.facts.spendByCategory.compute).toBe(cost);
    expect(exact.state.facts.totalSpend).toBe(cost);
    expectCoreInvariants(exact.state);

    const below = withCash(fresh(), cost - 0.01);
    const rejected = issue(below, "INVEST_COMPUTE", {}).result;
    expect(rejected.state).toBe(below);
    expect(rejected.effects[0]).toMatchObject({
      reasonId: "insufficient_funds",
    });
    expect(rejected.state.facts.totalSpend).toBe(0);
  });

  it.each<
    [
      Extract<
        GameCommand["type"],
        | "INVEST_COMPUTE"
        | "INVEST_ELECTRICITY"
        | "INVEST_HARDWARE"
        | "INVEST_REGULATION"
        | "INVEST_DATA_QUALITY"
        | "INVEST_DATA_QUANTITY"
        | "INVEST_DATA_FORMATS"
        | "INVEST_ALGORITHM_ARCHITECTURE"
        | "HIRE_RESEARCH_ENGINEER"
      >,
      keyof ReturnType<typeof fresh>["facts"]["spendByCategory"],
    ]
  >([
    ["INVEST_COMPUTE", "compute"],
    ["INVEST_ELECTRICITY", "compute"],
    ["INVEST_HARDWARE", "compute"],
    ["INVEST_REGULATION", "regulationResilience"],
    ["INVEST_DATA_QUALITY", "data"],
    ["INVEST_DATA_QUANTITY", "data"],
    ["INVEST_DATA_FORMATS", "data"],
    ["INVEST_ALGORITHM_ARCHITECTURE", "algorithm"],
    ["HIRE_RESEARCH_ENGINEER", "algorithm"],
  ])("classifies %s as %s spend", (type, category) => {
    const state = withCash(fresh(), 10_000);
    const result = issue(state, type, {}).result;
    expect(result.acceptedCommandId).toBeDefined();
    expect(result.state.facts.spendByCategory[category]).toBeGreaterThan(0);
    expectCoreInvariants(result.state);
  });
});

describe("commercial isolation and facts", () => {
  it("gates platform building and marketing by actual service availability", () => {
    let state = withCash(fresh(), 100_000);
    expect(
      issue(state, "BUILD_API_PLATFORM", {}).result.effects[0],
    ).toMatchObject({
      reasonId: "api_not_available",
    });
    expect(
      issue(state, "RUN_MARKETING_CAMPAIGN", {}).result.effects[0],
    ).toMatchObject({
      reasonId: "active_chatbot_required",
    });
    state = structuredClone(state);
    state.revenue.apiAvailable = true;
    state = normalizeGameState(state);
    state = issue(state, "BUILD_API_PLATFORM", {}).result.state;
    expect(state.revenue.apiPlatformBuilt).toBe(true);
    expect(state.facts.spendByCategory.commercial).toBe(8_000);
  });

  it("keeps emergency funding a subset of external funding", () => {
    let state = issue(fresh(), "START_RUN", {}).result.state;
    for (let index = 0; index < 60; index += 1) {
      state = advanceGameOneTick(state).state;
    }
    expect(state.facts.externalFunding).toBeGreaterThan(0);
    expect(state.facts.emergencyFunding).toBeGreaterThan(0);
    expect(state.facts.emergencyFunding).toBeLessThanOrEqual(
      state.facts.externalFunding,
    );
    expect(state.facts.emergencyFundingInterventions).toBe(1);
    expect(state.facts.earnedRevenue).toBe(0);
    expectCoreInvariants(state);
  });
});

describe("normalization", () => {
  it("is idempotent and enforces compute conservation", () => {
    const state = fresh();
    const normalized = normalizeGameState(state);
    expect(normalizeGameState(normalized)).toEqual(normalized);
    expect(
      normalized.computeCapacity.available + normalized.computeCapacity.used,
    ).toBeLessThanOrEqual(normalized.computeCapacity.maxCapacity);
  });

  it("rejects out-of-order completed training histories", () => {
    const state = structuredClone(fresh());
    state.training.runs[Era.GNT4].status = "complete" as never;
    expect(() => normalizeGameState(state)).toThrow(/completed out of order/);
  });
});
