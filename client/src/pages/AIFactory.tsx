import { useEffect, useState } from "react";
import BreakthroughModal from "@/components/factory/BreakthroughModal";
import GameSummaryModal from "@/components/factory/GameSummaryModal";
import { useToast } from "@/hooks/use-toast";
import { useGameEngine } from "@/hooks/useGameEngine";
import { Breakthrough } from "@/lib/gameState";
import { apiRequest } from "@/lib/queryClient";
import "@/components/factory/resourceFlow.css";

// New UI Components
import WelcomeIntroduction from "@/components/factory/WelcomeIntroduction";
import GameHeader from "@/components/factory/GameHeader";
import MainGameTabs from "@/components/factory/MainGameTabs";
import ComputePanel from "@/components/factory/ComputePanel";
import HelpPanel from "@/components/factory/HelpPanel";

export default function AIFactory() {
  const { toast } = useToast();
  const {
    gameState,
    isRunning,
    startGame,
    pauseGame,
    resetGame,
    upgradeCompute,
    upgradeData,
    upgradeAlgorithm,
    investInCompute,
    investInData,
    investInAlgorithm,
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
    formattedTime,
  } = useGameEngine();

  // State for modals and UI
  const [showIntroduction, setShowIntroduction] = useState<boolean>(true);
  const [showBreakthroughModal, setShowBreakthroughModal] = useState<boolean>(false);
  const [currentBreakthrough, setCurrentBreakthrough] = useState<Breakthrough | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Show introduction when game first starts or is reset
  useEffect(() => {
    if (timeElapsed === 0 && !isRunning) {
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
      // Pause the game when showing a breakthrough
      pauseGame();
    }
  }, [gameState.breakthroughs]);

  // End game when AGI threshold is reached
  useEffect(() => {
    if (gameState.intelligence >= gameState.agiThreshold && isRunning) {
      pauseGame();
      setShowSummaryModal(true);
    }
  }, [gameState.intelligence, isRunning, gameState.agiThreshold]);

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

  // Handler functions
  function handleCloseIntroduction() {
    setShowIntroduction(false);
  }

  function handleCloseBreakthroughModal() {
    setShowBreakthroughModal(false);
    // Resume the game after closing the breakthrough modal
    startGame();
  }

  function handleCloseSummaryModal() {
    setShowSummaryModal(false);
  }

  function handleResetAndCloseSummary() {
    setShowSummaryModal(false);
    resetGame();
  }

  return (
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

        {/* Compute Capacity Section */}
        <div className="mb-6">
          <ComputePanel 
            gameState={gameState}
            trainModel={trainModel}
          />
        </div>
        
        {/* Main Game Content */}
        <MainGameTabs 
          gameState={gameState}
          upgradeCompute={upgradeCompute}
          upgradeData={upgradeData}
          upgradeAlgorithm={upgradeAlgorithm}
          investInCompute={investInCompute}
          investInData={investInData}
          investInAlgorithm={investInAlgorithm}
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
          toggleApiService={toggleApiService}
          toggleChatbotService={toggleChatbotService}
          setApiRate={setApiRate}
          setMonthlyFee={setMonthlyFee}
          improveDeveloperTools={improveDeveloperTools}
          improveChatbot={improveChatbot}
          runAdvertisingCampaign={runAdvertisingCampaign}
        />

        {/* Help Panel (floating button) */}
        <HelpPanel currentEra={gameState.currentEra} />

        {/* Modals */}
        {showIntroduction && (
          <WelcomeIntroduction 
            onClose={handleCloseIntroduction}
            currentEra={gameState.currentEra}
          />
        )}

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
      </div>
    </div>
  );
}
