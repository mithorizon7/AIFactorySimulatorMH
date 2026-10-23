import { useEffect, useRef } from "react";
import {
  type GameStateType,
  getTrainingBlockers,
  getUpcomingTrainingRun,
} from "@/lib/gameState";
import { narrative } from "@/lib/narrativeContent";
import type { ExperienceStateV1 } from "@shared/experience/schemas";

export interface NarrativeMessage {
  id: string;
  title: string;
  content: string;
  context: string;
  timestamp: number;
  priority: "low" | "normal" | "high" | "critical";
  category: "tutorial" | "warning" | "achievement" | "advice" | "breakthrough";
  speaker?: "spark" | "system";
}

interface UseNarrativeTriggersProps {
  gameState: GameStateType;
  onShowMessage: (message: NarrativeMessage) => void;
  /** Migration bridge name; records only typed experience/coaching facts. */
  setGameState?: (observation: {
    messageId: string;
    tick: number;
    isHint: boolean;
  }) => void;
}

function hasRealTrainingBlockers(gameState: GameStateType): boolean {
  const upcoming = getUpcomingTrainingRun(gameState);
  return Boolean(
    upcoming &&
    !gameState.training.active &&
    upcoming.status !== "complete" &&
    getTrainingBlockers(gameState).length > 0,
  );
}

function isResourceImbalanced(gameState: GameStateType): boolean {
  const levels = Object.values(gameState.levels);
  return Math.max(...levels) - Math.min(...levels) > 3;
}

export function useNarrativeTriggers({
  gameState,
  onShowMessage,
  setGameState: recordCoachingMessage,
}: UseNarrativeTriggersProps) {
  const previousStateRef = useRef<GameStateType | null>(null);
  const seenIdsRef = useRef(new Set<string>());
  const lastHintTickRef = useRef<number | null>(null);

  useEffect(() => {
    const persistedExperience = (
      gameState as GameStateType & { experienceState?: ExperienceStateV1 }
    ).experienceState;
    if (persistedExperience) {
      seenIdsRef.current = new Set(persistedExperience.coaching.seenIds);
      lastHintTickRef.current = persistedExperience.coaching.lastHintTick;
    }
    const previous = previousStateRef.current;
    previousStateRef.current = gameState;
    if (!previous) return;

    const currentCommandCount = (
      gameState as GameStateType & {
        mechanics?: { appliedCommandIds: string[] };
      }
    ).mechanics?.appliedCommandIds.length;
    const previousCommandCount = (
      previous as GameStateType & {
        mechanics?: { appliedCommandIds: string[] };
      }
    ).mechanics?.appliedCommandIds.length;
    if (currentCommandCount === 0 && (previousCommandCount ?? 0) > 0) {
      seenIdsRef.current.clear();
      lastHintTickRef.current = null;
      return;
    }

    const show = (
      id: string,
      narrativeKey: keyof typeof narrative,
      priority: NarrativeMessage["priority"],
      category: NarrativeMessage["category"],
      speaker?: NarrativeMessage["speaker"],
      isHint = false,
    ): boolean => {
      if (seenIdsRef.current.has(id)) return false;
      const copy = narrative[narrativeKey];
      if (!copy) return false;
      seenIdsRef.current.add(id);
      recordCoachingMessage?.({
        messageId: id,
        tick: gameState.timeElapsed,
        isHint,
      });
      onShowMessage({
        id,
        title: copy.title,
        content: copy.content,
        context: copy.context,
        timestamp: gameState.timeElapsed,
        priority,
        category,
        ...(speaker ? { speaker } : {}),
      });
      return true;
    };

    if (
      gameState.money < 1_000 &&
      previous.money >= 1_000 &&
      show("money-warning-low", "MONEY_WARNING_LOW", "high", "warning")
    ) {
      return;
    }
    if (
      gameState.revenue.b2b > 0 &&
      previous.revenue.b2b === 0 &&
      show("revenue-first-api", "REVENUE_FIRST_API", "normal", "achievement")
    ) {
      return;
    }
    if (
      gameState.revenue.b2c > 0 &&
      previous.revenue.b2c === 0 &&
      show(
        "revenue-first-subscription",
        "REVENUE_FIRST_SUBSCRIPTION",
        "normal",
        "achievement",
      )
    ) {
      return;
    }
    if (
      gameState.revenue.apiAvailable &&
      !previous.revenue.apiAvailable &&
      show(
        "api-service-available",
        "API_SERVICE_AVAILABLE",
        "high",
        "achievement",
      )
    ) {
      return;
    }
    if (
      gameState.revenue.chatbotAvailable &&
      !previous.revenue.chatbotAvailable &&
      show(
        "chatbot-service-available",
        "CHATBOT_SERVICE_AVAILABLE",
        "high",
        "achievement",
      )
    ) {
      return;
    }
    if (
      gameState.narrativeFlags.totalInvestmentAmount >= 10_000_000 &&
      show(
        "investment-milestone-10m",
        "INVESTMENT_MILESTONE_10M",
        "normal",
        "achievement",
      )
    ) {
      return;
    }
    if (
      gameState.narrativeFlags.totalInvestmentAmount >= 1_000_000 &&
      show(
        "investment-milestone-1m",
        "INVESTMENT_MILESTONE_1M",
        "normal",
        "achievement",
      )
    ) {
      return;
    }
    if (
      isResourceImbalanced(gameState) &&
      show(
        "advice-balance-resources",
        "ADVICE_BALANCE_RESOURCES",
        "normal",
        "advice",
      )
    ) {
      return;
    }

    const lastHintTick = lastHintTickRef.current;
    if (lastHintTick !== null && gameState.timeElapsed - lastHintTick < 120) {
      return;
    }
    const operationalRevenue = gameState.revenue.b2b + gameState.revenue.b2c;
    let hintShown = false;
    if (gameState.intelligence > 150 && hasRealTrainingBlockers(gameState)) {
      hintShown = show(
        "stuck-training-blocked",
        "STUCK_TRAINING_BLOCKED_HINT",
        "high",
        "advice",
        "spark",
        true,
      );
    } else if (gameState.money < 500 && operationalRevenue === 0) {
      hintShown = show(
        "stuck-no-money",
        "STUCK_NO_MONEY_HINT",
        "high",
        "advice",
        "spark",
        true,
      );
    } else if (gameState.intelligence > 500 && operationalRevenue === 0) {
      hintShown = show(
        "stuck-no-revenue",
        "STUCK_NO_REVENUE_HINT",
        "high",
        "advice",
        "spark",
        true,
      );
    } else if (
      gameState.intelligence > 200 &&
      gameState.breakthroughs.every((item) => !item.unlocked) &&
      gameState.daysElapsed > 5
    ) {
      hintShown = show(
        "stuck-no-breakthroughs",
        "STUCK_NO_BREAKTHROUGHS_HINT",
        "high",
        "advice",
        "spark",
        true,
      );
    }
    if (hintShown) lastHintTickRef.current = gameState.timeElapsed;
  }, [gameState, onShowMessage, recordCoachingMessage]);
}
