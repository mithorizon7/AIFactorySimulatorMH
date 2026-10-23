import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  createInitialGameState,
  getNextEra,
  type GameStateType,
} from "@/lib/gameState";
import { narrative } from "@/lib/narrativeContent";
import {
  EXPERIENCE_SCHEMA_VERSION,
  applyExperienceCommand,
  createFreshExperienceState,
  type ExperienceCommand,
  type ExperienceStateV1,
} from "@shared/experience/schemas";
import { GameSession, type SessionSnapshot } from "@/lib/persistence/session";
import { createFreshGameState } from "@shared/game/factory";
import type {
  GameCommand,
  GameCommandIntent,
} from "@shared/game/schemas/commands";
import type { EngineEffect } from "@shared/game/schemas/effects";
import type { EngineResult, GameStateV2 } from "@shared/game/schemas/state";
import type { CompletedRunSummaryV1 } from "@shared/game/schemas/completedRuns";
import type { PersonalBestRecordV1 } from "@shared/game/schemas/completedRuns";
import { buildCompletedRunSummary } from "@shared/game/completed-summary";
import { COMMAND_SCHEMA_VERSION, RULESET_VERSION } from "@shared/version";
import { messageForEffect } from "@/lib/experiencePresentation";

const LEGACY_COMPAT_TEMPLATE = createInitialGameState();

type CommandType = GameCommand["type"];
type CommandPayload<T extends CommandType> = Extract<
  GameCommand,
  { type: T }
>["payload"];

let fallbackIdSequence = 0;

function nextCommandId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  fallbackIdSequence += 1;
  return `00000000-0000-4000-8000-${fallbackIdSequence
    .toString(16)
    .padStart(12, "0")}`;
}

function createRunSeed(): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  }
  return 1;
}

function onboardingAlreadyCompleted(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.localStorage.getItem("hasPlayedAIFactory") === "true"
    );
  } catch {
    return false;
  }
}

function projectCompatibilityState(
  simulation: GameStateV2,
  experience: ExperienceStateV1,
): GameStateType {
  const applied = new Set(simulation.mechanics.appliedRecoveryGrantIds);
  const breakthroughEffects = new Set(
    simulation.mechanics.appliedBreakthroughEffectIds,
  );
  return {
    ...simulation,
    isRunning: simulation.clock.status === "running",
    timeElapsed: simulation.clock.activeTick,
    tutorial: experience.tutorial,
    narrativeFlags: {
      ...LEGACY_COMPAT_TEMPLATE.narrativeFlags,
      totalInvestmentAmount: simulation.facts.totalSpend,
      hasGrantedEarlyGrant: applied.has("gnt2_continuity_v1"),
      hasGranted20MinBoost: false,
      hasGrantedLateStageFunding: applied.has("gnt6_completion_v1"),
      lastSeedFundingTime: simulation.mechanics.lastSeedFundingTick ?? -1,
      lastInvestorFundingTime:
        simulation.mechanics.lastInvestorFundingTick ?? -1,
      highlightApiPlatform: experience.platformHighlights.api,
      highlightChatbotPlatform: experience.platformHighlights.chatbot,
      unsupervisedPretrainingBonus: breakthroughEffects.has(2),
      fewShotTrainingBonus: breakthroughEffects.has(4),
      selfImprovementTrainingBonus: breakthroughEffects.has(8),
      verifiedSelfImprovementBonus: breakthroughEffects.has(14),
      pocketAiConstraints: breakthroughEffects.has(21),
    },
    victoryStats: {
      ...LEGACY_COMPAT_TEMPLATE.victoryStats,
      totalTimeElapsed: simulation.clock.activeTick,
      peakMoney: simulation.facts.peakMoney,
      totalMoneyEarned:
        simulation.facts.earnedRevenue + simulation.facts.externalFunding,
      peakB2BSubscribers: simulation.facts.peakB2BCustomers,
      peakB2CSubscribers: simulation.facts.peakB2CCustomers,
      breakthroughsUnlocked: simulation.breakthroughs.filter(
        (item) => item.unlocked,
      ).length,
      erasReached: Math.max(
        1,
        ["GNT-2", "GNT-3", "GNT-4", "GNT-5", "GNT-6", "GNT-7"].indexOf(
          simulation.currentEra,
        ) + 1,
      ),
      finalIntelligence: simulation.intelligence,
      hasAchievedAGI: simulation.clock.status === "completed",
    },
    experienceState: experience,
  } as GameStateType;
}

