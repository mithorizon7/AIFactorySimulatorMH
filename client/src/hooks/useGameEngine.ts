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
import { advanceGameOneTick, applyGameCommand } from "@shared/game/engine";
import { createFreshGameState } from "@shared/game/factory";
import type { GameCommand } from "@shared/game/schemas/commands";
import type { EngineEffect } from "@shared/game/schemas/effects";
import type { EngineResult, GameStateV2 } from "@shared/game/schemas/state";
import { COMMAND_SCHEMA_VERSION, RULESET_VERSION } from "@shared/version";

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
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem("hasPlayedAIFactory") === "true"
  );
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

function commandSuccessCopy(type: CommandType): [string, string] | null {
  const copy: Partial<Record<CommandType, [string, string]>> = {
    INVEST_COMPUTE: [
      "Infrastructure Upgraded",
      "Compute infrastructure and cross-resource efficiency improved.",
    ],
    INVEST_ELECTRICITY: [
      "Power Infrastructure Improved",
      "Electricity efficiency and compute throughput improved.",
    ],
    INVEST_HARDWARE: [
      "Hardware Quality Upgraded",
      "More capable accelerators are now available.",
    ],
    INVEST_REGULATION: [
      "Regulatory Resilience Improved",
      "Compliance capacity and operational resilience improved.",
    ],
    INVEST_DATA_QUALITY: [
      "Data Infrastructure Upgraded",
      "Training-data quality and data synergies improved.",
    ],
    INVEST_DATA_QUANTITY: [
      "Data Collection Expanded",
      "The available training corpus is larger.",
    ],
    INVEST_DATA_FORMATS: [
      "Data Formats Expanded",
      "The system can learn from more modalities.",
    ],
    INVEST_ALGORITHM_ARCHITECTURE: [
      "Algorithm Research Upgraded",
      "Architecture capability and research efficiency improved.",
    ],
    HIRE_RESEARCH_ENGINEER: [
      "Research Engineer Hired",
      "Algorithm research will progress faster.",
    ],
    BUILD_API_PLATFORM: [
      "API Platform Built",
      "The API can now be activated for B2B customers.",
    ],
    BUILD_CHATBOT_PLATFORM: [
      "Chatbot Platform Built",
      "The chatbot can now be activated for subscribers.",
    ],
    UPGRADE_DEVELOPER_TOOLS: [
      "Developer Tools Improved",
      "The API developer experience now supports stronger growth.",
    ],
    UPGRADE_CHATBOT: [
      "Chatbot Improved",
      "Consumer product quality and growth potential improved.",
    ],
    RUN_MARKETING_CAMPAIGN: [
      "Marketing Campaign Launched",
      "The active chatbot service attracted new subscribers.",
    ],
    SET_MONTHLY_FEE: [
      "Subscription Price Updated",
      "The new fee will apply to chatbot revenue.",
    ],
  };
  return copy[type] ?? null;
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
  const [experience, setExperience] = useState<ExperienceStateV1>(
    initialExperience.current,
  );
  const [advisorMessage, setAdvisorMessage] = useState<{
    title: string;
    content: string;
    context: string;
  } | null>(null);
  const simulationRef = useRef(simulation);

  const commitSimulation = useCallback((state: GameStateV2) => {
    simulationRef.current = state;
    setSimulation(state);
  }, []);

  const applyExperience = useCallback((command: ExperienceCommand) => {
    setExperience((current) => applyExperienceCommand(current, command));
  }, []);

  const presentEffects = useCallback(
    (effects: EngineEffect[]) => {
      for (const effect of effects) {
        switch (effect.type) {
          case "COMMAND_REJECTED":
            toast({
              title: "Action unavailable",
              description: effect.reasonId.replaceAll("_", " "),
              variant: "destructive",
            });
            break;
          case "TRAINING_AVAILABLE":
            toast({
              title: "Training Available",
              description: `${effect.targetEra} prerequisites are complete.`,
            });
            break;
          case "TRAINING_STARTED":
            toast({
              title: "Training Started",
              description: `${effect.targetEra} training is now in progress.`,
            });
            break;
          case "TRAINING_COMPLETED":
            toast({
              title: "Training Complete",
              description: `The system has advanced to ${effect.targetEra}.`,
              duration: 6_000,
            });
            break;
          case "ERA_ADVANCED": {
            const key = `ERA_ADVANCE_${effect.era.replace("-", "")}`;
            const message = narrative[key as keyof typeof narrative];
            if (message) setAdvisorMessage(message);
            break;
          }
          case "SERVICE_UNLOCKED":
            setExperience((current) => ({
              ...current,
              platformHighlights: {
                ...current.platformHighlights,
                [effect.service]: true,
              },
            }));
            break;
          case "FUNDING_GRANTED":
            toast({
              title: effect.emergency
                ? "Continuity Funding Granted"
                : "External Funding Received",
              description: `$${effect.amount.toLocaleString()} was added to the run.`,
            });
            break;
          case "BREAKTHROUGH_UNLOCKED": {
            // AIFactory presents the canonical breakthrough modal from state.
            break;
          }
          case "CAPACITY_WARNING":
            if (effect.tick % 10 === 0) {
              toast({
                title:
                  effect.severity === "shortfall"
                    ? "Compute Shortfall"
                    : "Compute Under Pressure",
                description:
                  "Customer demand is approaching or exceeding available capacity.",
                variant: "destructive",
              });
            }
            break;
          case "CUSTOMERS_LOST":
            toast({
              title: "Customers Lost",
              description: `${effect.count.toLocaleString()} ${effect.service} customers left.`,
              variant: "destructive",
            });
            break;
          case "EVENT_TRIGGERED": {
            const event = simulationRef.current.events.find(
              (candidate) => candidate.id === effect.eventId,
            );
            if (event) {
              toast({
                title: `Event: ${event.title}`,
                description: event.description,
              });
            }
            break;
          }
          case "RUN_COMPLETED":
            break;
        }
        applyExperience({
          experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
          type: "ACKNOWLEDGE_EFFECT",
          payload: { effectId: effect.id },
        });
      }
    },
    [applyExperience, toast],
  );

  const commitResult = useCallback(
    (result: EngineResult) => {
      commitSimulation(result.state);
      presentEffects(result.effects);
      return result;
    },
    [commitSimulation, presentEffects],
  );

  const issueCommand = useCallback(
    <T extends CommandType>(type: T, payload: CommandPayload<T>) => {
      const current = simulationRef.current;
      const command = {
        id: nextCommandId(),
        tick: current.clock.activeTick,
        commandSchemaVersion: COMMAND_SCHEMA_VERSION,
        type,
        payload,
      } as Extract<GameCommand, { type: T }>;
      const result = commitResult(applyGameCommand(current, command));
      if (result.acceptedCommandId) {
        const copy = commandSuccessCopy(type);
        if (copy) toast({ title: copy[0], description: copy[1] });
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
    [commitResult, toast],
  );

  useEffect(() => {
    if (simulation.clock.status !== "running") return;
    const interval = window.setInterval(() => {
      commitResult(advanceGameOneTick(simulationRef.current));
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [commitResult, simulation.clock.status]);

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

  // Temporary in-memory session adapter. The engine itself exposes no reset;
  // Release A persistence owns abandonment, run IDs, and durable replacement.
  const resetGame = useCallback(() => {
    const freshSimulation = createFreshGameState({
      ruleset: RULESET_VERSION,
      seed: createRunSeed(),
    });
    const freshExperience = createFreshExperienceState(
      onboardingAlreadyCompleted(),
    );
    commitSimulation(freshSimulation);
    setExperience(freshExperience);
    setAdvisorMessage(null);
    toast({
      title: "Game Reset",
      description: "A new run has been initialized with a fresh state graph.",
    });
  }, [commitSimulation, toast]);

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
    window.localStorage.setItem("hasPlayedAIFactory", "true");
    applyExperience({
      experienceSchemaVersion: EXPERIENCE_SCHEMA_VERSION,
      type: "SKIP_TUTORIAL",
      payload: {},
    });
  }, [applyExperience]);

  const completeTutorial = useCallback(() => {
    window.localStorage.setItem("hasPlayedAIFactory", "true");
    setAdvisorMessage(null);
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
    gameState,
    // Temporary prop-name bridge: this is a typed experience recorder, never
    // an arbitrary React simulation-state setter.
    setGameState: recordNarrativeObservation,
    isRunning,
    startGame,
    pauseGame,
    resetGame,
    advisorMessage,
    setAdvisorMessage,
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
