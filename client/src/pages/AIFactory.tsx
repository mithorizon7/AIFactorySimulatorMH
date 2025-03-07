import { useEffect, useState } from "react";
import FactorySection from "@/components/factory/FactorySection";
import AIDashboard from "@/components/factory/AIDashboard";
import EconomicSection from "@/components/factory/EconomicSection";
import BreakthroughSection from "@/components/factory/BreakthroughSection";
import BreakthroughModal from "@/components/factory/BreakthroughModal";
import GameSummaryModal from "@/components/factory/GameSummaryModal";
import GameTimer from "@/components/factory/GameTimer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGameEngine } from "@/hooks/useGameEngine";
import { Breakthrough } from "@/lib/gameState";
import { apiRequest } from "@/lib/queryClient";

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
    allocateMoneyToCompute,
    allocateMoneyToData,
    allocateMoneyToAlgorithm,
    timeLeft,
    formattedTime,
  } = useGameEngine();

  const [showBreakthroughModal, setShowBreakthroughModal] = useState<boolean>(false);
  const [currentBreakthrough, setCurrentBreakthrough] = useState<Breakthrough | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

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
  }, [gameState.breakthroughs]);

  // End game when time is up
  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      pauseGame();
      setShowSummaryModal(true);
    }
  }, [timeLeft, isRunning]);

  async function saveGameState() {
    try {
      await apiRequest("POST", "/api/game-state", {
        userId: null,
        intelligence: gameState.intelligence,
        money: gameState.money,
        timeRemaining: timeLeft,
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

  function handleCloseBreakthroughModal() {
    setShowBreakthroughModal(false);
  }

  function handleCloseSummaryModal() {
    setShowSummaryModal(false);
  }

  function handleResetAndCloseSummary() {
    setShowSummaryModal(false);
    resetGame();
  }

  return (
    <div className="bg-background text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Game Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-center">AI Factory</h1>
          <p className="text-center text-gray-300 mt-2">
            Build and evolve your AI by balancing key resources
          </p>
        </header>

        {/* Game Timer and Controls */}
        <div className="flex justify-between items-center mb-6">
          <GameTimer timeLeft={timeLeft} formattedTime={formattedTime} />
          
          <div>
            {!isRunning ? (
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-md"
                onClick={startGame}
              >
                {timeLeft < 1200 ? "Resume" : "Start Game"}
              </Button>
            ) : (
              <Button 
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md"
                onClick={pauseGame}
              >
                Pause
              </Button>
            )}
            <Button 
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium shadow-md ml-2"
              onClick={resetGame}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Main Game Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FactorySection 
            gameState={gameState}
            upgradeCompute={upgradeCompute}
            upgradeData={upgradeData}
            upgradeAlgorithm={upgradeAlgorithm}
          />
          
          <AIDashboard 
            gameState={gameState}
            investInCompute={investInCompute}
            investInData={investInData}
            investInAlgorithm={investInAlgorithm}
          />
          
          <div className="flex flex-col gap-6">
            <EconomicSection 
              gameState={gameState}
              allocateMoneyToCompute={allocateMoneyToCompute}
              allocateMoneyToData={allocateMoneyToData}
              allocateMoneyToAlgorithm={allocateMoneyToAlgorithm}
            />
            
            <BreakthroughSection gameState={gameState} />
          </div>
        </div>

        {/* Modals */}
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
