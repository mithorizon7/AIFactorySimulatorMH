import { describe, expect, it } from "vitest";
import {
  applyExperienceCommand,
  createFreshExperienceState,
  type ExperienceCommand,
  type ExperienceStateV1,
} from "@shared/experience/schemas";

function issue(
  state: ExperienceStateV1,
  command: Omit<ExperienceCommand, "experienceSchemaVersion">,
) {
  return applyExperienceCommand(state, {
    experienceSchemaVersion: 1,
    ...command,
  });
}

describe("persisted experience transitions", () => {
  it("keeps fresh runs independent and rejects stale tutorial actions", () => {
    const fresh = createFreshExperienceState();
    const unchanged = issue(fresh, {
      type: "ADVANCE_TUTORIAL",
      payload: { expectedPhase: 2, expectedStep: 1 },
    });
    expect(unchanged).toBe(fresh);
    const next = issue(fresh, {
      type: "ADVANCE_TUTORIAL",
      payload: { expectedPhase: 1, expectedStep: 1, targetId: "compute" },
    });
    expect(next.tutorial.step).toBe(2);
    expect(next.tutorial.completedActions).toEqual(["compute"]);
    expect(fresh.tutorial.completedActions).toEqual([]);
    expect(createFreshExperienceState().tutorial.completedActions).toEqual([]);
  });

  it("advances every tutorial phase exactly once and keeps completion idempotent", () => {
    let state = createFreshExperienceState();
    for (let action = 0; action < 14; action++) {
      state = issue(state, {
        type: "ADVANCE_TUTORIAL",
        payload: {
          expectedPhase: state.tutorial.phase,
          expectedStep: state.tutorial.step,
        },
      });
    }
    expect(state.onboardingStatus).toBe("completed");
    expect(state.tutorial.isActive).toBe(false);
    expect(
      issue(state, {
        type: "ADVANCE_TUTORIAL",
        payload: { expectedPhase: 4, expectedStep: 3 },
      }),
    ).toBe(state);
    const completed = issue(createFreshExperienceState(), {
      type: "COMPLETE_TUTORIAL",
      payload: {},
    });
    expect(completed.tutorial.isCompleted).toBe(true);
    expect(createFreshExperienceState(true).onboardingStatus).toBe("completed");
    const skipped = issue(createFreshExperienceState(), {
      type: "SKIP_TUTORIAL",
      payload: {},
    });
    expect(skipped.onboardingStatus).toBe("skipped");
    expect(skipped.tutorial.hasShownWelcome).toBe(true);
  });

  it("orders and deduplicates messages and persists dismissals", () => {
    let state = createFreshExperienceState();
    for (const [messageId, priority, availableAtTick] of [
      ["low", 1, 1],
      ["late", 9, 5],
      ["early", 9, 2],
    ] as const) {
      state = issue(state, {
        type: "QUEUE_MESSAGE",
        payload: { messageId, priority, availableAtTick },
      });
    }
    state = issue(state, {
      type: "QUEUE_MESSAGE",
      payload: { messageId: "early", priority: 9, availableAtTick: 2 },
    });
    expect(state.queuedMessages.map((item) => item.messageId)).toEqual([
      "early",
      "late",
      "low",
    ]);
    state = issue(state, {
      type: "DISMISS_MESSAGE",
      payload: { messageId: "early" },
    });
    state = issue(state, {
      type: "DISMISS_MESSAGE",
      payload: { messageId: "early" },
    });
    state = issue(state, {
      type: "QUEUE_MESSAGE",
      payload: { messageId: "early", priority: 9, availableAtTick: 2 },
    });
    expect(state.seenMessageIds).toEqual(["early"]);
    expect(state.queuedMessages.map((item) => item.messageId)).toEqual([
      "late",
      "low",
    ]);
  });

  it("retains navigation, coaching, acknowledgements and debrief without touching simulation", () => {
    let state = createFreshExperienceState();
    state = issue(state, {
      type: "SET_ACTIVE_TAB",
      payload: { tab: "training" },
    });
    for (let duplicate = 0; duplicate < 2; duplicate++) {
      state = issue(state, {
        type: "ACKNOWLEDGE_EFFECT",
        payload: { effectId: "training-complete" },
      });
      state = issue(state, {
        type: "RECORD_COACHING_MESSAGE",
        payload: { messageId: "hint", tick: 15, isHint: true },
      });
    }
    state = issue(state, {
      type: "RECORD_COACHING_MESSAGE",
      payload: { messageId: "notice", tick: 16, isHint: false },
    });
    state = issue(state, { type: "MARK_DEBRIEF_VIEWED", payload: {} });
    expect(state.lastActiveTab).toBe("training");
    expect(state.acknowledgedEffectIds).toEqual(["training-complete"]);
    expect(state.coaching.seenIds).toEqual(["hint", "notice"]);
    expect(state.coaching.lastHintTick).toBe(15);
    expect(state.debrief.viewed).toBe(true);
    expect(() =>
      applyExperienceCommand(state, {
        experienceSchemaVersion: 1,
        type: "SET_ACTIVE_TAB",
        payload: { tab: "training", extra: true },
      }),
    ).toThrow();
  });
});
