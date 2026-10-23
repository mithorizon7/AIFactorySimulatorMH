import { useEffect, useRef, useState } from "react";
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
import { useNarrativeTriggers, NarrativeMessage } from "@/hooks/useNarrativeTriggers";

export default function AIFactory() {
  const { toast } = useToast();
  
  const {
    gameState,
    setGameState,
    isRunning,
    startGame,
    pauseGame,
    resetGame,
    // Spark AI Advisor
    advisorMessage,
    setAdvisorMessage,
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
    formattedTime
  } = useGameEngine();

  // UI state
  const [showBreakthroughModal, setShowBreakthroughModal] = useState<boolean>(false);
  const [currentBreakthrough, setCurrentBreakthrough] = useState<Breakthrough | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  
  // Unified tutorial and narrative system
  const [currentNarrativeMessage, setCurrentNarrativeMessage] = useState<NarrativeMessage | null>(null);
  const unlockedBreakthroughIdsRef = useRef<number[]>([]);
  const completionPresentedRef = useRef(false);
  
  // Narrative trigger system
  useNarrativeTriggers({
    gameState,
    onShowMessage: setCurrentNarrativeMessage,
    setGameState
  });
  
  // Watch for breakthroughs
  useEffect(() => {
    const previouslyUnlocked = new Set(unlockedBreakthroughIdsRef.current);
    const newBreakthrough = gameState.breakthroughs.find(
      (breakthrough) => breakthrough.unlocked && !previouslyUnlocked.has(breakthrough.id)
    );
    unlockedBreakthroughIdsRef.current = gameState.breakthroughs
      .filter((breakthrough) => breakthrough.unlocked)
      .map((breakthrough) => breakthrough.id);
    
    if (newBreakthrough && isRunning) {
      setCurrentBreakthrough(newBreakthrough);
      setShowBreakthroughModal(true);
    }
  }, [gameState.breakthroughs, isRunning]);

  // Check for victory condition
  useEffect(() => {
    if (!hasAchievedAgi(gameState)) {
      completionPresentedRef.current = false;
      return;
    }
    if (!completionPresentedRef.current) {
      completionPresentedRef.current = true;
      setShowSummaryModal(true);
    }
  }, [gameState]);

  // Handler for Spark AI Advisor
  const handleAdvisorClose = () => {
    setAdvisorMessage(null);
  };

  const handleCloseBreakthroughModal = () => {
    setShowBreakthroughModal(false);
    setCurrentBreakthrough(null);
  };

  const handleCloseSummaryModal = () => {
    setShowSummaryModal(false);
  };

  const handleResetAndCloseSummary = () => {
    resetGame();
    setShowSummaryModal(false);
  };

  const tutorialOverlayActive = gameState.tutorial.isActive && !gameState.tutorial.isCompleted;
  const suppressSecondaryMessages = tutorialOverlayActive || showBreakthroughModal || showSummaryModal;

  return (
    <GamePauseProvider 
      pauseGame={pauseGame} 
      startGame={startGame}
      isRunning={isRunning}
    >
      <div className="bg-gradient-to-b from-gray-950 to-gray-900 text-white min-h-screen font-sans">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
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
            allocateMoneyToAlgorithmArchitectures={allocateMoneyToAlgorithmArchitectures}
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
              onClose={handleCloseSummaryModal}
              onReset={handleResetAndCloseSummary}
            />
          )}

          <UnifiedTutorialSystem
            gameState={gameState}
            onNextStep={advanceTutorial}
            onSkipTutorial={skipTutorial}
            onComplete={() => {
              completeTutorial();
              startGame();
            }}
          />
          
          {/* Dynamic Narrative Notifications */}
          {!suppressSecondaryMessages && (
            <NarrativeNotification
              message={currentNarrativeMessage}
              onDismiss={() => setCurrentNarrativeMessage(null)}
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
