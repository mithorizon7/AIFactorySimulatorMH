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
    // Calculate costs and benefits based on game progression (era)
    // Higher eras = more expensive but more impactful training
    const eraMultiplier = {
      [Era.GNT2]: 1.0,
      [Era.GNT3]: 1.8,
      [Era.GNT4]: 3.0,
      [Era.GNT5]: 5.0,
      [Era.GNT6]: 8.0,
      [Era.GNT7]: 12.0
    };
    
    const currentMultiplier = eraMultiplier[gameState.currentEra];
    
    // Base requirements that scale with era
    const baseComputeRequired = 300;
    const baseMoneyCost = 25000;
    const baseIntelligenceGain = 150;
    
    // Scale costs and benefits with era
    const computeRequired = Math.ceil(baseComputeRequired * currentMultiplier);
    const moneyCost = Math.ceil(baseMoneyCost * Math.sqrt(currentMultiplier)); // Money scales more slowly
    
    // Calculate intelligence gain with bonuses from data and algorithm levels
    const dataQualityBonus = 1 + (gameState.dataInputs.quality * 0.05); // 5% per level
    const algorithmBonus = 1 + (gameState.levels.algorithm * 0.08); // 8% per level
    const dataQuantityBonus = 1 + (gameState.dataInputs.quantity * 0.03); // 3% per level
    
    // Final intelligence gain with all bonuses applied
    const intelligenceGain = Math.ceil(
      baseIntelligenceGain * currentMultiplier * dataQualityBonus * algorithmBonus * dataQuantityBonus
    );
    
    // Check if player has enough compute capacity available
    if (gameState.computeCapacity.available < computeRequired) {
      toast({
        title: "Insufficient Compute Capacity",
        description: `You need ${computeRequired.toLocaleString()} compute capacity available to run this training job. Upgrade your infrastructure.`,
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
      newState.computeCapacity.used += computeRequired; // Track used compute
      newState.money -= moneyCost;
      
      // Apply intelligence gain
      newState.intelligence += intelligenceGain;
      
      // Gradual compute recovery - the used compute will reduce over time
      // This simulates the gradual freeing up of compute resources after a training job
      
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
    
    // ===== Calculate Base Revenue First =====
    
    // B2B Revenue: Companies paying to use your AI APIs
    // Formula: B2B Income = Base API Rate × (1 + Intelligence Level) × (1 + Developer Tools Bonus)
    
    // Intelligence impact on B2B revenue (automatically scales with intelligence)
    const intelligenceLevel = newState.intelligence / 100; // Normalized intelligence impact
    
    // Developer tools bonus: 5% per level
    const developerToolsBonus = newState.revenue.developerToolsLevel * 0.05;
    
    // Calculate base B2B revenue before any penalties
    const potentialB2bRevenue = Math.floor(
      newState.revenue.baseApiRate * (1 + intelligenceLevel) * (1 + developerToolsBonus)
    );
    
    // B2C Revenue: End-User Subscriptions
    // Formula: B2C Income = Subscribers × Monthly Fee
    
    // Update subscribers count (every 10 seconds = monthly)
    if (timeElapsed % 10 === 0 && timeElapsed > 0) {
      // Only process subscriber growth if we have any to begin with
      // or if the player has enabled the chatbot service
      if (newState.revenue.subscribers > 0 || newState.revenue.chatbotEnabled) {
        // Minimum subscribers to start with if chatbot is enabled but no subscribers yet
        if (newState.revenue.subscribers === 0 && newState.revenue.chatbotEnabled) {
          // Initial subscribers - small number to bootstrap growth
          newState.revenue.subscribers = 50;
          toast({
            title: "First Subscribers!",
            description: "Your chatbot service has attracted its first 50 subscribers!",
          });
        }
      
        // Intelligence & Data Quality impact on subscriber growth
        const intelligenceImpact = Math.pow(newState.intelligence / 200, 1.1);
        const dataQualityImpact = newState.dataInputs.quality * 0.1;
        
        // Base growth rate (1-2% per period)
        const baseGrowthRate = 0.01 + (intelligenceImpact * 0.01);
        
        // Chatbot improvement bonus (5% more subscribers per level)
        const chatbotBonus = newState.revenue.chatbotImprovementLevel * 0.05;
        
        // Calculate total subscriber growth rate
        const totalGrowthRate = baseGrowthRate * (1 + dataQualityImpact) * (1 + chatbotBonus);
        
        // Update subscriber count with growth
        newState.revenue.subscribers = Math.floor(
          newState.revenue.subscribers * (1 + totalGrowthRate)
        );
      }
    }
    
    // Calculate potential B2C revenue before any penalties
    const potentialB2cRevenue = Math.floor(
      newState.revenue.subscribers * newState.revenue.monthlyFee
    );
    
    // ===== Apply Compute Usage and Service Quality Penalties =====
    
    // Only consume compute if we have active services
    const hasActiveCustomers = newState.revenue.apiEnabled || 
                              (newState.revenue.chatbotEnabled && newState.revenue.subscribers > 0);
    
    if (hasActiveCustomers) {
      // Calculate compute consumption based on potential customer usage
      const b2bComputeUsage = newState.revenue.apiEnabled ? 
        Math.ceil((potentialB2bRevenue / 1000) * 5) : 0; // 5 compute per $1000 of B2B revenue
      
      const b2cComputeUsage = newState.revenue.subscribers > 0 ? 
        Math.ceil(newState.revenue.subscribers * 0.01) : 0; // 0.01 compute per subscriber
      
      const totalComputeUsage = b2bComputeUsage + b2cComputeUsage;
      
      let serviceQualityRatio = 1.0; // Default: full quality
      
      // Apply compute usage if needed
      if (totalComputeUsage > 0) {
        // If we have enough compute, use it
        if (newState.computeCapacity.available >= totalComputeUsage) {
          newState.computeCapacity.available -= totalComputeUsage;
          newState.computeCapacity.used += totalComputeUsage;
        } 
        // If we don't have enough compute, reduce service quality
        else {
          serviceQualityRatio = newState.computeCapacity.available / totalComputeUsage;
          const usedAmount = newState.computeCapacity.available; // Store before zeroing out
          newState.computeCapacity.available = 0; // Use all available compute
          newState.computeCapacity.used += usedAmount;
          
          // Show a warning toast when service quality drops
          if (timeElapsed % 10 === 0) {
            toast({
              title: "Insufficient Compute Capacity!",
              description: "Your services are degraded due to compute shortage. Revenue and customers affected.",
              variant: "destructive",
              duration: 3000,
            });
          }
          
          // Lose some subscribers due to poor service quality
          if (timeElapsed % 10 === 0 && newState.revenue.subscribers > 0) {
            const churnRate = 0.05 * (1 - serviceQualityRatio); // Max 5% churn based on quality
            const previousSubscribers = newState.revenue.subscribers;
            newState.revenue.subscribers = Math.floor(
              newState.revenue.subscribers * (1 - churnRate)
            );
            
            const lostSubscribers = previousSubscribers - newState.revenue.subscribers;
            if (lostSubscribers > 10) {
              toast({
                title: "Subscribers Leaving!",
                description: `${lostSubscribers} subscribers have left due to service quality issues.`,
                variant: "destructive",
                duration: 3000,
              });
            }
          }
        }
      }
      
      // Apply service quality ratio to revenue (min 50% of potential revenue)
      const qualityImpact = 0.5 + (serviceQualityRatio * 0.5);
      
      // Set final revenue amounts based on potential and service quality
      newState.revenue.b2b = Math.floor(potentialB2bRevenue * qualityImpact);
      newState.revenue.b2c = Math.floor(potentialB2cRevenue * qualityImpact);
    } else {
      // No active customers, so zero revenue
      newState.revenue.b2b = 0;
      newState.revenue.b2c = 0;
    }
    
    // ===== Investor Funding: Simplified as special events =====
    
    // Investor funding starts earlier in the game now (100 intelligence)
    const minIntelligenceForInvestors = 100;
    
    // Base investor confidence depends on regulatory compliance and breakthroughs
    const unlockedBreakthroughs = state.breakthroughs.filter(b => b.unlocked).length;
    const regulatoryConfidence = state.computeInputs.regulation * 0.5;
    
    // Intelligence growth rate: investors love rapid progress
    const growthPotential = (state.bonuses.computeToIntelligence + 
                          state.bonuses.dataToIntelligence + 
                          state.bonuses.algorithmToIntelligence - 3) * 50;
    
    // Calculate potential investor funding for next round
    newState.revenue.investors = Math.floor(
      unlockedBreakthroughs * 150 + regulatoryConfidence * 100 + growthPotential
    );
    
    // Early-game booster funding (first 2 minutes)
    if (timeElapsed < 120 && timeElapsed % 30 === 0 && timeElapsed > 0) {
      const seedFunding = 2000 + Math.floor(newState.intelligence * 10);
      newState.money += seedFunding;
      toast({
        title: "Seed Funding Received!",
        description: `You've secured $${formatCurrency(seedFunding)} in seed funding to help develop your AI.`,
      });
    }
    // Regular investor funding rounds
    else if (timeElapsed % 30 === 0 && timeElapsed > 0 && state.intelligence > minIntelligenceForInvestors) {
      // Investor round happens every 30 seconds after reaching intelligence threshold
      newState.money += newState.revenue.investors;
      toast({
        title: "Investor Funding Received!",
        description: `You've secured $${formatCurrency(newState.revenue.investors)} in funding based on your progress!`,
      });
    } else {
      // Regular operational revenue from B2B and B2C
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
          // Compute capacity recharges slowly over time (3% of max per tick)
          // Base recharge rate that's affected by the power efficiency level
          const baseRechargeRate = 0.03;
          const powerEfficiencyBonus = 1 + (newState.computeInputs.electricity * 0.02); // 2% boost per level
          const rechargeRate = baseRechargeRate * powerEfficiencyBonus;
          
          // Recharge available capacity
          const rechargeAmount = Math.ceil(newState.computeCapacity.maxCapacity * rechargeRate);
          newState.computeCapacity.available = Math.min(
            newState.computeCapacity.maxCapacity,
            newState.computeCapacity.available + rechargeAmount
          );
          
          // Gradually reduce used compute over time (simulates jobs completing)
          if (newState.computeCapacity.used > 0) {
            // Reduce used compute by 1% per tick
            const computeRecovery = Math.ceil(newState.computeCapacity.used * 0.01);
            newState.computeCapacity.used = Math.max(0, newState.computeCapacity.used - computeRecovery);
          }
          
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

  // Revenue service management functions
  const toggleApiService = () => {
    setGameState(prevState => {
      const newState = { ...prevState };
      newState.revenue.apiEnabled = !newState.revenue.apiEnabled;
      
      // If activating for the first time and intelligence is high enough, suggest setting a higher API rate
      if (newState.revenue.apiEnabled && newState.intelligence > 200 && newState.revenue.baseApiRate < 1500) {
        newState.revenue.baseApiRate = 1500; // Higher starting rate for more advanced models
      }
      
      return newState;
    });
    
    toast({
      title: gameState.revenue.apiEnabled ? "API Service Disabled" : "API Service Enabled",
      description: gameState.revenue.apiEnabled 
        ? "You've disabled your API service. B2B revenue will stop." 
        : "You've enabled your API service. Companies can now use your AI via API.",
    });
  };
  
  const toggleChatbotService = () => {
    setGameState(prevState => {
      const newState = { ...prevState };
      newState.revenue.chatbotEnabled = !newState.revenue.chatbotEnabled;
      
      // If disabling when we have subscribers, warn about potential loss
      if (!newState.revenue.chatbotEnabled && newState.revenue.subscribers > 100) {
        toast({
          title: "Warning: Subscribers at Risk",
          description: "Disabling the chatbot will prevent new subscriptions and may cause subscriber loss.",
          variant: "destructive",
        });
      }
      
      return newState;
    });
    
    toast({
      title: gameState.revenue.chatbotEnabled ? "Chatbot Service Disabled" : "Chatbot Service Enabled",
      description: gameState.revenue.chatbotEnabled 
        ? "You've disabled your chatbot service. No new subscribers will join." 
        : "You've enabled your chatbot service. Users can now subscribe to your AI assistant.",
    });
  };
  
  const setApiRate = (rate: number) => {
    // Ensure the rate is in valid range
    const validRate = Math.max(500, Math.min(5000, rate));
    
    setGameState(prevState => {
      const newState = { ...prevState };
      newState.revenue.baseApiRate = validRate;
      return newState;
    });
    
    toast({
      title: "API Rate Updated",
      description: `Your API rate is now $${formatCurrency(validRate)}/tick.`,
    });
  };
  
  const setMonthlyFee = (fee: number) => {
    // Ensure the fee is in valid range
    const validFee = Math.max(5, Math.min(25, fee));
    
    setGameState(prevState => {
      const newState = { ...prevState };
      newState.revenue.monthlyFee = validFee;
      
      // If fee increases too much, we may lose some subscribers
      if (validFee > prevState.revenue.monthlyFee * 1.5 && prevState.revenue.subscribers > 100) {
        const attritionRate = 0.05; // 5% subscriber loss on significant price increases
        const previousSubscribers = newState.revenue.subscribers;
        newState.revenue.subscribers = Math.floor(newState.revenue.subscribers * (1 - attritionRate));
        
        const lostSubscribers = previousSubscribers - newState.revenue.subscribers;
        if (lostSubscribers > 10) {
          toast({
            title: "Price Increase Impact",
            description: `${lostSubscribers} subscribers left due to the significant price increase.`,
            variant: "destructive",
          });
        }
      }
      
      return newState;
    });
    
    toast({
      title: "Monthly Fee Updated",
      description: `Your subscription fee is now $${formatCurrency(validFee)}/month.`,
    });
  };

  // Revenue enhancement functions
  
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
  };
}
