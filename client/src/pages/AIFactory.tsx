import { useEffect, useRef, useState } from "react";
import VictoryScreen from "@/components/victory/VictoryScreen";
import { useGameEngine } from "@/hooks/useGameEngine";
import { Era, hasAchievedAgi } from "@/lib/gameState";
import "@/components/factory/resourceFlow.css";
import { GamePauseProvider } from "@/contexts/GamePauseContext";

import GameHeader from "@/components/factory/GameHeader";
import MainGameTabs from "@/components/factory/MainGameTabs";
import SparkMessageQueue from "@/components/factory/SparkMessageQueue";
import RunGoal from "@/components/factory/RunGoal";

// Unified Tutorial System
import { UnifiedTutorialSystem } from "@/components/tutorial/UnifiedTutorialSystem";
import { Button } from "@/components/ui/button";

export default function AIFactory() {
  const {
    gameState,
    simulation,
    dispatchIntent,
    dismissWelcome,
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
    isRunning,
    startGame,
    pauseGame,
    resetGame,
    // Spark AI Advisor
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

  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const completionPresentedRef = useRef(false);

  // Practice completion follows actual training, not a tab or tutorial click.
  useEffect(() => {
    if (
      sessionReady &&
      sessionSnapshot?.writable &&
      simulation.clock.status !== "completed" &&
      gameState.currentEra !== Era.GNT2 &&
      gameState.tutorial.isActive &&
      !gameState.tutorial.isCompleted
    )
      completeTutorial();
  }, [
    sessionReady,
    sessionSnapshot?.writable,
    simulation.clock.status,
    gameState.currentEra,
    gameState.tutorial.isActive,
    gameState.tutorial.isCompleted,
    completeTutorial,
  ]);

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

  const handleCloseSummaryModal = () => {
    markDebriefViewed();
    setShowSummaryModal(false);
  };

  const handleResetAndCloseSummary = () => {
    resetGame();
    setShowSummaryModal(false);
  };

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

            <RunGoal
              simulation={simulation}
              practice={
                gameState.tutorial.isActive && !gameState.tutorial.isCompleted
              }
              onCommand={dispatchIntent}
              onNavigate={setActiveTab}
              onSkipPractice={skipTutorial}
            />

            {!showSummaryModal && sessionSnapshot && (
              <SparkMessageQueue
                experience={sessionSnapshot.experience}
                simulation={simulation}
                writable={sessionSnapshot.writable}
                onDismiss={dismissMessage}
              />
            )}

            {/* Main Game Navigation Tabs - Moved directly under the header */}
            <MainGameTabs
              gameState={gameState}
              simulation={simulation}
              onCommand={dispatchIntent}
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
          {hasAchievedAgi(gameState) && (
            <Button
              id="review-run-summary"
              onClick={() => setShowSummaryModal(true)}
              className="mt-4 min-h-11 bg-teal-800 text-white hover:bg-teal-700"
            >
              Review run summary
            </Button>
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
              onDismissWelcome={dismissWelcome}
              onSkipTutorial={skipTutorial}
            />
          )}
        </div>
      </div>
    </GamePauseProvider>
  );
}
