import { useEffect, useState, useRef } from "react";
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
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import AdvisorToast from "@/components/factory/AdvisorToast";

export default function AIFactory() {
  const { toast } = useToast();
  const {
    gameState,
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
    formattedTime,
  } = useGameEngine();

  // State for modals and UI
  const [showIntroduction, setShowIntroduction] = useState<boolean>(true);
  const [showBreakthroughModal, setShowBreakthroughModal] = useState<boolean>(false);
  const [currentBreakthrough, setCurrentBreakthrough] = useState<Breakthrough | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  
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

  // Handler functions
  function handleCloseIntroduction() {
    setShowIntroduction(false);
  }

  function handleCloseBreakthroughModal() {
    setShowBreakthroughModal(false);
    // Resume the game after closing the breakthrough modal (if it's not already running)
    if (!isRunning) {
      startGame();
    }
  }

  function handleCloseSummaryModal() {
    setShowSummaryModal(false);
  }

  function handleResetAndCloseSummary() {
    setShowSummaryModal(false);
    resetGame();
  }

  // Tutorial handler functions
  function handleTutorialNext() {
    if (tutorialStep === 1) {
      // User should click on compute accordion to proceed
      return;
    } else if (tutorialStep === 3) {
      // Auto-advance after showing compute production result
      setTimeout(() => setTutorialStep(4), 4000);
    } else if (tutorialStep === 6) {
      // Tutorial complete
      setTutorialStep(0);
      setHighlightedArea(null);
      toast({
        title: "Tutorial Complete!",
        description: "You've mastered the basics. Balance these three resources to raise your AI's Intelligence to 1000!",
      });
    }
  }

  function handleSkipTutorial() {
    setTutorialStep(0);
    setHighlightedArea(null);
  }

  function handleTutorialReset() {
    localStorage.removeItem('hasPlayedAIFactory');
    resetGame();
    setTutorialStep(0);
    setHighlightedArea(null);
  }

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
            allocateMoneyToCompute={tutorialStep > 0 ? tutorialAllocateMoneyToCompute : allocateMoneyToCompute}
            allocateMoneyToData={tutorialStep > 0 ? tutorialAllocateMoneyToData : allocateMoneyToData}
            allocateMoneyToAlgorithm={tutorialStep > 0 ? tutorialAllocateMoneyToAlgorithm : allocateMoneyToAlgorithm}
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
            hireResearchEngineer={hireResearchEngineer}
            trainModel={trainModel}
            tutorialStep={tutorialStep}
            setTutorialStep={setTutorialStep}
            tutorialRefs={{
              computeAccordion: computeAccordionRef,
              computeUpgrade: computeUpgradeRef,
              computeProduction: computeProductionRef,
              dataAccordion: dataAccordionRef,
              dataUpgrade: dataUpgradeRef,
              algorithmAccordion: algorithmAccordionRef,
              algorithmUpgrade: algorithmUpgradeRef,
            }}
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

          {/* Interactive Tutorial System */}
          <TutorialOverlay
            gameState={gameState}
            onNextStep={advanceTutorial}
            onSkipTutorial={skipTutorial}
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

// Tutorial content helper functions
function getTutorialTitle(step: number): string {
  switch (step) {
    case 1: return "Welcome to AI Factory!";
    case 2: return "Invest in Compute";
    case 3: return "Great Progress!";
    case 4: return "Next: Data Investment";
    case 5: return "Finally: Algorithm Investment";
    case 6: return "Tutorial Complete!";
    default: return "";
  }
}

function getTutorialDescription(step: number): string {
  switch (step) {
    case 1: return "Your goal is to build AGI. Let's start by investing in Compute, the raw power for your AI. Click to expand the Compute section.";
    case 2: return "Great! Now, spend your starting funds to increase your Compute Level. This is like buying more powerful servers.";
    case 3: return "Excellent! Your investment increased your Compute production. You're now generating the resources needed to improve your AI.";
    case 4: return "Next, invest in Data. AI learns from examples, so more data makes it smarter. Click to expand the Data section.";
    case 5: return "Finally, upgrade your Algorithms. These are the 'recipes' that tell your AI how to learn efficiently. Click to expand the Algorithm section.";
    case 6: return "You've mastered the basics! Balance these three resources to raise your AI's Intelligence to 1000. Good luck building AGI!";
    default: return "";
  }
}

function getTutorialTextPosition(step: number): "top" | "bottom" | "left" | "right" {
  switch (step) {
    case 1: return "right";
    case 2: return "bottom";
    case 3: return "left";
    case 4: return "right";
    case 5: return "right";
    case 6: return "bottom";
    default: return "bottom";
  }
}
