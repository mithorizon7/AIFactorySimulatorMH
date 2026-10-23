import { describe, expect, it } from "vitest";
import { buildCompletedRunSummary } from "@shared/game/completed-summary";
import { fresh, runBalancedRecoveryStrategy } from "./helpers";

describe("completed factual scorecard", () => {
  it("maps public-command completion to reconciled facts without invented scores", () => {
    const { state } = runBalancedRecoveryStrategy(42);
    const summary = buildCompletedRunSummary({
      simulation: state,
      runId: "00000000-0000-4000-8000-000000000001",
      revision: 12,
      checksum: "a".repeat(64),
      completedAt: "2026-10-22T12:00:00.000Z",
    });
    expect(summary.activeTime.activeTimeSeconds).toBe(state.clock.activeTick);
    expect(summary.money.totalSpend).toBe(
      Object.values(summary.spendByCategory).reduce(
        (sum, value) => sum + value,
        0,
      ),
    );
    expect(summary.money.endingMoney).toBe(state.money);
    expect(summary.money.earnedRevenue).toBe(state.facts.earnedRevenue);
    expect(summary.progress.trainingRunsCompleted).toBe(5);
    expect(summary).not.toHaveProperty("score");
    expect(summary).not.toHaveProperty("strategyProfile");
  });
  it("refuses an unfinished run", () => {
    expect(() =>
      buildCompletedRunSummary({
        simulation: fresh(),
        runId: "00000000-0000-4000-8000-000000000001",
        revision: 1,
        checksum: "a".repeat(64),
        completedAt: "2026-10-22T12:00:00.000Z",
      }),
    ).toThrow("not completed");
  });
});
