import { z } from "zod";

export const EXPERIENCE_SCHEMA_VERSION = 1 as const;

export const gameTabSchema = z.enum([
  "dashboard",
  "training",
  "resources",
  "economy",
  "journey",
  "breakthroughs",
  "progression",
]);

const commandBase = {
  experienceSchemaVersion: z.literal(EXPERIENCE_SCHEMA_VERSION),
};

export const experienceCommandSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...commandBase,
      type: z.literal("DISMISS_WELCOME"),
      payload: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("ADVANCE_TUTORIAL"),
      payload: z
        .object({
          expectedPhase: z.number().int().min(1).max(4),
          expectedStep: z.number().int().positive(),
          targetId: z.string().min(1).max(128).optional(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("SKIP_TUTORIAL"),
      payload: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("COMPLETE_TUTORIAL"),
      payload: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("SET_ACTIVE_TAB"),
      payload: z.object({ tab: gameTabSchema }).strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("QUEUE_MESSAGE"),
      payload: z
        .object({
          messageId: z.string().min(1).max(128),
          priority: z.number().int().min(0).max(100),
          availableAtTick: z.number().int().nonnegative(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("DISMISS_MESSAGE"),
      payload: z.object({ messageId: z.string().min(1).max(128) }).strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("ACKNOWLEDGE_EFFECT"),
      payload: z.object({ effectId: z.string().min(1).max(128) }).strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("RECORD_COACHING_MESSAGE"),
      payload: z
        .object({
          messageId: z.string().min(1).max(128),
          tick: z.number().int().nonnegative(),
          isHint: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      ...commandBase,
      type: z.literal("MARK_DEBRIEF_VIEWED"),
      payload: z.object({}).strict(),
    })
    .strict(),
]);

export const experienceStateSchema = z
  .object({
    experienceSchemaVersion: z.literal(EXPERIENCE_SCHEMA_VERSION),
    tutorial: z
      .object({
        isActive: z.boolean(),
        phase: z.number().int().min(1).max(4),
        step: z.number().int().positive(),
        isCompleted: z.boolean(),
        hasShownWelcome: z.boolean(),
        completedActions: z.array(z.string().min(1).max(128)),
        currentTarget: z.string().min(1).max(128).nullable(),
      })
      .strict(),
    onboardingStatus: z.enum(["active", "skipped", "completed"]),
    lastActiveTab: gameTabSchema,
    queuedMessages: z.array(
      z
        .object({
          messageId: z.string().min(1).max(128),
          priority: z.number().int().min(0).max(100),
          availableAtTick: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    seenMessageIds: z.array(z.string().min(1).max(128)),
    acknowledgedEffectIds: z.array(z.string().min(1).max(128)),
    coaching: z
      .object({
        seenIds: z.array(z.string().min(1).max(128)),
        lastHintId: z.string().min(1).max(128).nullable(),
        lastHintTick: z.number().int().nonnegative().nullable(),
        highlightedTargetId: z.string().min(1).max(128).nullable(),
      })
      .strict(),
    platformHighlights: z
      .object({ api: z.boolean(), chatbot: z.boolean() })
      .strict(),
    debrief: z.object({ available: z.boolean(), viewed: z.boolean() }).strict(),
  })
  .strict();

export type ExperienceCommand = z.infer<typeof experienceCommandSchema>;
export type GameTab = z.infer<typeof gameTabSchema>;
export type ExperienceStateV1 = z.infer<typeof experienceStateSchema>;

export function createFreshExperienceState(
  onboardingComplete = false,
): ExperienceStateV1 {
  return experienceStateSchema.parse({
    experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
    tutorial: onboardingComplete
      ? {
          isActive: false,
          phase: 4,
          step: 3,
          isCompleted: true,
          hasShownWelcome: true,
          completedActions: [],
          currentTarget: null,
        }
      : {
          isActive: true,
          phase: 1,
          step: 1,
          isCompleted: false,
          hasShownWelcome: false,
          completedActions: [],
          currentTarget: null,
        },
    onboardingStatus: onboardingComplete ? "completed" : "active",
    lastActiveTab: "dashboard",
    queuedMessages: [],
    seenMessageIds: [],
    acknowledgedEffectIds: [],
    coaching: {
      seenIds: [],
      lastHintId: null,
      lastHintTick: null,
      highlightedTargetId: null,
    },
    platformHighlights: { api: false, chatbot: false },
    debrief: { available: false, viewed: false },
  });
}

export function applyExperienceCommand(
  input: ExperienceStateV1,
  rawCommand: ExperienceCommand | unknown,
): ExperienceStateV1 {
  experienceStateSchema.parse(input);
  const command = experienceCommandSchema.parse(rawCommand);
  const state = structuredClone(input);

  switch (command.type) {
    case "DISMISS_WELCOME":
      state.tutorial.hasShownWelcome = true;
      break;
    case "ADVANCE_TUTORIAL": {
      if (
        !state.tutorial.isActive ||
        state.tutorial.phase !== command.payload.expectedPhase ||
        state.tutorial.step !== command.payload.expectedStep
      ) {
        return input;
      }
      if (command.payload.targetId) {
        state.tutorial.completedActions.push(command.payload.targetId);
      }
      const phaseLimits = { 1: 2, 2: 6, 3: 3, 4: 3 } as const;
      const limit =
        phaseLimits[state.tutorial.phase as keyof typeof phaseLimits];
      if (state.tutorial.step < limit) {
        state.tutorial.step += 1;
      } else if (state.tutorial.phase < 4) {
        state.tutorial.phase += 1;
        state.tutorial.step = 1;
      } else {
        state.tutorial.isActive = false;
        state.tutorial.isCompleted = true;
        state.onboardingStatus = "completed";
      }
      break;
    }
    case "SKIP_TUTORIAL":
      state.tutorial = {
        isActive: false,
        phase: 4,
        step: 2,
        isCompleted: true,
        hasShownWelcome: true,
        completedActions: state.tutorial.completedActions,
        currentTarget: null,
      };
      state.onboardingStatus = "skipped";
      break;
    case "COMPLETE_TUTORIAL":
      state.tutorial = {
        isActive: false,
        phase: 4,
        step: 3,
        isCompleted: true,
        hasShownWelcome: true,
        completedActions: state.tutorial.completedActions,
        currentTarget: null,
      };
      state.onboardingStatus = "completed";
      break;
    case "SET_ACTIVE_TAB":
      state.lastActiveTab = command.payload.tab;
      break;
    case "QUEUE_MESSAGE":
      if (
        !state.seenMessageIds.includes(command.payload.messageId) &&
        !state.queuedMessages.some(
          (item) => item.messageId === command.payload.messageId,
        )
      ) {
        state.queuedMessages.push(command.payload);
        state.queuedMessages.sort(
          (left, right) =>
            right.priority - left.priority ||
            left.availableAtTick - right.availableAtTick,
        );
      }
      break;
    case "DISMISS_MESSAGE":
      state.queuedMessages = state.queuedMessages.filter(
        (item) => item.messageId !== command.payload.messageId,
      );
      if (!state.seenMessageIds.includes(command.payload.messageId)) {
        state.seenMessageIds.push(command.payload.messageId);
      }
      break;
    case "ACKNOWLEDGE_EFFECT":
      if (!state.acknowledgedEffectIds.includes(command.payload.effectId)) {
        state.acknowledgedEffectIds.push(command.payload.effectId);
      }
      break;
    case "RECORD_COACHING_MESSAGE":
      if (!state.coaching.seenIds.includes(command.payload.messageId)) {
        state.coaching.seenIds.push(command.payload.messageId);
      }
      if (command.payload.isHint) {
        state.coaching.lastHintId = command.payload.messageId;
        state.coaching.lastHintTick = command.payload.tick;
      }
      break;
    case "MARK_DEBRIEF_VIEWED":
      state.debrief.viewed = true;
      break;
  }
  return experienceStateSchema.parse(state);
}
