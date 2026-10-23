import type { EngineEffect } from "@shared/game/schemas/effects";
import type { GameStateV2 } from "@shared/game/schemas/state";

export function commandReasonLabel(
  reason: string | null | undefined,
): string | null {
  if (!reason) return null;
  if (reason === "research_rate_currently_capped")
    return "Research is at its current rate cap; another engineer has no immediate effect.";
  if (reason === "research_team_bonus_cap")
    return "The research team bonus is already at its limit.";
  return reason.replaceAll("_", " ");
}

/** Stable, bounded durable IDs; all presentation uses the same prioritized queue. */
export function messageForEffect(
  effect: EngineEffect,
  state: GameStateV2,
): { messageId: string; priority: number } | null {
  switch (effect.type) {
    case "COMMAND_REJECTED":
      return {
        messageId: `rejected:${effect.reasonId}:${effect.commandId}`.slice(
          0,
          128,
        ),
        priority: 100,
      };
    case "TRAINING_AVAILABLE":
      return { messageId: `training-ready:${effect.targetEra}`, priority: 65 };
    case "TRAINING_STARTED":
      return {
        messageId: `training-started:${effect.targetEra}`,
        priority: 60,
      };
    case "TRAINING_COMPLETED":
      return {
        messageId: `training-completed:${effect.targetEra}`,
        priority: 85,
      };
    case "BREAKTHROUGH_UNLOCKED":
      return {
        messageId: `breakthrough:${effect.breakthroughId}`,
        priority: 70,
      };
    case "ERA_ADVANCED":
      return null; // TRAINING_COMPLETED carries the era reflection.
    case "EVENT_TRIGGERED":
      return { messageId: `event:${effect.eventId}`, priority: 75 };
    case "SERVICE_UNLOCKED":
      return { messageId: `service:${effect.service}`, priority: 60 };
    case "FUNDING_GRANTED":
      return {
        messageId:
          `funding:${effect.fundingId}:${effect.amount}:${effect.emergency ? 1 : 0}`.slice(
            0,
            128,
          ),
        priority: effect.emergency ? 95 : 75,
      };
    case "CAPACITY_WARNING":
      return effect.severity === "shortfall"
        ? { messageId: `capacity:${state.currentEra}`, priority: 90 }
        : null;
    case "CUSTOMERS_LOST":
      return {
        messageId: `customers:${effect.service}:${state.currentEra}`,
        priority: 80,
      };
    case "RUN_COMPLETED":
      return null;
  }
}
