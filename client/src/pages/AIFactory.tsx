import { useCallback, useEffect, useRef, useState } from "react";
import BreakthroughModal from "@/components/factory/BreakthroughModal";
import VictoryScreen from "@/components/victory/VictoryScreen";
import { useToast } from "@/hooks/use-toast";
import { useGameEngine } from "@/hooks/useGameEngine";
import { Breakthrough, hasAchievedAgi } from "@/lib/gameState";
import "@/components/factory/resourceFlow.css";
import { GamePauseProvider, useGamePause } from "@/contexts/GamePauseContext";

import GameHeader from "@/components/factory/GameHeader";
import MainGameTabs from "@/components/factory/MainGameTabs";
import AdvisorToast from "@/components/factory/AdvisorToast";

// Unified Tutorial System
import { UnifiedTutorialSystem } from "@/components/tutorial/UnifiedTutorialSystem";
import { NarrativeNotification } from "@/components/narrative/NarrativeNotification";
import {
  useNarrativeTriggers,
  NarrativeMessage,
} from "@/hooks/useNarrativeTriggers";
import { Button } from "@/components/ui/button";
import { narrative } from "@/lib/narrativeContent";

export default function AIFactory() {
  const { toast } = useToast();

  const {
    gameState,
    sessionSnapshot,
    isLifecycleTransition,
    sessionReady,
    sessionError,
    personalBests,
    takeoverSession,
    retrySave,
    exportRecovery,
    setActiveTab,
    markDebriefViewed,
    setGameState,
    isRunning,
    startGame,
    pauseGame,
    resetGame,
    // Spark AI Advisor
    advisorMessage,
    setAdvisorMessage,
    queueMessage,
    dismissMessage,
    // Interactive Tutorial System
    advanceTutorial,
    skipTutorial,
    completeTutorial,
    // Train model function
    trainModel,
    // Basic money allocation
    allocateMoneyToCompute,
    allocateMoneyToData,
    allocateMoneyToAlgorithm,
    // Detailed compute inputs
    allocateMoneyToElectricity,
    allocateMoneyToHardware,
    allocateMoneyToRegulations,
    // Detailed data inputs
    allocateMoneyToDataQuality,
    allocateMoneyToDataQuantity,
    allocateMoneyToDataFormats,
    // Detailed algorithm inputs
    allocateMoneyToAlgorithmArchitectures,
    hireResearchEngineer,
    // Revenue service controls
    toggleApiService,
    toggleChatbotService,
    setMonthlyFee,
    // Revenue enhancement functions
    improveDeveloperTools,
    improveChatbot,
    runAdvertisingCampaign,
    // Platform development functions
    buildApiPlatform,
    buildChatbotPlatform,
    formattedTime,
  } = useGameEngine();

  // UI state
  const pendingBreakthrough = sessionSnapshot?.experience.queuedMessages.find(
    (message) => message.messageId.startsWith("breakthrough:"),
  );
  const currentBreakthrough = pendingBreakthrough
    ? gameState.breakthroughs.find(
        (item) => item.id === Number(pendingBreakthrough.messageId.slice(13)),
      )
    : null;
  const showBreakthroughModal = Boolean(
    currentBreakthrough && sessionSnapshot?.writable,
  );
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Unified tutorial and narrative system
  const pendingNarrative = sessionSnapshot?.experience.queuedMessages.find(
    (message) => message.messageId.startsWith("narrative:"),
  );
  const narrativeCopy = pendingNarrative
    ? narrative[pendingNarrative.messageId.slice(10) as keyof typeof narrative]
    : null;
  const currentNarrativeMessage: NarrativeMessage | null =
    pendingNarrative && narrativeCopy
      ? {
          ...narrativeCopy,
          id: pendingNarrative.messageId,
          priority: "normal",
          category: "advice",
          timestamp: pendingNarrative.availableAtTick,
        }
      : null;
  const completionPresentedRef = useRef(false);

  // Narrative trigger system
  useNarrativeTriggers({
    gameState,
    onShowMessage: useCallback(
      (message: NarrativeMessage) => {
        if (message.narrativeKey)
          queueMessage(`narrative:${message.narrativeKey}`, 50);
      },
      [queueMessage],
    ),
    setGameState,
  });

  // Check for victory condition
  useEffect(() => {
    if (!sessionReady || !hasAchievedAgi(gameState)) {
      completionPresentedRef.current = false;
      return;
    }
    if (
      !completionPresentedRef.current &&
      !sessionSnapshot?.experience.debrief.viewed
    ) {
      completionPresentedRef.current = true;
      setShowSummaryModal(true);
    }
  }, [gameState, sessionReady, sessionSnapshot?.experience.debrief.viewed]);

  // Handler for Spark AI Advisor
  const handleAdvisorClose = () => {
    setAdvisorMessage();
  };

  const handleCloseBreakthroughModal = () => {
    if (pendingBreakthrough) dismissMessage(pendingBreakthrough.messageId);
  };

  const handleCloseSummaryModal = () => {
    markDebriefViewed();
    setShowSummaryModal(false);
  };

  const handleResetAndCloseSummary = () => {
    resetGame();
    setShowSummaryModal(false);
  };

  const tutorialOverlayActive =
    gameState.tutorial.isActive && !gameState.tutorial.isCompleted;
  const suppressSecondaryMessages =
    tutorialOverlayActive || showBreakthroughModal || showSummaryModal;

  const downloadRecovery = async () => {
    const data = await exportRecovery();
    if (!data) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-factory-recovery.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!sessionReady)
    return (
      <main className="min-h-screen bg-gray-950 p-8 text-white">
        <p role="status">
          {sessionError ?? "Opening your anonymous saved run…"}
        </p>
        {sessionError && (
          <Button onClick={() => window.location.reload()}>
            Retry opening run
          </Button>
        )}
      </main>
    );

  return (
    <GamePauseProvider
      pauseGame={pauseGame}
      startGame={startGame}
      isRunning={isRunning}
    >
      <div className="bg-gradient-to-b from-gray-950 to-gray-900 text-white min-h-screen font-sans">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div
            className="mb-4 rounded border border-gray-700 bg-gray-900 p-3 text-sm"
            data-testid="session-status"
          >
            <p role="status">
              Anonymous run ·{" "}
              {sessionSnapshot?.status === "readonly"
                ? "Read-only: another tab owns this run."
                : sessionSnapshot?.status === "saving"
                  ? "Saving on this device…"
                  : sessionSnapshot?.status === "recovered"
                    ? "Recovered a verified backup. Review the run before continuing."
                    : sessionSnapshot?.status === "error"
                      ? "Save unavailable. Your current progress may not survive closing this tab."
                      : "Saved on this device"}
            </p>
            {sessionError && (
              <p className="mt-2 text-amber-200">{sessionError}</p>
            )}
            {sessionSnapshot?.status === "readonly" && (
              <Button
                disabled={isLifecycleTransition}
                onClick={() => {
                  void takeoverSession();
                }}
                className="mt-2"
              >
                Take over this run
              </Button>
            )}
            {sessionSnapshot?.status === "error" && (
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={() => {
                    void retrySave();
                  }}
                >
                  Retry save
                </Button>
                <Button
                  onClick={() => {
                    void downloadRecovery();
                  }}
                >
                  Export recovery
                </Button>
              </div>
            )}
            {(sessionSnapshot?.recovery === "corrupt" ||
              sessionSnapshot?.recovery === "unsupported") && (
              <Button
                className="mt-2"
                onClick={() => {
                  if (
                    window.confirm(
                      "Preserve the damaged save as a recovery record and start a separate new run? Export recovery data first if you need a copy.",
                    )
                  )
                    resetGame();
                }}
              >
                Start a separate run
              </Button>
            )}
          </div>
          <fieldset
            data-testid="game-controls"
            disabled={!sessionSnapshot?.writable || isLifecycleTransition}
            className="min-w-0"
          >
            {/* Game Header with Controls and Key Metrics */}
            <GameHeader
              gameState={gameState}
              isRunning={isRunning}
              formattedTime={formattedTime}
              startGame={startGame}
              pauseGame={pauseGame}
              resetGame={resetGame}
            />

            {/* Main Game Navigation Tabs - Moved directly under the header */}
            <MainGameTabs
              gameState={gameState}
              activeTab={sessionSnapshot?.experience.lastActiveTab}
              onActiveTabChange={setActiveTab}
              advanceTutorial={advanceTutorial}
              allocateMoneyToCompute={allocateMoneyToCompute}
              allocateMoneyToData={allocateMoneyToData}
              allocateMoneyToAlgorithm={allocateMoneyToAlgorithm}
              allocateMoneyToElectricity={allocateMoneyToElectricity}
              allocateMoneyToHardware={allocateMoneyToHardware}
              allocateMoneyToRegulations={allocateMoneyToRegulations}
              allocateMoneyToDataQuality={allocateMoneyToDataQuality}
              allocateMoneyToDataQuantity={allocateMoneyToDataQuantity}
              allocateMoneyToDataFormats={allocateMoneyToDataFormats}
              allocateMoneyToAlgorithmArchitectures={
                allocateMoneyToAlgorithmArchitectures
              }
              hireResearchEngineer={hireResearchEngineer}
              toggleApiService={toggleApiService}
              toggleChatbotService={toggleChatbotService}
              trainModel={trainModel}
              setMonthlyFee={setMonthlyFee}
              improveDeveloperTools={improveDeveloperTools}
              improveChatbot={improveChatbot}
              runAdvertisingCampaign={runAdvertisingCampaign}
              buildApiPlatform={buildApiPlatform}
              buildChatbotPlatform={buildChatbotPlatform}
            />
          </fieldset>
          {/* Breakthrough Modal */}
          {showBreakthroughModal && currentBreakthrough && (
            <BreakthroughModal
              breakthrough={currentBreakthrough}
              onClose={handleCloseBreakthroughModal}
            />
          )}

          {showSummaryModal && (
            <VictoryScreen
              gameState={gameState}
              simulation={sessionSnapshot!.simulation}
              personalBests={personalBests}
              onClose={handleCloseSummaryModal}
              onReset={handleResetAndCloseSummary}
            />
          )}

          {sessionSnapshot?.writable && !isLifecycleTransition && (
            <UnifiedTutorialSystem
              gameState={gameState}
              onNextStep={advanceTutorial}
              onSkipTutorial={skipTutorial}
              onComplete={() => {
                completeTutorial();
                startGame();
              }}
            />
          )}

          {/* Dynamic Narrative Notifications */}
          {!suppressSecondaryMessages && (
            <NarrativeNotification
              message={currentNarrativeMessage}
              onDismiss={() => {
                if (pendingNarrative)
                  dismissMessage(pendingNarrative.messageId);
              }}
            />
          )}
        </div>
      </div>

      {/* Spark AI Advisor is rendered on top of everything */}
      {!suppressSecondaryMessages && advisorMessage && (
        <AdvisorToast message={advisorMessage} onClose={handleAdvisorClose} />
      )}
    </GamePauseProvider>
  );
}
