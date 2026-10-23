import { describe, expect, it } from "vitest";
import {
  CUSTOMER_LOSS_MESSAGE,
  commandReasonLabel,
  messageForEffect,
  trainingPrerequisiteNotice,
} from "../../../client/src/lib/experiencePresentation";
import { createFreshGameState } from "../../../shared/game/factory";
import { Era } from "../../../shared/game/domain/era";
import { RULESET_VERSION } from "../../../shared/version";
import { inspectCommand } from "../../../shared/game/engine";
import {
  applyExperienceCommand,
  createFreshExperienceState,
  EXPERIENCE_SCHEMA_VERSION,
} from "../../../shared/experience/schemas";

const simulation = createFreshGameState({ seed: 17, ruleset: RULESET_VERSION });

describe("one durable presentation queue", () => {
  it("keeps prerequisite milestones historical when funding is missing or the notice is stale", () => {
    const missingFunding = createFreshGameState({
      seed: 42,
      ruleset: "release-a.1",
    });
    expect(
      inspectCommand(missingFunding, {
        type: "START_TRAINING",
        payload: { targetEra: Era.GNT3 },
      }).enabled,
    ).toBe(false);
    const effect = {
      id: "ready-without-funds",
      type: "TRAINING_AVAILABLE" as const,
      tick: 37,
      targetEra: Era.GNT3,
    };
    const queued = messageForEffect(effect, missingFunding);
    const copy = trainingPrerequisiteNotice(Era.GNT3);
    expect(copy.title).toContain("prerequisites reached");
    expect(copy.text).toContain(
      "still needs a cash budget and available compute",
    );
    expect(copy.text).toContain("after training has already started");
    expect(copy.text).not.toContain("requirements are met");
    expect(copy.title).not.toContain("training is ready");
    const started = structuredClone(missingFunding);
    started.training.active = true;
    expect(messageForEffect(effect, started)).toEqual(queued);
  });
  it("does not infer the cause of customer loss from a cause-free effect", () => {
    expect(CUSTOMER_LOSS_MESSAGE).toContain("Pricing and capacity");
    expect(CUSTOMER_LOSS_MESSAGE).toContain("does not identify which caused");
    expect(CUSTOMER_LOSS_MESSAGE).not.toContain(
      "leaving during service capacity pressure",
    );
  });
  it("explains research caps without presenting a useless purchase as progress", () => {
    expect(commandReasonLabel("research_rate_currently_capped")).toContain(
      "no immediate effect",
    );
    expect(commandReasonLabel("research_team_bonus_cap")).toContain(
      "already at its limit",
    );
    expect(commandReasonLabel(null)).toBeNull();
  });
  it("gives recovery priority over breakthroughs and de-duplicates repeated effects", () => {
    const recovery = messageForEffect(
      {
        id: "funding:1",
        tick: 10,
        type: "FUNDING_GRANTED",
        fundingId: "continuity",
        amount: 1000,
        emergency: true,
      },
      simulation,
    )!;
    const breakthrough = messageForEffect(
      {
        id: "breakthrough:1",
        tick: 10,
        type: "BREAKTHROUGH_UNLOCKED",
        breakthroughId: 1,
      },
      simulation,
    )!;
    let experience = createFreshExperienceState();
    for (const message of [breakthrough, recovery, recovery])
      experience = applyExperienceCommand(experience, {
        experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
        type: "QUEUE_MESSAGE",
        payload: { ...message, availableAtTick: 10 },
      });
    expect(experience.queuedMessages).toHaveLength(2);
    expect(experience.queuedMessages[0].messageId).toBe(recovery.messageId);
    experience = applyExperienceCommand(experience, {
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "DISMISS_MESSAGE",
      payload: { messageId: recovery.messageId },
    });
    expect(experience.queuedMessages[0].messageId).toBe(breakthrough.messageId);
  });
  it("does not alarm on utilization alone or duplicate era-completion messages", () => {
    expect(
      messageForEffect(
        {
          id: "pressure",
          tick: 10,
          type: "CAPACITY_WARNING",
          severity: "pressure",
          ratio: 0.98,
        },
        simulation,
      ),
    ).toBeNull();
    expect(
      messageForEffect(
        { id: "era", tick: 10, type: "ERA_ADVANCED", era: Era.GNT3 },
        simulation,
      ),
    ).toBeNull();
    expect(
      messageForEffect(
        {
          id: "training",
          tick: 10,
          type: "TRAINING_COMPLETED",
          targetEra: Era.GNT3,
        },
        simulation,
      )?.messageId,
    ).toBe("training-completed:GNT-3");
  });
  it("limits actual shortfall coaching to one durable ID per era", () => {
    const effect = {
      id: "shortfall",
      tick: 10,
      type: "CAPACITY_WARNING" as const,
      severity: "shortfall" as const,
      ratio: 1.1,
    };
    expect(messageForEffect(effect, simulation)).toEqual(
      messageForEffect({ ...effect, tick: 20 }, simulation),
    );
  });
  it("dismisses welcome without pretending that practice has completed", () => {
    const dismissed = applyExperienceCommand(createFreshExperienceState(), {
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "DISMISS_WELCOME",
      payload: {},
    });
    expect(dismissed.tutorial.hasShownWelcome).toBe(true);
    expect(dismissed.tutorial.isCompleted).toBe(false);
    expect(dismissed.onboardingStatus).toBe("active");
  });
});
