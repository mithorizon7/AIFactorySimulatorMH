import { useEffect, useState } from "react";
import BreakthroughModal from "@/components/factory/BreakthroughModal";
import VictoryScreen from "@/components/victory/VictoryScreen";
import { useToast } from "@/hooks/use-toast";
import { useGameEngine } from "@/hooks/useGameEngine";
import { Breakthrough } from "@/lib/gameState";
import { apiRequest } from "@/lib/queryClient";
import "@/components/factory/resourceFlow.css";
import { GamePauseProvider } from "@/contexts/GamePauseContext";

// New UI Components
import WelcomeIntroduction from "@/components/factory/WelcomeIntroduction";
import GameHeader from "@/components/factory/GameHeader";
import MainGameTabs from "@/components/factory/MainGameTabs";
import ComputePanel from "@/components/factory/ComputePanel";
import HelpPanel from "@/components/factory/HelpPanel";
import AdvisorToast from "@/components/factory/AdvisorToast";

// Unified Tutorial System
import { UnifiedTutorialSystem } from "@/components/tutorial/UnifiedTutorialSystem";
import { NarrativeNotification } from "@/components/narrative/NarrativeNotification";
import { useNarrativeTriggers, NarrativeMessage } from "@/hooks/useNarrativeTriggers";
import { SparkCharacter } from "@/components/character/SparkCharacter";

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
    setApiRate,
    setMonthlyFee,
    // Revenue enhancement functions
    improveDeveloperTools,
    improveChatbot,
    runAdvertisingCampaign,
    timeElapsed,
    formattedTime
  } = useGameEngine();

  // UI state
  const [showIntroduction, setShowIntroduction] = useState<boolean>(false);
  const [showBreakthroughModal, setShowBreakthroughModal] = useState<boolean>(false);
  const [currentBreakthrough, setCurrentBreakthrough] = useState<Breakthrough | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  
  // Unified tutorial and narrative system
  const [currentNarrativeMessage, setCurrentNarrativeMessage] = useState<NarrativeMessage | null>(null);
  
  // Narrative trigger system
  useNarrativeTriggers({
    gameState,
    onShowMessage: setCurrentNarrativeMessage
  });
  
  // Handle WelcomeIntroduction visibility for proper tutorial sequence
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('hasPlayedAIFactory');
    
    if (!hasPlayedBefore) {
      // For new players, show introduction after Phase 1 tutorial modals complete
      // Phase 1 has 2 steps, so show introduction when we reach Phase 2 or complete Phase 1
      if (gameState.tutorial.phase > 1 || 
          (gameState.tutorial.phase === 1 && gameState.tutorial.step === 2 && gameState.tutorial.isActive)) {
        setShowIntroduction(true);
      }
    } else if (timeElapsed === 0 && !isRunning) {
      // For returning players starting a new game
      setShowIntroduction(true);
    }
  }, [gameState.tutorial.phase, gameState.tutorial.step, gameState.tutorial.isActive, timeElapsed, isRunning]);

  // Save game state periodically
  useEffect(() => {
    if (!isRunning) return;
    
    const saveInterval = setInterval(() => {
      saveGameState();
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(saveInterval);
  }, [isRunning, gameState]);

  // Watch for breakthroughs
  useEffect(() => {
    const newBreakthrough = gameState.breakthroughs.find(b => 
      b.unlocked && b.id === gameState.currentGoal.id
    );
    
    if (newBreakthrough && isRunning) {
      setCurrentBreakthrough(newBreakthrough);
      setShowBreakthroughModal(true);
    }
  }, [gameState.breakthroughs, gameState.currentGoal.id, isRunning]);

  // Check for victory condition
  useEffect(() => {
    if (gameState.intelligence >= gameState.agiThreshold && isRunning) {
      pauseGame();
      setShowSummaryModal(true);
    }
  }, [gameState.intelligence, isRunning, gameState.agiThreshold, pauseGame]);

  // Handler for Spark AI Advisor
  const handleAdvisorClose = () => {
    setAdvisorMessage(null);
  };

  async function saveGameState() {
    try {
      await apiRequest("POST", "/api/game-state", {
        userId: null,
        intelligence: gameState.intelligence,
        money: gameState.money,
        timeRemaining: timeElapsed,
        resourceCompute: Math.floor(gameState.resources.compute),
        resourceData: Math.floor(gameState.resources.data),
        resourceAlgorithm: Math.floor(gameState.resources.algorithm),
        computeLevel: gameState.levels.compute,
        dataLevel: gameState.levels.data,
        algorithmLevel: gameState.levels.algorithm,
        // Save revenue information
        revenueB2B: gameState.revenue.b2b,
        revenueB2C: gameState.revenue.b2c,
        revenueInvestors: gameState.revenue.investors,
        unlockedBreakthroughs: gameState.breakthroughs
          .filter(b => b.unlocked)
          .map(b => b.id),
      });
    } catch (error) {
      console.error("Failed to save game state:", error);
    }
  }

  const handleCloseIntroduction = () => {
    setShowIntroduction(false);
    
    // Mark as played and continue tutorial for new players
    const hasPlayedBefore = localStorage.getItem('hasPlayedAIFactory');
    if (!hasPlayedBefore) {
      localStorage.setItem('hasPlayedAIFactory', 'true');
      
      // If we're still in Phase 1, advance to Phase 2 to continue tutorial
      if (gameState.tutorial.isActive && gameState.tutorial.phase === 1) {
        advanceTutorial(); // This will advance to Phase 2, Step 1
      }
    }
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
            timeElapsed={timeElapsed}
            formattedTime={formattedTime}
            startGame={startGame}
            pauseGame={pauseGame}
            resetGame={resetGame}
          />
          
          {/* Main Game Navigation Tabs - Moved directly under the header */}
          <MainGameTabs 
            gameState={gameState}
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
            setApiRate={setApiRate}
            setMonthlyFee={setMonthlyFee}
            improveDeveloperTools={improveDeveloperTools}
            improveChatbot={improveChatbot}
            runAdvertisingCampaign={runAdvertisingCampaign}
          />

          {/* Welcome Introduction Modal */}
          {showIntroduction && (
            <WelcomeIntroduction 
              onClose={handleCloseIntroduction} 
              currentEra={gameState.currentEra} 
            />
          )}

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

          {/* Unified Tutorial System */}
          <UnifiedTutorialSystem
            gameState={gameState}
            onNextStep={advanceTutorial}
            onSkipTutorial={skipTutorial}
            onComplete={() => {
              skipTutorial();
              startGame();
            }}
          />
          
          {/* Dynamic Narrative Notifications */}
          <NarrativeNotification
            message={currentNarrativeMessage}
            onDismiss={() => setCurrentNarrativeMessage(null)}
          />
        </div>
      </div>

      {/* Spark AI Advisor is rendered on top of everything */}
      {advisorMessage && (
        <AdvisorToast message={advisorMessage} onClose={handleAdvisorClose} />
      )}
    </GamePauseProvider>
  );
}