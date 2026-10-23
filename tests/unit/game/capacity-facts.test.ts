import { expect, it } from "vitest";
import { advanceGameOneTick } from "../../../shared/game/engine";
import { fresh, issue } from "./helpers";

function shortageAtTickFour() {
  let state = issue(fresh(42), "START_RUN", {}).result.state;
  state = structuredClone(state);
  state.clock.activeTick = 4;
  state.daysElapsed = 4;
  state.revenue.chatbotAvailable = true;
  state.revenue.chatbotPlatformBuilt = true;
  state.revenue.chatbotEnabled = true;
  state.revenue.subscribers = 1_000_000;
  return state;
}

it("counts sustained 80 percent shortage on every active tick 5 through 9 exactly once", () => {
  let state = shortageAtTickFour();
  expect(state.computeCapacity.maxCapacity).toBe(2_000);
  for (let tick = 5; tick <= 9; tick++) {
    state = advanceGameOneTick(state).state;
    expect(state.clock.activeTick).toBe(tick);
    expect(state.facts.capacityShortfallRatioSum).toBeCloseTo(
      (tick - 4) * 0.8,
      6,
    );
    expect(state.facts.peakCapacityShortfallRatio).toBe(0.8);
  }
  expect(state.facts.capacityShortfallRatioSum).toBe(4);
  const paused = issue(state, "PAUSE_RUN", {}).result.state;
  expect(advanceGameOneTick(paused).state.facts.capacityShortfallRatioSum).toBe(
    4,
  );
});

it("samples changes between revenue settlements and excludes a disabled service", () => {
  let state = advanceGameOneTick(shortageAtTickFour()).state;
  const campaign = issue(state, "RUN_MARKETING_CAMPAIGN", {});
  expect(campaign.result.acceptedCommandId).toBeDefined();
  state = campaign.result.state;
  const expectedShortfall =
    1 - 2_000 / Math.ceil(state.revenue.subscribers * 0.01);
  state = advanceGameOneTick(state).state;
  expect(state.clock.activeTick).toBe(6);
  expect(state.facts.peakCapacityShortfallRatio).toBeCloseTo(
    expectedShortfall,
    6,
  );
  expect(state.facts.capacityShortfallRatioSum).toBeCloseTo(
    0.8 + expectedShortfall,
    6,
  );
  state = issue(state, "TOGGLE_CHATBOT_SERVICE", {}).result.state;
  const before = state.facts.capacityShortfallRatioSum;
  state = advanceGameOneTick(state).state;
  expect(state.facts.capacityShortfallRatioSum).toBe(before);
});