export function useGameEngine() {
  const { toast } = useToast();
  const initialExperience = useRef<ExperienceStateV1 | null>(null);
  if (!initialExperience.current) {
    initialExperience.current = createFreshExperienceState(
      onboardingAlreadyCompleted(),
    );
  }

  const [simulation, setSimulation] = useState<GameStateV2>(() =>
    createFreshGameState({ ruleset: RULESET_VERSION, seed: createRunSeed() }),
  );
  const [experience, renderExperience] = useState<ExperienceStateV1>(
    initialExperience.current,
  );
  const experienceRef = useRef(experience);
  const sessionRef = useRef<GameSession | null>(null);
  const [sessionSnapshot, setSessionSnapshot] =
    useState<SessionSnapshot | null>(null);
  const [openingError, setOpeningError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const lifecycleTransitionRef = useRef(false);
  const [isLifecycleTransition, setIsLifecycleTransition] = useState(false);
  const [controllerTransitioning, setControllerTransitioning] = useState(false);
  const [personalBests, setPersonalBests] = useState<PersonalBestRecordV1[]>(
    [],
  );
  const completedRunRef = useRef<string | null>(null);
  const simulationRef = useRef(simulation);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let opened: GameSession | undefined;
    void GameSession.open({
      onboardingComplete: onboardingAlreadyCompleted(),
      seed: createRunSeed(),
    })
      .then((session) => {
        opened = session;
        if (disposed) {
          session.close();
          return;
        }
        sessionRef.current = session;
        const sync = () => {
          const snapshot = session.getSnapshot();
          simulationRef.current = snapshot.simulation;
          experienceRef.current = snapshot.experience;
          setSimulation(snapshot.simulation);
          renderExperience(snapshot.experience);
          setSessionSnapshot(snapshot);
          setControllerTransitioning(session.isTransitioning());
        };
        sync();
        unsubscribe = session.subscribe(sync);
      })
      .catch((error: unknown) =>
        setOpeningError(
          error instanceof Error
            ? error.message
            : "Could not open your saved run.",
        ),
      );
    return () => {
      disposed = true;
      unsubscribe?.();
      opened?.close();
      sessionRef.current = null;
    };
  }, []);

  const setExperience = useCallback(
    (
      update:
        ExperienceStateV1 | ((state: ExperienceStateV1) => ExperienceStateV1),
    ) => {
      const session = sessionRef.current;
      if (
        !session ||
        lifecycleTransitionRef.current ||
        session.isTransitioning() ||
        !session.getSnapshot().writable
      )
        return;
      const next =
        typeof update === "function" ? update(experienceRef.current) : update;
      experienceRef.current = next;
      session.setExperience(next);
    },
    [],
  );

  const applyExperience = useCallback(
    (command: ExperienceCommand) => {
      setExperience((current) => applyExperienceCommand(current, command));
    },
    [setExperience],
  );
  const queueMessage = useCallback(
    (messageId: string, priority = 50) =>
      applyExperience({
        experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
        type: "QUEUE_MESSAGE",
        payload: {
          messageId,
          priority,
          availableAtTick: simulationRef.current.clock.activeTick,
        },
      }),
    [applyExperience],
  );
  const dismissMessage = useCallback(
    (messageId: string) =>
      applyExperience({
        experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
        type: "DISMISS_MESSAGE",
        payload: { messageId },
      }),
    [applyExperience],
  );
  const queuedAdvisorId = experience.queuedMessages.find((message) =>
    message.messageId.startsWith("advisor:"),
  )?.messageId;
  const advisorMessage = queuedAdvisorId
    ? (narrative[queuedAdvisorId.slice(8) as keyof typeof narrative] ?? null)
    : null;

  useEffect(() => {
    const session = sessionRef.current;
    if (
      !session ||
      !sessionSnapshot?.writable ||
      simulation.clock.status !== "completed" ||
      completedRunRef.current === sessionSnapshot.runId
    )
      return;
    const runId = sessionSnapshot.runId;
    completedRunRef.current = runId;
    setCompletionError(null);
    const currentExperience = session.getSnapshot().experience;
    if (!currentExperience.debrief.available)
      session.setExperience({
        ...currentExperience,
        debrief: { ...currentExperience.debrief, available: true },
      });
    void (async () => {
      await session.flush();
      const saved = session.getSnapshot();
      if (
        saved.runId !== runId ||
        saved.simulation.clock.status !== "completed"
      )
        return;
      if (!saved.checksum || saved.status === "error")
        throw new Error(
          "This completed run is visible, but could not yet be saved to personal history. Keep this tab open and retry saving.",
        );
      const history = await session.history();
      if (!history.completedRuns.some((run) => run.runId === runId)) {
        await session.complete(
          buildCompletedRunSummary({
            simulation: saved.simulation,
            runId,
            revision: saved.revision,
            checksum: saved.checksum,
            completedAt: new Date().toISOString(),
          }),
        );
      }
      const updated = await session.history();
      setPersonalBests(updated.personalBests);
    })().catch((error: unknown) => {
      completedRunRef.current = null;
      setCompletionError(
        error instanceof Error
          ? error.message
          : "Personal history could not be saved.",
      );
    });
  }, [
    sessionSnapshot?.runId,
    sessionSnapshot?.writable,
    sessionSnapshot?.status,
    simulation.clock.status,
  ]);

  const presentEffects = useCallback(
    (effects: EngineEffect[]) => {
      for (const effect of effects) {
        const message = messageForEffect(effect, simulationRef.current);
        if (message) queueMessage(message.messageId, message.priority);
        if (effect.type === "SERVICE_UNLOCKED") {
          setExperience((current) => ({
            ...current,
            platformHighlights: {
              ...current.platformHighlights,
              [effect.service]: true,
            },
          }));
        }
        applyExperience({
          experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
          type: "ACKNOWLEDGE_EFFECT",
          payload: { effectId: effect.id },
        });
      }
    },
    [applyExperience, queueMessage, setExperience],
  );

  const commitResult = useCallback(
    (result: EngineResult) => {
      presentEffects(result.effects);
      return result;
    },
    [presentEffects],
  );

  const issueCommand = useCallback(
    <T extends CommandType>(type: T, payload: CommandPayload<T>) => {
      const current = simulationRef.current;
      const session = sessionRef.current;
      if (
        !session ||
        lifecycleTransitionRef.current ||
        session.isTransitioning() ||
        !session.getSnapshot().writable
      )
        return;
      const command = {
        id: nextCommandId(),
        tick: current.clock.activeTick,
        commandSchemaVersion: COMMAND_SCHEMA_VERSION,
        type,
        payload,
      } as Extract<GameCommand, { type: T }>;
      const result = commitResult(session.apply(command));
      if (result.acceptedCommandId) {
        if (
          type === "BUILD_API_PLATFORM" ||
          type === "BUILD_CHATBOT_PLATFORM"
        ) {
          const key = type === "BUILD_API_PLATFORM" ? "api" : "chatbot";
          setExperience((currentExperience) => ({
            ...currentExperience,
            platformHighlights: {
              ...currentExperience.platformHighlights,
              [key]: false,
            },
          }));
        }
      }
      return result;
    },
    [commitResult, setExperience, toast],
  );

  useEffect(() => {
    if (!sessionSnapshot?.writable || simulation.clock.status !== "running")
      return;
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const session = sessionRef.current;
      if (
        !lifecycleTransitionRef.current &&
        session &&
        !session.isTransitioning() &&
        session.getSnapshot().writable
      )
        commitResult(session.tick());
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [commitResult, sessionSnapshot?.writable, simulation.clock.status]);

  useEffect(() => {
    const suspend = () => {
      const session = sessionRef.current;
      if (!session?.getSnapshot().writable) return;
      if (simulationRef.current.clock.status === "running")
        issueCommand("PAUSE_RUN", {});
      void session.flush();
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") suspend();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", suspend);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", suspend);
    };
  }, [issueCommand]);

  const startGame = useCallback(() => {
    const status = simulationRef.current.clock.status;
    if (status === "paused") {
      issueCommand("RESUME_RUN", {});
    } else {
      issueCommand("START_RUN", {});
    }
  }, [issueCommand]);

  const pauseGame = useCallback(() => {
    issueCommand("PAUSE_RUN", {});
  }, [issueCommand]);

  const resetGame = useCallback(() => {
    const session = sessionRef.current;
    if (lifecycleTransitionRef.current || session?.isTransitioning()) return;
    if (
      !session ||
      (!session.getSnapshot().writable && !session.getSnapshot().recovery)
    )
      return;
    lifecycleTransitionRef.current = true;
    setIsLifecycleTransition(true);
    void session
      .reset(createRunSeed())
      .then(() => {
        toast({
          title: "New run started",
          description:
            "Your previous run is preserved as an abandoned recovery record.",
        });
      })
      .catch((error: unknown) =>
        toast({
          title: "Could not start a new run",
          description: error instanceof Error ? error.message : "Please retry.",
          variant: "destructive",
        }),
      )
      .finally(() => {
        lifecycleTransitionRef.current = false;
        setIsLifecycleTransition(false);
      });
  }, [toast]);

  const advanceTutorial = useCallback(() => {
    const tutorial = experience.tutorial;
    applyExperience({
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "ADVANCE_TUTORIAL",
      payload: {
        expectedPhase: tutorial.phase,
        expectedStep: tutorial.step,
        ...(tutorial.currentTarget ? { targetId: tutorial.currentTarget } : {}),
      },
    });
  }, [applyExperience, experience.tutorial]);

  const skipTutorial = useCallback(() => {
    try {
      window.localStorage.setItem("hasPlayedAIFactory", "true");
    } catch {
      /* Session snapshot remains authoritative. */
    }
    applyExperience({
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "SKIP_TUTORIAL",
      payload: {},
    });
  }, [applyExperience]);

  const completeTutorial = useCallback(() => {
    try {
      window.localStorage.setItem("hasPlayedAIFactory", "true");
    } catch {
      /* Session snapshot remains authoritative. */
    }
    applyExperience({
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "COMPLETE_TUTORIAL",
      payload: {},
    });
  }, [applyExperience]);

  const recordNarrativeObservation = useCallback(
    ({
      messageId,
      tick,
      isHint,
    }: {
      messageId: string;
      tick: number;
      isHint: boolean;
    }) => {
      applyExperience({
        experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
        type: "RECORD_COACHING_MESSAGE",
        payload: { messageId, tick, isHint },
      });
    },
    [applyExperience],
  );

  const gameState = useMemo(
    () => projectCompatibilityState(simulation, experience),
    [experience, simulation],
  );
  const isRunning = simulation.clock.status === "running";
  const timeElapsed = simulation.clock.activeTick;
  const formattedTime = `${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60)
    .toString()
    .padStart(2, "0")}`;

  const trainModel = useCallback(() => {
    const targetEra = getNextEra(simulationRef.current.currentEra);
    if (!targetEra) {
      toast({
        title: "Final Era Reached",
        description: "All training runs are complete.",
      });
      return;
    }
    issueCommand("START_TRAINING", { targetEra });
  }, [issueCommand, toast]);

  return {
    sessionSnapshot,
    simulation,
    dispatchIntent: (intent: GameCommandIntent) =>
      issueCommand(intent.type, intent.payload),
    dismissWelcome: () =>
      applyExperience({
        experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
        type: "DISMISS_WELCOME",
        payload: {},
      }),
    isLifecycleTransition: isLifecycleTransition || controllerTransitioning,
    sessionError:
      openingError ?? completionError ?? sessionSnapshot?.error ?? null,
    personalBests,
    sessionReady: sessionSnapshot !== null,
    takeoverSession: async () => {
      if (
        lifecycleTransitionRef.current ||
        !sessionRef.current ||
        sessionRef.current.isTransitioning()
      )
        return;
      lifecycleTransitionRef.current = true;
      setIsLifecycleTransition(true);
      try {
        await sessionRef.current.takeover();
      } catch (error: unknown) {
        setOpeningError(
          error instanceof Error
            ? error.message
            : "Could not take over this run.",
        );
      } finally {
        lifecycleTransitionRef.current = false;
        setIsLifecycleTransition(false);
      }
    },
    retrySave: () => sessionRef.current?.flush(),
    exportRecovery: () => sessionRef.current?.exportRecovery(),
    persistCompletion: (summary: CompletedRunSummaryV1) =>
      sessionRef.current?.complete(summary),
    loadPersonalHistory: () => sessionRef.current?.history(),
    setActiveTab: (tab: ExperienceStateV1["lastActiveTab"]) =>
      applyExperience({
        experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
        type: "SET_ACTIVE_TAB",
        payload: { tab },
      }),
    markDebriefViewed: () =>
      applyExperience({
        experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
        type: "MARK_DEBRIEF_VIEWED",
        payload: {},
      }),
    gameState,
    // Temporary prop-name bridge: this is a typed experience recorder, never
    // an arbitrary React simulation-state setter.
    setGameState: recordNarrativeObservation,
    isRunning,
    startGame,
    pauseGame,
    resetGame,
    advisorMessage,
    setAdvisorMessage: () => {
      if (queuedAdvisorId) dismissMessage(queuedAdvisorId);
    },
    queueMessage,
    dismissMessage,
    advanceTutorial,
    skipTutorial,
    completeTutorial,
    trainModel,
    allocateMoneyToCompute: () => issueCommand("INVEST_COMPUTE", {}),
    allocateMoneyToData: () => issueCommand("INVEST_DATA_QUALITY", {}),
    allocateMoneyToAlgorithm: () =>
      issueCommand("INVEST_ALGORITHM_ARCHITECTURE", {}),
    allocateMoneyToElectricity: () => issueCommand("INVEST_ELECTRICITY", {}),
    allocateMoneyToHardware: () => issueCommand("INVEST_HARDWARE", {}),
    allocateMoneyToRegulations: () => issueCommand("INVEST_REGULATION", {}),
    allocateMoneyToDataQuality: () => issueCommand("INVEST_DATA_QUALITY", {}),
    allocateMoneyToDataQuantity: () => issueCommand("INVEST_DATA_QUANTITY", {}),
    allocateMoneyToDataFormats: () => issueCommand("INVEST_DATA_FORMATS", {}),
    allocateMoneyToAlgorithmArchitectures: () =>
      issueCommand("INVEST_ALGORITHM_ARCHITECTURE", {}),
    hireResearchEngineer: () => issueCommand("HIRE_RESEARCH_ENGINEER", {}),
    toggleApiService: () => issueCommand("TOGGLE_API_SERVICE", {}),
    toggleChatbotService: () => issueCommand("TOGGLE_CHATBOT_SERVICE", {}),
    setMonthlyFee: (fee: number) =>
      issueCommand("SET_MONTHLY_FEE", {
        fee: Math.max(5, Math.min(25, fee)),
      }),
    improveDeveloperTools: () => issueCommand("UPGRADE_DEVELOPER_TOOLS", {}),
    improveChatbot: () => issueCommand("UPGRADE_CHATBOT", {}),
    runAdvertisingCampaign: () => issueCommand("RUN_MARKETING_CAMPAIGN", {}),
    buildApiPlatform: () => issueCommand("BUILD_API_PLATFORM", {}),
    buildChatbotPlatform: () => issueCommand("BUILD_CHATBOT_PLATFORM", {}),
    timeElapsed,
    formattedTime,
  };
}
