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
    timeLeft,
    formattedTime
  };
}
