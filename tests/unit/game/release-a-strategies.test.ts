import { describe, expect, it } from "vitest";
import { Era } from "../../../shared/game/domain/era";
import { strategy, type Policy } from "./strategy-policies";

describe("Release A public-command strategy reachability", () => {
  it.each<Policy>([
    "prerequisite-minimal",
    "revenue-first",
    "capacity-first",
    "low-cash-recovery",
    "service-capacity-stress",
  ])(
    "completes %s with its distinct tradeoffs exercised",
    (policy) => {
      const agent = strategy(42, policy);
      const state = agent.finish();
      expect(
        state.clock.status,
        JSON.stringify({
          policy,
          tick: state.clock.activeTick,
          era: state.currentEra,
          money: state.money,
          evidence: agent.evidence(),
        }),
      ).toBe("completed");
      expect(state.currentEra).toBe(Era.GNT7);
      expect(
        Object.values(state.training.runs).filter(
          (run) => run.status === "complete",
        ),
      ).toHaveLength(5);
      if (policy === "prerequisite-minimal") {
        expect(state.facts.spendByCategory.commercial).toBe(0);
        expect(agent.evidence().serviceTicks).toBe(0);
      }
      if (policy === "revenue-first") {
        expect(state.facts.spendByCategory.commercial).toBeGreaterThan(0);
        expect(state.facts.earnedRevenue).toBeGreaterThan(0);
        expect(agent.evidence().serviceTicks).toBeGreaterThan(0);
      }
      if (policy === "capacity-first") {
        expect(
          agent.accepted.slice(1, 4).map((command) => command.type),
        ).toEqual(["INVEST_COMPUTE", "INVEST_COMPUTE", "INVEST_COMPUTE"]);
      }
      if (policy === "low-cash-recovery") {
        expect(agent.evidence().minimumCash).toBeLessThan(100);
        expect(state.facts.emergencyFundingInterventions).toBeGreaterThan(0);
      }
      if (policy === "service-capacity-stress") {
        expect(
          agent.accepted.some(
            (command) => command.type === "RUN_MARKETING_CAMPAIGN",
          ),
        ).toBe(true);
        expect(agent.evidence().pressureExercised).toBe(true);
        expect(state.facts.capacityPressureTicks).toBeGreaterThan(0);
      }
    },
    30_000,
  );
});
