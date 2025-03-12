import { useState, useEffect, useRef } from "react";
import { initialGameState, GameStateType, Era, GameEvent } from "@/lib/gameState";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameStateType>({ ...initialGameState });
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(initialGameState.timeElapsed);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Format time as MM:SS
  const formattedTime = `${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`;

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
    setTimeElapsed(initialGameState.timeElapsed);
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

  // Train Model function - uses compute capacity and money to boost intelligence
  const trainModel = () => {
    // Training costs: need sufficient compute capacity and money
    const computeRequired = 500; // Large compute capacity requirement
    const moneyCost = 50000;     // Significant monetary cost
    
    // Check if player has enough compute capacity available
    if (gameState.computeCapacity.available < computeRequired) {
      toast({
        title: "Insufficient Compute Capacity",
        description: `You need ${computeRequired} compute capacity available to run this training job. Upgrade your infrastructure.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if player has enough money
    if (gameState.money < moneyCost) {
      toast({
        title: "Insufficient Funds",
        description: `You need $${moneyCost.toLocaleString()} to run this training job.`,
        variant: "destructive",
      });
      return;
    }
    
    // Run the training job - use compute capacity and money for immediate intelligence boost
    setGameState(prevState => {
      const newState = { ...prevState };
      
      // Consume the resources
      newState.computeCapacity.available -= computeRequired;
      newState.money -= moneyCost;
      
      // Large intelligence boost (bigger than regular investments)
      const intelligenceGain = 200;
      newState.intelligence += intelligenceGain;
      
      // Check for breakthroughs after training
      newState.breakthroughs = checkBreakthroughs(newState);
      
      toast({
        title: "Training Complete!",
        description: `Your AI model has been trained, gaining ${intelligenceGain} intelligence points!`,
      });
      
      return newState;
    });
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

  // Check for breakthroughs and trigger era progression when appropriate
  const checkBreakthroughs = (state: GameStateType) => {
    const updatedBreakthroughs = [...state.breakthroughs];
    let breakthroughUnlocked = false;
    
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
          breakthroughUnlocked = true;
          breakthrough.unlocked = true;
          state.intelligence += 100; // Increase intelligence on breakthrough
          
          toast({
            title: `Breakthrough: ${breakthrough.name}`,
            description: breakthrough.description,
          });
          
          // Find next unlocked breakthrough for goal
          const nextBreakthrough = updatedBreakthroughs.find(b => !b.unlocked);
          if (nextBreakthrough) {
            state.currentGoal.id = nextBreakthrough.id;
            state.currentGoal.progress = 0;
          }
        }
      }
    });
    
    // Check if we should advance to the next era
    if (breakthroughUnlocked) {
      checkEraMilestones(state);
    }
    
    return updatedBreakthroughs;
  };
  
  // Check if player has met criteria to advance to the next AI era
  const checkEraMilestones = (state: GameStateType) => {
    const { currentEra, intelligence, levels } = state;
    
    // Count breakthroughs unlocked in the current era
    const eraBreakthroughs = state.breakthroughs.filter(
      b => b.era === currentEra && b.unlocked
    ).length;
    
    // Define thresholds for moving to the next era
    // Each era requires more intelligence and higher resource levels
    switch (currentEra) {
      case Era.GNT2:
        // Move to GNT-3 Era when player has sufficient intelligence and unlocked GNT-2 breakthroughs
        if (intelligence >= 200 && eraBreakthroughs >= 1 && levels.compute >= 2) {
          advanceToNextEra(state, Era.GNT3);
        }
        break;
        
      case Era.GNT3:
        // Move to GNT-4 Era
        if (intelligence >= 400 && eraBreakthroughs >= 1 && levels.data >= 3) {
          advanceToNextEra(state, Era.GNT4);
        }
        break;
        
      case Era.GNT4:
        // Move to GNT-5 Era
        if (intelligence >= 600 && eraBreakthroughs >= 1 && levels.algorithm >= 4) {
          advanceToNextEra(state, Era.GNT5);
        }
        break;
        
      case Era.GNT5:
        // Move to GNT-6 Era
        if (intelligence >= 800 && eraBreakthroughs >= 1 && 
            levels.compute >= 5 && levels.data >= 5 && levels.algorithm >= 5) {
          advanceToNextEra(state, Era.GNT6);
        }
        break;
        
      case Era.GNT6:
        // Move to GNT-7 Era (Final Phase)
        if (intelligence >= 900 && eraBreakthroughs >= 1 && 
            levels.compute >= 6 && levels.data >= 6 && levels.algorithm >= 6) {
          advanceToNextEra(state, Era.GNT7);
        }
        break;
        
      default:
        // GNT-7 is the final era, no further advancement
        break;
    }
  };
  
  // Advance to the next era and trigger educational content and effects
  const advanceToNextEra = (state: GameStateType, newEra: Era) => {
    state.currentEra = newEra;
    
    // Map of historical AI system information for educational content
    const eraInfo = {
      [Era.GNT2]: {
        year: "2019",
        parameterCount: "1.5 billion",
        significance: "GNT-2 was a breakthrough in language modeling capabilities and coherent text generation."
      },
      [Era.GNT3]: {
        year: "2020",
        parameterCount: "175 billion",
        significance: "GNT-3 demonstrated emergent abilities with few-shot learning and could perform tasks it wasn't explicitly trained on."
      },
      [Era.GNT4]: {
        year: "2023",
        parameterCount: "Over a trillion",
        significance: "GNT-4 introduced multimodal capabilities and significantly improved reasoning and instruction following."
      },
      [Era.GNT5]: {
        year: "Near future",
        parameterCount: "Unknown",
        significance: "Hypothetical future model with enhanced reasoning and problem-solving capabilities."
      },
      [Era.GNT6]: {
        year: "Future",
        parameterCount: "Unknown",
        significance: "Speculative model with advanced tool use and possibly approaching general intelligence."
      },
      [Era.GNT7]: {
        year: "Future",
        parameterCount: "Unknown",
        significance: "Theoretical model at the threshold of Artificial General Intelligence."
      }
    };
    
    // Display era advancement toast with educational information
    toast({
      title: `Era Advanced: ${newEra}`,
      description: (newEra === Era.GNT2 || newEra === Era.GNT3 || newEra === Era.GNT4) ? 
        `Your AI has reached the ${newEra} era! Released in ${eraInfo[newEra].year} with ${eraInfo[newEra].parameterCount} parameters. ${eraInfo[newEra].significance}` :
        `Your AI has reached the theoretical ${newEra} era! ${eraInfo[newEra].significance}`,
      duration: 5000,
    });
    
    // Each era has unique bonus effects to represent the technological leap
    switch (newEra) {
      case Era.GNT3:
        // GNT-3 was about massive scaling
        state.production.compute *= 1.5;
        state.bonuses.computeToIntelligence *= 1.3;
        break;
        
      case Era.GNT4:
        // GNT-4 was about multimodal and improved reasoning
        state.production.algorithm *= 1.5;
        state.bonuses.algorithmToIntelligence *= 1.4;
        break;
        
      case Era.GNT5:
        // Hypothetical future advance with better data utilization
        state.production.data *= 1.6;
        state.bonuses.dataToIntelligence *= 1.5;
        break;
        
      case Era.GNT6:
        // Major future leap with dramatic improvements across all dimensions
        state.production.compute *= 1.7;
        state.production.data *= 1.7;
        state.production.algorithm *= 1.7;
        break;
        
      case Era.GNT7:
        // Final era with path to AGI
        state.bonuses.computeToIntelligence *= 2.0;
        state.bonuses.dataToIntelligence *= 2.0;
        state.bonuses.algorithmToIntelligence *= 2.0;
        break;
    }
    
    // Trigger era-specific events
    checkAndTriggerEvents(state);
  };
  
  // Check for and trigger events specific to the current era
  const checkAndTriggerEvents = (state: GameStateType) => {
    // Process events that match the current era and haven't been triggered yet
    const currentEraEvents = state.events.filter(
      event => event.era === state.currentEra && !event.triggered
    );
    
    // For simplicity, trigger the first untriggered event for this era
    if (currentEraEvents.length > 0) {
      const event = currentEraEvents[0];
      event.triggered = true;
      
      // Apply event effects
      applyEventEffect(state, event);
      
      // Notify the player
      toast({
        title: `Event: ${event.title}`,
        description: `${event.description}\n\nHistorical Context: ${event.realWorldContext}`,
        duration: 5000,
      });
    }
  };
  
  // Apply the effects of an event to the game state
  const applyEventEffect = (state: GameStateType, event: GameEvent) => {
    const { effect } = event;
    const impactModifier = effect.impact === 'positive' ? 1 + effect.magnitude/100 : 
                           effect.impact === 'negative' ? 1 - effect.magnitude/100 : 1;
    
    switch (effect.type) {
      case 'compute':
        state.production.compute *= impactModifier;
        break;
        
      case 'data':
        state.production.data *= impactModifier;
        break;
        
      case 'algorithm':
        state.production.algorithm *= impactModifier;
        break;
        
      case 'money':
        state.money *= impactModifier;
        break;
        
      case 'regulation':
        state.computeInputs.regulation = Math.max(1, 
          state.computeInputs.regulation + (effect.impact === 'positive' ? 1 : -1));
        break;
        
      case 'hardware':
        state.computeInputs.hardware = Math.max(1, 
          state.computeInputs.hardware + (effect.impact === 'positive' ? 1 : -1));
        break;
        
      case 'multiple':
        // For multiple effects, apply a smaller boost to several areas
        state.production.compute *= Math.sqrt(impactModifier);
        state.production.data *= Math.sqrt(impactModifier);
        state.production.algorithm *= Math.sqrt(impactModifier);
        break;
    }
  };

  // Calculate revenue from resources and levels
  const calculateRevenue = (state: GameStateType) => {
    const newState = { ...state };
    
    // ===== B2B Revenue: Companies paying to use your AI APIs =====
    // Formula: B2B Income = Base API Rate × (1 + Intelligence Level) × (1 + Developer Tools Bonus)
    
    // Intelligence impact on B2B revenue (automatically scales with intelligence)
    const intelligenceLevel = state.intelligence / 100; // Normalized intelligence impact
    
    // Developer tools bonus: 5% per level
    const developerToolsBonus = state.revenue.developerToolsLevel * 0.05;
    
    // Calculate B2B revenue
    newState.revenue.b2b = Math.floor(
      state.revenue.baseApiRate * (1 + intelligenceLevel) * (1 + developerToolsBonus)
    );
    
    // ===== B2C Revenue: End-User Subscriptions =====
    // Formula: B2C Income = Subscribers × Monthly Fee
    
    // Calculate subscriber growth based on intelligence and data quality milestone
    // Only update subscribers on a periodic basis (monthly equivalent: every 10 seconds)
    if (timeElapsed % 10 === 0 && timeElapsed > 0) {
      // Intelligence & Data Quality impact on subscriber growth
      const intelligenceImpact = Math.pow(state.intelligence / 200, 1.1);
      const dataQualityImpact = state.dataInputs.quality * 0.1;
      
      // Base growth rate (1-2% per period)
      const baseGrowthRate = 0.01 + (intelligenceImpact * 0.01);
      
      // Chatbot improvement bonus (5% more subscribers per level)
      const chatbotBonus = state.revenue.chatbotImprovementLevel * 0.05;
      
      // Calculate total subscriber growth rate
      const totalGrowthRate = baseGrowthRate * (1 + dataQualityImpact) * (1 + chatbotBonus);
      
      // Update subscriber count with growth
      newState.revenue.subscribers = Math.floor(
        state.revenue.subscribers * (1 + totalGrowthRate)
      );
    }
    
    // Calculate B2C revenue from subscribers
    newState.revenue.b2c = Math.floor(
      state.revenue.subscribers * state.revenue.monthlyFee
    );
    
    // ===== Investor Funding: Simplified as special events =====
    // We've simplified investor funding as a periodic bonus rather than a continuous revenue stream
    
    // Base investor confidence depends on regulation level and breakthroughs
    const unlockedBreakthroughs = state.breakthroughs.filter(b => b.unlocked).length;
    const regulatoryConfidence = state.computeInputs.regulation * 0.5;
    
    // Intelligence growth rate: investors love rapid progress
    const growthPotential = (state.bonuses.computeToIntelligence + 
                          state.bonuses.dataToIntelligence + 
                          state.bonuses.algorithmToIntelligence - 3) * 50;
    
    // Calculate potential investor funding for next round
    // Note: Actual investor funding will be triggered by periodic events
    newState.revenue.investors = Math.floor(
      unlockedBreakthroughs * 150 + regulatoryConfidence * 100 + growthPotential
    );
    
    // Periodically attract investors (not every income cycle)
    // This simulates periodic funding rounds
    if (timeElapsed % 30 === 0 && timeElapsed > 0 && state.intelligence > 200) {
      // Investor round happens every 30 seconds after initial growth
      newState.money += newState.revenue.investors;
      toast({
        title: "Investor Funding Received!",
        description: `You've secured $${formatCurrency(newState.revenue.investors)} in new funding based on your progress!`,
      });
    } else {
      // Regular operational revenue
      newState.money += newState.revenue.b2b + newState.revenue.b2c;
    }
    
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

  // Calculate production rates based on enabling inputs and synergy bonuses
  const calculateProductionRates = (state: GameStateType) => {
    const newState = { ...state };
    
    // Compute production formula:
    // Base rate + (enabling inputs bonuses) × (1 + sum of synergy bonuses)
    const computeEnablingInputsBonus = 
      0.2 * state.computeInputs.money + 
      0.15 * state.computeInputs.electricity + 
      0.3 * state.computeInputs.hardware + 
      0.1 * state.computeInputs.regulation;
    
    const computeSynergyBonus = 
      (state.bonuses.dataToCompute - 1) + 
      (state.bonuses.algorithmToCompute - 1);
    
    newState.production.compute = 
      (state.production.compute * 0.8) + // Base production with mild decay to prevent runaway growth
      computeEnablingInputsBonus * (1 + computeSynergyBonus);
    
    // Data production formula
    const dataEnablingInputsBonus = 
      0.25 * state.dataInputs.quality + 
      0.2 * state.dataInputs.quantity + 
      0.15 * state.dataInputs.formats;
    
    const dataSynergyBonus = 
      (state.bonuses.computeToData - 1) + 
      (state.bonuses.algorithmToData - 1);
    
    newState.production.data = 
      (state.production.data * 0.8) + 
      dataEnablingInputsBonus * (1 + dataSynergyBonus);
    
    // Algorithm production formula
    const algoEnablingInputsBonus = 
      0.35 * state.algorithmInputs.architectures;
    
    const algoSynergyBonus = 
      (state.bonuses.computeToAlgorithm - 1) + 
      (state.bonuses.dataToAlgorithm - 1);
    
    newState.production.algorithm = 
      (state.production.algorithm * 0.8) + 
      algoEnablingInputsBonus * (1 + algoSynergyBonus);
    
    return newState;
  };
  
  // Game loop
  useEffect(() => {
    if (isRunning) {
      const handleGameTick = () => {
        // Increment time elapsed
        setTimeElapsed(prevTime => prevTime + 1);

        setGameState(prevState => {
          // Calculate updated production rates based on enabling inputs and synergies
          let newState = calculateProductionRates(prevState);
          
          // Update resources based on production rates
          newState.resources.compute += newState.production.compute;
          newState.resources.data += newState.production.data;
          newState.resources.algorithm += newState.production.algorithm;
          
          // Increment game days elapsed (representing time passing)
          // Each real second = 1 in-game day
          newState.daysElapsed += 1;
          
          // Update compute capacity availability
          // Compute capacity recharges slowly over time (5% of max per tick)
          const rechargeAmount = Math.ceil(newState.computeCapacity.maxCapacity * 0.05);
          newState.computeCapacity.available = Math.min(
            newState.computeCapacity.maxCapacity,
            newState.computeCapacity.available + rechargeAmount
          );
          
          // As money is invested in compute and hardware improves, max capacity increases
          // We calculate this based on compute level and hardware level multipliers
          if (timeElapsed % 10 === 0) { // Update max capacity every 10 seconds
            const computeMultiplier = Math.pow(1.2, newState.levels.compute);
            const hardwareMultiplier = Math.pow(1.1, newState.computeInputs.hardware);
            newState.computeCapacity.maxCapacity = Math.floor(2000 * computeMultiplier * hardwareMultiplier);
          }
          
          // Update intelligence based on resource levels and bonuses
          // This creates a multiplicative effect when resources work together
          const computeContribution = newState.levels.compute * newState.bonuses.computeToIntelligence;
          const dataContribution = newState.levels.data * newState.bonuses.dataToIntelligence;
          const algorithmContribution = newState.levels.algorithm * newState.bonuses.algorithmToIntelligence;
          
          // Synergy bonus when all three resources are developed together
          // The more balanced your development, the stronger the synergy
          const synergyMultiplier = Math.min(
            newState.levels.compute, 
            newState.levels.data, 
            newState.levels.algorithm
          ) * 0.05;
          
          // Apply a small intelligence increase each tick
          newState.intelligence += 
            0.02 * (computeContribution + dataContribution + algorithmContribution) * 
            (1 + synergyMultiplier);
          
          // Calculate revenue every 5 seconds
          if (timeElapsed > 0 && timeElapsed % 5 === 0) {
            newState = calculateRevenue(newState);
          }
          
          // Random event check (approximately every 30 days/seconds with 20% chance)
          if (newState.daysElapsed % 30 === 0 && Math.random() < 0.20) {
            checkAndTriggerEvents(newState);
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

  // Check if player has reached AGI threshold
  useEffect(() => {
    if (gameState.intelligence >= gameState.agiThreshold && isRunning) {
      setIsRunning(false);
      toast({
        title: "Victory! AGI Achieved",
        description: `Congratulations! You've developed AGI in ${formattedTime}! Your time has been recorded.`,
        duration: 8000,
      });
    }
  }, [gameState.intelligence, isRunning, formattedTime]);

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

  // New revenue enhancement functions
  
  // Function to improve developer tools (improves B2B revenue)
  const improveDeveloperTools = () => {
    const toolUpgradeCost = 5000; // $5,000 cost per upgrade
    
    if (gameState.money >= toolUpgradeCost) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= toolUpgradeCost;
        newState.revenue.developerToolsLevel += 1;
        
        // Increasing developer tools gives +5% permanent bonus to B2B revenue
        // This is already handled in the calculateRevenue function
        
        return newState;
      });
      
      toast({
        title: "Developer Tools Improved",
        description: "You've enhanced your API's developer tools, boosting your B2B revenue by 5%!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: `You need at least $${toolUpgradeCost.toLocaleString()} to improve developer tools.`,
        variant: "destructive",
      });
    }
  };
  
  // Function to improve chatbot capabilities (improves B2C subscriber growth)
  const improveChatbot = () => {
    const chatbotUpgradeCost = 10000; // $10,000 cost per upgrade
    
    if (gameState.money >= chatbotUpgradeCost) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= chatbotUpgradeCost;
        newState.revenue.chatbotImprovementLevel += 1;
        
        // Increasing chatbot capabilities gives +5% permanent bonus to subscriber growth
        // This is already handled in the calculateRevenue function
        
        return newState;
      });
      
      toast({
        title: "Chatbot Capabilities Improved",
        description: "You've enhanced your AI chatbot, permanently increasing your subscriber growth rate by 5%!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: `You need at least $${chatbotUpgradeCost.toLocaleString()} to improve chatbot capabilities.`,
        variant: "destructive",
      });
    }
  };
  
  // Function to run an advertising campaign (instantly adds subscribers)
  const runAdvertisingCampaign = () => {
    const adCampaignCost = 10000; // $10,000 cost per campaign
    const subscribersGained = 1000; // Gain 1000 subscribers per campaign
    
    if (gameState.money >= adCampaignCost) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= adCampaignCost;
        newState.revenue.subscribers += subscribersGained;
        
        return newState;
      });
      
      toast({
        title: "Advertising Campaign Launched",
        description: `Your campaign was successful! You've gained ${subscribersGained.toLocaleString()} new subscribers immediately.`,
      });
    } else {
      toast({
        title: "Not enough money",
        description: `You need at least $${adCampaignCost.toLocaleString()} to launch an advertising campaign.`,
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
    allocateMoneyToDataQuality: allocateMoneyToData, // Reusing existing function for quality
    allocateMoneyToDataQuantity,
    allocateMoneyToDataFormats,
    // Detailed algorithm inputs
    allocateMoneyToAlgorithmArchitectures: allocateMoneyToAlgorithm, // Reusing existing function for architectures
    // New revenue enhancement functions
    improveDeveloperTools,
    improveChatbot,
    runAdvertisingCampaign,
    timeElapsed,
    formattedTime
  };
}
