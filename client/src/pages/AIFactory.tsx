import { useEffect, useState } from "react";
import BreakthroughModal from "@/components/factory/BreakthroughModal";
import GameSummaryModal from "@/components/factory/GameSummaryModal";
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

  // Debug: Log tutorial state
  console.log('AIFactory loading...', 'Tutorial active:', gameState.tutorial.isActive);

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
  
  // Detect first-time player and initialize tutorial
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('hasPlayedAIFactory');
    if (!hasPlayedBefore) {
      setShowIntroduction(false); // Hide the old modal - tutorial system will handle onboarding
      localStorage.setItem('hasPlayedAIFactory', 'true');
    } else if (timeElapsed === 0 && !isRunning) {
      setShowIntroduction(true);
    }
  }, [timeElapsed, isRunning]);

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
        timeElapsed: timeElapsed,
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

          {/* DEBUG: Visible Spark Test & Tutorial Controls */}
          <div className="fixed top-4 left-4 z-[200] bg-gray-800 border border-blue-500 rounded-lg p-4 max-w-xs">
            <p className="text-white text-sm mb-2">Debug Panel</p>
            
            {/* Spark Visual Test */}
            <div className="mb-3">
              <p className="text-gray-300 text-xs mb-1">Spark Character:</p>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl border-2 border-white/20 relative">
                <div className="w-12 h-12 bg-gradient-to-tr from-white/40 to-blue-300/20 rounded-full flex items-center justify-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg"></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">Spark</div>
                </div>
              </div>
            </div>
            
            {/* Tutorial Status */}
            <div className="mb-2">
              <p className="text-gray-300 text-xs">Tutorial Status:</p>
              <p className="text-white text-xs">Active: {gameState.tutorial.isActive ? 'Yes' : 'No'}</p>
              <p className="text-white text-xs">Phase: {gameState.tutorial.phase}/{gameState.tutorial.step}</p>
            </div>
            
            {/* Tutorial Controls */}
            <button 
              onClick={() => {
                setGameState(prev => ({
                  ...prev,
                  tutorial: {
                    ...prev.tutorial,
                    isActive: true,
                    phase: 1,
                    step: 1,
                    isCompleted: false
                  }
                }));
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded mr-2"
            >
              Start Tutorial
            </button>
          </div>

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
            <GameSummaryModal 
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