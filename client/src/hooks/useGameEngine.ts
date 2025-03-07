import { useState, useEffect, useRef } from "react";
import { initialGameState, GameStateType } from "@/lib/gameState";
import { useToast } from "@/hooks/use-toast";

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameStateType>({ ...initialGameState });
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialGameState.timer);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Format time as MM:SS
  const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  // Start the game
  const startGame = () => {
    setIsRunning(true);
  };

  // Pause the game
  const pauseGame = () => {
    setIsRunning(false);
  };

  // Reset the game
  const resetGame = () => {
    setIsRunning(false);
    setTimeLeft(initialGameState.timer);
    setGameState({ ...initialGameState });
    toast({
      title: "Game Reset",
      description: "All progress has been reset. Ready to start again!",
    });
  };

  // Upgrade functions
  const upgradeCompute = () => {
    if (gameState.resources.compute >= gameState.upgradeCosts.compute) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.resources.compute -= prevState.upgradeCosts.compute;
        newState.production.compute *= 1.5;
        newState.upgradeCosts.compute = Math.round(prevState.upgradeCosts.compute * 2);
        return newState;
      });
    } else {
      toast({
        title: "Not enough compute resources",
        description: `You need ${gameState.upgradeCosts.compute} compute resources to upgrade.`,
        variant: "destructive",
      });
    }
  };

  const upgradeData = () => {
    if (gameState.resources.data >= gameState.upgradeCosts.data) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.resources.data -= prevState.upgradeCosts.data;
        newState.production.data *= 1.5;
        newState.upgradeCosts.data = Math.round(prevState.upgradeCosts.data * 2);
        return newState;
      });
    } else {
      toast({
        title: "Not enough data resources",
        description: `You need ${gameState.upgradeCosts.data} data resources to upgrade.`,
        variant: "destructive",
      });
    }
  };

  const upgradeAlgorithm = () => {
    if (gameState.resources.algorithm >= gameState.upgradeCosts.algorithm) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.resources.algorithm -= prevState.upgradeCosts.algorithm;
        newState.production.algorithm *= 1.5;
        newState.upgradeCosts.algorithm = Math.round(prevState.upgradeCosts.algorithm * 2);
        return newState;
      });
    } else {
      toast({
        title: "Not enough algorithm resources",
        description: `You need ${gameState.upgradeCosts.algorithm} algorithm resources to upgrade.`,
        variant: "destructive",
      });
    }
  };

  // Investment functions
  const investInCompute = () => {
    if (gameState.resources.compute >= gameState.investCosts.compute) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.resources.compute -= prevState.investCosts.compute;
        newState.levels.compute += 1;
        newState.intelligence += 50;
        newState.investCosts.compute = Math.round(prevState.investCosts.compute * 1.8);
        
        // Check for breakthroughs
        newState.breakthroughs = checkBreakthroughs(newState);
        
        return newState;
      });
    } else {
      toast({
        title: "Not enough compute resources",
        description: `You need ${gameState.investCosts.compute} compute resources to invest.`,
        variant: "destructive",
      });
    }
  };

  const investInData = () => {
    if (gameState.resources.data >= gameState.investCosts.data) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.resources.data -= prevState.investCosts.data;
        newState.levels.data += 1;
        newState.intelligence += 50;
        newState.investCosts.data = Math.round(prevState.investCosts.data * 1.8);
        
        // Check for breakthroughs
        newState.breakthroughs = checkBreakthroughs(newState);
        
        return newState;
      });
    } else {
      toast({
        title: "Not enough data resources",
        description: `You need ${gameState.investCosts.data} data resources to invest.`,
        variant: "destructive",
      });
    }
  };

  const investInAlgorithm = () => {
    if (gameState.resources.algorithm >= gameState.investCosts.algorithm) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.resources.algorithm -= prevState.investCosts.algorithm;
        newState.levels.algorithm += 1;
        newState.intelligence += 50;
        newState.investCosts.algorithm = Math.round(prevState.investCosts.algorithm * 1.8);
        
        // Check for breakthroughs
        newState.breakthroughs = checkBreakthroughs(newState);
        
        return newState;
      });
    } else {
      toast({
        title: "Not enough algorithm resources",
        description: `You need ${gameState.investCosts.algorithm} algorithm resources to invest.`,
        variant: "destructive",
      });
    }
  };

  // Check for breakthroughs
  const checkBreakthroughs = (state: GameStateType) => {
    const updatedBreakthroughs = [...state.breakthroughs];
    
    updatedBreakthroughs.forEach(breakthrough => {
      if (!breakthrough.unlocked) {
        let allRequirementsMet = true;
        
        for (const [resource, level] of Object.entries(breakthrough.requiredLevels)) {
          const currentLevel = state.levels[resource as keyof typeof state.levels];
          if (currentLevel < level) {
            allRequirementsMet = false;
            break;
          }
        }
        
        if (allRequirementsMet) {
          breakthrough.unlocked = true;
          state.intelligence += 100; // Increase intelligence on breakthrough
          
          // Find next unlocked breakthrough for goal
          const nextBreakthrough = updatedBreakthroughs.find(b => !b.unlocked);
          if (nextBreakthrough) {
            state.currentGoal.id = nextBreakthrough.id;
            state.currentGoal.progress = 0;
          }
        }
      }
    });
    
    return updatedBreakthroughs;
  };

  // Calculate revenue from resources and levels
  const calculateRevenue = (state: GameStateType) => {
    const newState = { ...state };
    
    // B2B Revenue: Scales with compute and algorithm levels
    // Companies paying to use your AI APIs
    newState.revenue.b2b = Math.floor(
      2 * state.levels.compute * state.levels.algorithm * 
      state.bonuses.computeToIntelligence * state.bonuses.algorithmToIntelligence
    );
    
    // B2C Revenue: Scales with data quality and user experience
    // Direct consumers paying for subscriptions
    newState.revenue.b2c = Math.floor(
      3 * state.levels.data * 
      state.bonuses.dataToIntelligence * 
      (state.intelligence / 200) // Revenue scales with intelligence
    );
    
    // Investor Funding: One-time boosts when breakthroughs happen
    // This is handled separately in the breakthrough logic
    
    // Add revenue to money
    newState.money += newState.revenue.b2b + newState.revenue.b2c;
    
    return newState;
  };

  // Money allocation functions
  const allocateMoneyToCompute = () => {
    if (gameState.money >= 100) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= 100;
        newState.computeInputs.money += 1;
        
        // Increase compute production based on money input
        newState.production.compute *= 1.1;
        
        // Improve cross-resource bonuses
        newState.bonuses.computeToData *= 1.05;
        newState.bonuses.computeToAlgorithm *= 1.05;
        newState.bonuses.computeToIntelligence *= 1.05;
        
        return newState;
      });
      
      toast({
        title: "Money Allocated to Compute",
        description: "Your AI now has better computational resources!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $100 to improve compute resources.",
        variant: "destructive",
      });
    }
  };

  const allocateMoneyToData = () => {
    if (gameState.money >= 75) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= 75;
        newState.dataInputs.quality += 1;
        
        // Increase data production based on quality improvements
        newState.production.data *= 1.1;
        
        // Improve cross-resource bonuses
        newState.bonuses.dataToCompute *= 1.05;
        newState.bonuses.dataToAlgorithm *= 1.05;
        newState.bonuses.dataToIntelligence *= 1.05;
        
        return newState;
      });
      
      toast({
        title: "Money Allocated to Data",
        description: "Your AI now has access to higher quality data!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $75 to improve data quality.",
        variant: "destructive",
      });
    }
  };

  const allocateMoneyToAlgorithm = () => {
    if (gameState.money >= 125) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= 125;
        newState.algorithmInputs.architectures += 1;
        
        // Increase algorithm production based on architecture improvements
        newState.production.algorithm *= 1.15;
        
        // Improve cross-resource bonuses
        newState.bonuses.algorithmToCompute *= 1.05;
        newState.bonuses.algorithmToData *= 1.05;
        newState.bonuses.algorithmToIntelligence *= 1.07; // Algorithms have slightly more impact on intelligence
        
        return newState;
      });
      
      toast({
        title: "Money Allocated to Algorithm Research",
        description: "Your AI now uses more advanced algorithmic architectures!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $125 to improve algorithmic architectures.",
        variant: "destructive",
      });
    }
  };

  // Game loop
  useEffect(() => {
    if (isRunning) {
      const handleGameTick = () => {
        setTimeLeft(prevTime => {
          if (prevTime <= 0) {
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });

        setGameState(prevState => {
          // Update resources based on production rates
          const newState = { ...prevState };
          newState.resources.compute += prevState.production.compute;
          newState.resources.data += prevState.production.data;
          newState.resources.algorithm += prevState.production.algorithm;
          
          // Update intelligence based on resource levels and bonuses
          // This creates a multiplicative effect when resources work together
          const computeContribution = prevState.levels.compute * prevState.bonuses.computeToIntelligence;
          const dataContribution = prevState.levels.data * prevState.bonuses.dataToIntelligence;
          const algorithmContribution = prevState.levels.algorithm * prevState.bonuses.algorithmToIntelligence;
          
          // Synergy bonus when all three resources are developed together
          const synergyMultiplier = Math.min(prevState.levels.compute, prevState.levels.data, prevState.levels.algorithm) * 0.05;
          
          // Apply a small intelligence increase each tick
          newState.intelligence += 
            0.02 * (computeContribution + dataContribution + algorithmContribution) * 
            (1 + synergyMultiplier);
          
          // Calculate revenue every 5 seconds (adjust as needed)
          const secondsElapsed = initialGameState.timer - timeLeft;
          if (secondsElapsed > 0 && secondsElapsed % 5 === 0) {
            return calculateRevenue(newState);
          }
          
          return newState;
        });
      };

      gameLoopRef.current = setInterval(handleGameTick, 1000);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isRunning]);

  // Pause game when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      setIsRunning(false);
    }
  }, [timeLeft, isRunning]);

  // Additional money allocation functions for enabling inputs
  const allocateMoneyToElectricity = () => {
    if (gameState.money >= 85) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= 85;
        newState.computeInputs.electricity += 1;
        
        // Improve compute production based on better electricity
        newState.production.compute *= 1.08;
        
        // Electricity is foundational, so it has a smaller but broader effect
        newState.bonuses.computeToData *= 1.03;
        newState.bonuses.computeToAlgorithm *= 1.03;
        newState.bonuses.computeToIntelligence *= 1.03;
        
        return newState;
      });
      
      toast({
        title: "Power Infrastructure Improved",
        description: "Your AI now has more efficient and reliable electricity!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $85 to improve power infrastructure.",
        variant: "destructive",
      });
    }
  };

  const allocateMoneyToHardware = () => {
    if (gameState.money >= 150) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= 150;
        newState.computeInputs.hardware += 1;
        
        // Hardware has a strong effect on compute production
        newState.production.compute *= 1.2;
        
        // Hardware quality has significant impact on intelligence
        newState.bonuses.computeToIntelligence *= 1.1;
        
        return newState;
      });
      
      toast({
        title: "Hardware Quality Upgraded",
        description: "You've acquired more powerful GPUs/TPUs for your AI system!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $150 to upgrade hardware quality.",
        variant: "destructive",
      });
    }
  };

  const allocateMoneyToRegulations = () => {
    if (gameState.money >= 120) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= 120;
        newState.computeInputs.regulation += 1;
        
        // Regulatory compliance helps remove barriers to compute
        newState.production.compute *= 1.15;
        
        // Regulatory environment affects investor confidence
        newState.revenue.investors += 200;
        
        return newState;
      });
      
      toast({
        title: "Regulatory Compliance Improved",
        description: "Your favorable regulatory position has attracted investor interest!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $120 to improve regulatory compliance.",
        variant: "destructive",
      });
    }
  };

  const allocateMoneyToDataQuantity = () => {
    if (gameState.money >= 60) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= 60;
        newState.dataInputs.quantity += 1;
        
        // More data means higher production
        newState.production.data *= 1.15;
        
        // Quantity has a more modest effect on intelligence than quality
        newState.bonuses.dataToIntelligence *= 1.03;
        
        return newState;
      });
      
      toast({
        title: "Data Collection Expanded",
        description: "Your AI now has access to a larger volume of training data!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $60 to expand data collection efforts.",
        variant: "destructive",
      });
    }
  };

  const allocateMoneyToDataFormats = () => {
    if (gameState.money >= 90) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= 90;
        newState.dataInputs.formats += 1;
        
        // New data formats have a significant effect on data production
        newState.production.data *= 1.12;
        
        // Multimodal data substantially improves intelligence
        newState.bonuses.dataToIntelligence *= 1.08;
        
        // Format innovation also improves algorithmic efficiency
        newState.bonuses.dataToAlgorithm *= 1.05;
        
        return newState;
      });
      
      toast({
        title: "Multimodal Data Integration",
        description: "Your AI can now process new types of data like images, audio, and more!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $90 to integrate new data formats.",
        variant: "destructive",
      });
    }
  };

  return {
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
    // Basic money allocation
    allocateMoneyToCompute,
    allocateMoneyToData,
    allocateMoneyToAlgorithm,
    // Detailed compute inputs
    allocateMoneyToElectricity,
    allocateMoneyToHardware,
    allocateMoneyToRegulations,
    // Detailed data inputs
    allocateMoneyToDataQuality: allocateMoneyToData, // Reusing existing function for quality
    allocateMoneyToDataQuantity,
    allocateMoneyToDataFormats,
    // Detailed algorithm inputs
    allocateMoneyToAlgorithmArchitectures: allocateMoneyToAlgorithm, // Reusing existing function for architectures
    timeLeft,
    formattedTime
  };
}
