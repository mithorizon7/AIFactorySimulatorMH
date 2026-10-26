import { z } from "../../validation";
import { Era } from "../domain/era";

const base = {
  id: z.string().min(1),
  tick: z.number().int().nonnegative(),
};

export const engineEffectSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...base,
      type: z.literal("COMMAND_REJECTED"),
      commandId: z.string().uuid(),
      reasonId: z.string().min(1),
      params: z
        .record(z.string(), z.union([z.number(), z.string(), z.boolean()]))
        .optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("TRAINING_AVAILABLE"),
      targetEra: z.nativeEnum(Era),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("TRAINING_STARTED"),
      targetEra: z.nativeEnum(Era),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("TRAINING_COMPLETED"),
      targetEra: z.nativeEnum(Era),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("BREAKTHROUGH_UNLOCKED"),
      breakthroughId: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("ERA_ADVANCED"),
      era: z.nativeEnum(Era),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("EVENT_TRIGGERED"),
      eventId: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("SERVICE_UNLOCKED"),
      service: z.enum(["api", "chatbot"]),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("FUNDING_GRANTED"),
      fundingId: z.string().min(1),
      amount: z.number().finite().positive(),
      emergency: z.boolean(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("CAPACITY_WARNING"),
      severity: z.enum(["pressure", "shortfall"]),
      ratio: z.number().finite().nonnegative(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("CUSTOMERS_LOST"),
      service: z.enum(["api", "chatbot"]),
      count: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("RUN_COMPLETED"),
      activeTicks: z.number().int().nonnegative(),
    })
    .strict(),
]);

export type EngineEffect = z.infer<typeof engineEffectSchema>;

export function parseEngineEffect(input: unknown): EngineEffect {
  return engineEffectSchema.parse(input);
}
