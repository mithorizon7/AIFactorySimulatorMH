import { useState, useEffect, useRef } from "react";
import { initialGameState, GameStateType, Era, GameEvent, TrainingStatus } from "@/lib/gameState";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { narrative } from "@/lib/narrativeContent";

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameStateType>({ ...initialGameState });
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(initialGameState.timeElapsed);
  const [advisorMessage, setAdvisorMessage] = useState<any | null>(null);
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

  // Tutorial progression functions
  const advanceTutorial = () => {
    setGameState(prevState => {
      const newState = { ...prevState };
      
      // Check if we need to advance to next phase
      const currentPhase = newState.tutorial.phase;
      const currentStep = newState.tutorial.step;
      
      // Define max steps per phase
      const maxStepsPerPhase: Record<number, number> = {
        1: 2, // Phase 1 has 2 steps
        2: 3, // Phase 2 has 3 steps
        3: 2, // Phase 3 has 2 steps
        4: 3  // Phase 4 has 3 steps
      };
      
      if (currentStep < maxStepsPerPhase[currentPhase]) {
        // Advance to next step within current phase
        newState.tutorial.step = currentStep + 1;
      } else if (currentPhase < 4) {
        // Advance to next phase
        newState.tutorial.phase = currentPhase + 1;
        newState.tutorial.step = 1;
      } else {
        // Tutorial complete
        newState.tutorial.isCompleted = true;
        newState.tutorial.isActive = false;
        
        toast({
          title: "Tutorial Complete!",
          description: "You're now ready to build the world's first AGI. Good luck!",
          duration: 5000,
        });
      }
      
      return newState;
    });
  };

  const skipTutorial = () => {
    setGameState(prevState => ({
      ...prevState,
      tutorial: {
        ...prevState.tutorial,
        isActive: false,
        isCompleted: true
      }
    }));
    
    toast({
      title: "Tutorial Skipped",
      description: "You can always restart the game to replay the tutorial.",
      duration: 3000,
    });
  };

  // Check tutorial progression based on game state
  const checkTutorialProgression = (state: GameStateType) => {
    if (!state.tutorial.isActive || state.tutorial.isCompleted) return;
    
    // Auto-advance tutorial based on certain conditions
    const currentPhase = state.tutorial.phase;
    const currentStep = state.tutorial.step;
    
    // Phase 2: Auto-advance when player upgrades each resource type
    if (currentPhase === 2) {
      if (currentStep === 1 && state.levels.compute > 1) {
        // Player upgraded compute, advance to data step
        advanceTutorial();
      } else if (currentStep === 2 && state.levels.data > 1) {
        // Player upgraded data, advance to algorithm step
        advanceTutorial();
      } else if (currentStep === 3 && state.levels.algorithm > 1) {
        // Player upgraded algorithm, advance to next phase
        advanceTutorial();
      }
    }
    
    // Phase 3: Auto-advance when player achieves first breakthrough
    if (currentPhase === 3 && currentStep === 1) {
      const hasBreakthrough = state.breakthroughs.some(b => b.unlocked);
      if (hasBreakthrough) {
        advanceTutorial();
      }
    }
  };



  // Helper function to get the next era
  const getNextEra = (currentEra: Era): Era => {
    switch (currentEra) {
      case Era.GNT2: return Era.GNT3;
      case Era.GNT3: return Era.GNT4;
      case Era.GNT4: return Era.GNT5;
      case Era.GNT5: return Era.GNT6;
      case Era.GNT6: return Era.GNT7;
      case Era.GNT7: return Era.GNT7; // Already at max
    }
  };
  
  // startEraTrainingRun - begins a training run for the next era
  const startEraTrainingRun = () => {
    // Determine the target era based on current era (always the next one)
    const currentEra = gameState.currentEra;
    let nextEra = getNextEra(currentEra);
    
    // Check if already at max era
    if (currentEra === Era.GNT7 && nextEra === Era.GNT7) {
      toast({
        title: "Maximum Era Reached",
        description: "You have reached the highest era possible. Focus on reaching AGI by continuing to improve your AI.",
        variant: "destructive",
      });
      return;
    }
    
    // Get the training run for the next era if it exists
    // Note: For GNT-2 era, there won't be a run in the runs object since we start at GNT-2 and train toward GNT-3
    const trainingRun = Object.prototype.hasOwnProperty.call(gameState.training.runs, nextEra) ? 
      gameState.training.runs[nextEra as keyof typeof gameState.training.runs] : null;
    
    // If we're already actively training, don't allow starting another run
    if (gameState.training.active) {
      toast({
        title: "Training Already in Progress",
        description: "Your AI is already undergoing training. Wait for the current training run to complete.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if this era's training is already complete
    if (trainingRun && trainingRun.status === TrainingStatus.COMPLETE) {
      toast({
        title: "Training Already Complete",
        description: `You have already completed the training for ${trainingRun.name}.`,
        variant: "destructive",
      });
      return;
    }
    
    // Function to check prerequisites
    const checkPrerequisites = () => {
      if (!trainingRun) return [];
      const prereqs = trainingRun.prerequisites;
      const messages: string[] = [];
      
      // Check compute level
      if (gameState.levels.compute < prereqs.compute) {
        messages.push(`Compute Level: ${gameState.levels.compute}/${prereqs.compute}`);
      }
      
      // Check data prerequisites
      if (gameState.dataInputs.quality < prereqs.data.quality) {
        messages.push(`Data Quality: ${gameState.dataInputs.quality}/${prereqs.data.quality}`);
      }
      if (gameState.dataInputs.quantity < prereqs.data.quantity) {
        messages.push(`Data Quantity: ${gameState.dataInputs.quantity}/${prereqs.data.quantity}`);
      }
      if (gameState.dataInputs.formats < prereqs.data.formats) {
        messages.push(`Data Formats: ${gameState.dataInputs.formats}/${prereqs.data.formats}`);
      }
      
      // Check algorithm prerequisites
      if (gameState.algorithmInputs.architectures < prereqs.algorithm.architectures) {
        messages.push(`Algorithm Architectures: ${gameState.algorithmInputs.architectures}/${prereqs.algorithm.architectures}`);
      }
      if (gameState.training.algorithmResearchProgress < prereqs.algorithm.researchProgress) {
        messages.push(`Algorithm Research: ${Math.floor(gameState.training.algorithmResearchProgress)}/${prereqs.algorithm.researchProgress}%`);
      }
      
      // Check compute inputs
      if (gameState.computeInputs.electricity < prereqs.computeInputs.electricity) {
        messages.push(`Electricity: ${gameState.computeInputs.electricity}/${prereqs.computeInputs.electricity}`);
      }
      if (gameState.computeInputs.hardware < prereqs.computeInputs.hardware) {
        messages.push(`Hardware: ${gameState.computeInputs.hardware}/${prereqs.computeInputs.hardware}`);
      }
      if (gameState.computeInputs.regulation < prereqs.computeInputs.regulation) {
        messages.push(`Regulatory Compliance: ${gameState.computeInputs.regulation}/${prereqs.computeInputs.regulation}`);
      }
      
      return messages;
    };
    
    // If training run is locked, check prerequisites
    if (trainingRun && trainingRun.status === TrainingStatus.LOCKED) {
      const missingPrereqs = checkPrerequisites();
      
      if (missingPrereqs.length > 0) {
        toast({
          title: "Cannot Start Training - Missing Prerequisites",
          description: `You need to meet these requirements: ${missingPrereqs.join(", ")}`,
          variant: "destructive",
        });
        return;
      } else {
        // All prerequisites met, change status to AVAILABLE
        setGameState(prevState => {
          const newState = { ...prevState };
          if (Object.prototype.hasOwnProperty.call(newState.training.runs, nextEra)) {
            const typedEra = nextEra as keyof typeof newState.training.runs;
            newState.training.runs[typedEra].status = TrainingStatus.AVAILABLE;
          }
          return newState;
        });
        
        toast({
          title: "Training Prerequisites Met!",
          description: `You can now start the ${trainingRun.name} training run.`,
        });
        return;
      }
    }
    
    // Check if player has enough compute capacity available for the training run
    if (!trainingRun || gameState.computeCapacity.available < trainingRun.computeRequired) {
      toast({
        title: "Insufficient Compute Capacity",
        description: `You need ${trainingRun?.computeRequired.toLocaleString() || "more"} compute capacity available to run this training job. Upgrade your infrastructure.`,
        variant: "destructive",
      });
      return;
    }
    
    // *** ADD THIS BLOCK ***
    // Check for money cost
    if (!trainingRun || gameState.money < trainingRun.moneyCost) {
      toast({
        title: "Insufficient Funds for Training",
        description: `You need ${formatCurrency(trainingRun?.moneyCost || 0)} to start this training run.`,
        variant: "destructive",
      });
      return;
    }
    
    // Start the training run
    setGameState(prevState => {
      const newState = { ...prevState };

      // *** ADD THIS LINE ***
      // Deduct the monetary cost
      newState.money -= trainingRun.moneyCost;
      
      // Reserve the compute for training
      newState.computeCapacity.available -= trainingRun.computeRequired;
      newState.computeCapacity.used += trainingRun.computeRequired;
      
      // Update training status
      newState.training.active = true;
      newState.training.daysRemaining = trainingRun.daysRequired;
      newState.training.computeReserved = trainingRun.computeRequired;
      
      // Update the specific training run if it exists
      if (Object.prototype.hasOwnProperty.call(newState.training.runs, nextEra)) {
        const typedEra = nextEra as keyof typeof newState.training.runs;
        newState.training.runs[typedEra].status = TrainingStatus.IN_PROGRESS;
        newState.training.runs[typedEra].daysRemaining = trainingRun.daysRequired;
        newState.training.runs[typedEra].isTrainingReserveActive = true;
      }
      
      toast({
        title: "Training Started!",
        description: `Your AI has begun the ${trainingRun.name} training run. It will take ${trainingRun.daysRequired} days to complete.`,
      });
      
      return newState;
    });
  };
  
  // Legacy trainModel function - now just a wrapper for startEraTrainingRun
  const trainModel = () => {
    startEraTrainingRun();
  };

  // Investment functions


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
          
          // NEW: Trigger Spark's message for breakthroughs
          const breakthroughKey = `BREAKTHROUGH_${breakthrough.id}`;
          if (narrative[breakthroughKey as keyof typeof narrative]) {
            setAdvisorMessage(narrative[breakthroughKey as keyof typeof narrative]);
          } else {
            // Fallback for unthemed breakthroughs
            toast({
              title: `Breakthrough: ${breakthrough.name}`,
              description: breakthrough.description,
            });
          }
          
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
    
    // NEW: Trigger Spark's message for era advancement
    const eraKey = `ERA_ADVANCE_${newEra.replace('-', '')}`;
    if (narrative[eraKey as keyof typeof narrative]) {
      setAdvisorMessage(narrative[eraKey as keyof typeof narrative]);
    } else {
      // Fallback toast for unthemed eras
      toast({
        title: `Era Advanced: ${newEra}`,
        description: (newEra === Era.GNT2 || newEra === Era.GNT3 || newEra === Era.GNT4) ? 
          `Your AI has reached the ${newEra} era! Released in ${eraInfo[newEra].year} with ${eraInfo[newEra].parameterCount} parameters. ${eraInfo[newEra].significance}` :
          `Your AI has reached the theoretical ${newEra} era! ${eraInfo[newEra].significance}`,
        duration: 5000,
      });
    }
    
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
  
  // Check for and process investment milestones based on intelligence level
  const checkInvestmentMilestones = (state: GameStateType) => {
    // Only check milestones if we have a next milestone to check
    if (state.nextMilestoneId <= state.investmentMilestones.length) {
      // Get the next milestone
      const milestone = state.investmentMilestones.find(m => m.id === state.nextMilestoneId);
      
      if (milestone && !milestone.unlocked && state.intelligence >= milestone.requiredIntelligence) {
        // Unlock the milestone
        milestone.unlocked = true;
        
        // Add funding to the player's money
        state.money += milestone.funding;
        
        // Set the next milestone to check
        state.nextMilestoneId++;
        
        // Notify the player
        toast({
          title: `Investment Round: ${milestone.name}`,
          description: `You've reached the intelligence threshold for ${milestone.name}! Investors have contributed $${milestone.funding.toLocaleString()}.\n\nContext: ${milestone.realWorldParallel}`,
          duration: 7000,
        });
        
        // Check if we just unlocked API or Chatbot availability with this milestone
        if (milestone.era === Era.GNT3 && !state.revenue.apiAvailable) {
          state.revenue.apiAvailable = true;
          toast({
            title: "API Service Unlocked",
            description: "Your AI is now capable enough to offer limited API services to developers. You can enable this service in the Economy tab.",
            duration: 5000,
          });
        }
        
        if (milestone.era === Era.GNT4 && !state.revenue.chatbotAvailable) {
          state.revenue.chatbotAvailable = true;
          toast({
            title: "Chatbot Service Unlocked",
            description: "Your AI is now capable enough to offer consumer chatbot services. You can enable this service in the Economy tab.",
            duration: 5000,
          });
        }
      }
    }
  };

  // Check for contextual strategic warnings and hints
  const checkStrategicWarnings = (state: GameStateType) => {
    // Skip if already showing an advisor message
    if (advisorMessage) return;
    
    const computeUsageRatio = state.computeCapacity.used / state.computeCapacity.maxCapacity;
    
    // Critical compute warning
    if (computeUsageRatio >= 0.95 && !state.narrativeFlags.hasSeenComputeWarning) {
      setAdvisorMessage(narrative.COMPUTE_WARNING_CRITICAL);
      state.narrativeFlags.hasSeenComputeWarning = true;
      return;
    }
    
    // High compute warning
    if (computeUsageRatio >= 0.9 && !state.narrativeFlags.hasSeenComputeWarning) {
      setAdvisorMessage(narrative.COMPUTE_WARNING_HIGH);
      state.narrativeFlags.hasSeenComputeWarning = true;
      return;
    }
    
    // Low funds warning
    if (state.money < 100 && !state.narrativeFlags.hasSeenLowFundsWarning) {
      setAdvisorMessage(narrative.LOW_FUNDS_WARNING);
      state.narrativeFlags.hasSeenLowFundsWarning = true;
      return;
    }
    
    // First revenue milestone
    if ((state.revenue.b2b > 0 || state.revenue.b2c > 0) && !state.narrativeFlags.hasSeenFirstRevenue) {
      setAdvisorMessage(narrative.FIRST_REVENUE_MILESTONE);
      state.narrativeFlags.hasSeenFirstRevenue = true;
      return;
    }
    
    // Investment milestone tracking
    const totalSpent = state.narrativeFlags.totalInvestmentAmount;
    if (totalSpent >= 1000000 && !state.narrativeFlags.hasSeenInvestmentMilestone1M) {
      setAdvisorMessage(narrative.INVESTMENT_MILESTONE_1M);
      state.narrativeFlags.hasSeenInvestmentMilestone1M = true;
      return;
    }
    
    if (totalSpent >= 10000000 && !state.narrativeFlags.hasSeenInvestmentMilestone10M) {
      setAdvisorMessage(narrative.INVESTMENT_MILESTONE_10M);
      state.narrativeFlags.hasSeenInvestmentMilestone10M = true;
      return;
    }
    
    // Strategic balance advice (triggered when heavily imbalanced)
    const maxLevel = Math.max(state.levels.compute, state.levels.data, state.levels.algorithm);
    const minLevel = Math.min(state.levels.compute, state.levels.data, state.levels.algorithm);
    if (maxLevel - minLevel >= 3 && !state.narrativeFlags.hasSeenBalanceAdvice) {
      setAdvisorMessage(narrative.BALANCE_STRATEGY_ADVICE);
      state.narrativeFlags.hasSeenBalanceAdvice = true;
      return;
    }
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
    
    // ===== Update Era-based Revenue Availability First =====
    
    // Check if services should be available based on current era
    if (newState.currentEra >= Era.GNT3 && !newState.revenue.apiAvailable) {
      newState.revenue.apiAvailable = true;
      toast({
        title: "API Service Unlocked",
        description: "Your AI is now capable enough to offer limited API services to developers. You can enable this service in the Economy tab.",
        duration: 5000,
      });
    }
    
    if (newState.currentEra >= Era.GNT4 && !newState.revenue.chatbotAvailable) {
      newState.revenue.chatbotAvailable = true;
      toast({
        title: "Chatbot Service Unlocked",
        description: "Your AI is now capable enough to offer consumer chatbot services. You can enable this service in the Economy tab.",
        duration: 5000,
      });
    }
    
    // ===== Calculate Developer and Subscriber Growth =====
    
    // Only calculate if the appropriate services are available and enabled
    if (newState.revenue.apiAvailable && newState.revenue.apiEnabled) {
      // Developer growth is primarily driven by intelligence level
      // Formula models how developers are attracted to more capable AI APIs
      const intelligenceInfluence = Math.pow(newState.intelligence / 100, 1.2);
      const developerToolsEffect = 1 + (newState.revenue.developerToolsLevel * 0.05);
      
      // Base growth rate (starts small and accelerates with intelligence)
      if (timeElapsed % 5 === 0) { // Update every 5 seconds
        // Bootstrap initial developers if none yet
        if (newState.revenue.developers === 0) {
          // Initial developers based on intelligence (small number to start)
          const initialDevelopers = Math.max(5, Math.floor(newState.intelligence / 20));
          newState.revenue.developers = initialDevelopers;
          
          if (initialDevelopers > 0) {
            toast({
              title: "First Developers!",
              description: `Your API has attracted its first ${initialDevelopers} developers!`,
            });
          }
        } else {
          // Calculate growth rate for existing developer base
          const baseGrowthRate = 0.05 * intelligenceInfluence;
          const adjustedGrowthRate = baseGrowthRate * developerToolsEffect;
          
          // Store the growth rate for UI display
          newState.revenue.developerGrowthRate = adjustedGrowthRate;
          
          // Apply growth to developer count
          newState.revenue.developers = Math.floor(
            newState.revenue.developers * (1 + adjustedGrowthRate)
          );
        }
      }
    }
    
    // Subscriber growth (only if service is available and enabled)
    if (newState.revenue.chatbotAvailable && newState.revenue.chatbotEnabled) {
      // Update subscribers count (every 10 seconds = monthly)
      if (timeElapsed % 10 === 0 && timeElapsed > 0) {
        // Bootstrap initial subscribers if none yet
        if (newState.revenue.subscribers === 0) {
          // Initial subscribers based on intelligence (small number to start)
          const initialSubscribers = Math.max(50, Math.floor(newState.intelligence / 4));
          newState.revenue.subscribers = initialSubscribers;
          
          toast({
            title: "First Subscribers!",
            description: `Your chatbot service has attracted its first ${initialSubscribers} subscribers!`,
          });
        } else {
          // Intelligence & Data Quality impact on subscriber growth
          const intelligenceImpact = Math.pow(newState.intelligence / 150, 1.3);
          const dataQualityImpact = newState.dataInputs.quality * 0.1;
          
          // Base growth rate (scales with intelligence)
          const baseGrowthRate = 0.01 + (intelligenceImpact * 0.01);
          
          // Chatbot improvement bonus (5% more subscribers per level)
          const chatbotBonus = newState.revenue.chatbotImprovementLevel * 0.05;
          
          // Calculate total subscriber growth rate
          const totalGrowthRate = baseGrowthRate * (1 + dataQualityImpact) * (1 + chatbotBonus);
          
          // Store the growth rate for UI display
          newState.revenue.subscriberGrowthRate = totalGrowthRate;
          
          // Update subscriber count with growth
          newState.revenue.subscribers = Math.floor(
            newState.revenue.subscribers * (1 + totalGrowthRate)
          );
        }
      }
    }
    
    // ===== Calculate B2B Revenue Based on Developers =====
    
    // B2B Revenue: Companies paying to use your AI APIs
    // New formula: B2B Income = Developers × Base API Rate × (1 + Developer Tools Bonus)
    
    // Developer tools bonus: 5% per level
    const developerToolsBonus = newState.revenue.developerToolsLevel * 0.05;
    
    // Calculate revenue per developer (scales with API rate and tools)
    const revenuePerDeveloper = newState.revenue.baseApiRate * (1 + developerToolsBonus);
    
    // Calculate base B2B revenue before any penalties
    const potentialB2bRevenue = Math.floor(
      newState.revenue.developers * revenuePerDeveloper / 100 // Divide by 100 to scale appropriately
    );
    
    // ===== Calculate B2C Revenue Based on Subscribers =====
    
    // B2C Revenue: End-User Subscriptions
    // Formula: B2C Income = Subscribers × Monthly Fee
    
    // Calculate potential B2C revenue before any penalties
    const potentialB2cRevenue = Math.floor(
      newState.revenue.subscribers * newState.revenue.monthlyFee
    );
    
    // ===== Apply Compute Usage and Service Quality Penalties =====
    
    // Only consume compute if we have active services
    const hasActiveCustomers = newState.revenue.apiEnabled || 
                              (newState.revenue.chatbotEnabled && newState.revenue.subscribers > 0);
    
    if (hasActiveCustomers) {
      // Calculate initial compute demand based on potential customer usage
      const potentialB2bComputeUsage = newState.revenue.apiEnabled ? 
        Math.ceil((potentialB2bRevenue / 1000) * 5) : 0; // 5 compute per $1000 of B2B revenue
      
      const potentialB2cComputeUsage = newState.revenue.subscribers > 0 ? 
        Math.ceil(newState.revenue.subscribers * 0.01) : 0; // 0.01 compute per subscriber
      
      const potentialTotalComputeUsage = potentialB2bComputeUsage + potentialB2cComputeUsage;
      
      let serviceQualityRatio = 1.0; // Default: full quality
      
      // Check compute capacity thresholds based on potential usage
      const usageRatio = (newState.computeCapacity.used + potentialTotalComputeUsage) / newState.computeCapacity.maxCapacity;
      const isApproachingCapacity = usageRatio >= 0.9 && usageRatio < 0.95;
      const isCriticalCapacity = usageRatio >= 0.95;
      
      // Determine service quality degradation based on compute pressure
      if (isCriticalCapacity) {
        // Critical situation: 95%+ usage causes severe degradation
        // Scale from 0.7 (at 95% usage) down to 0.5 (at 100% usage)
        const criticalPressure = (usageRatio - 0.95) / 0.05; // 0 to 1 as we go from 95% to 100%
        serviceQualityRatio = Math.max(0.5, 0.7 - (0.2 * criticalPressure));
        
        // Notify about critical outages
        if (timeElapsed % 10 === 0) {
          toast({
            title: "CRITICAL SYSTEM OVERLOAD!",
            description: "Your services are experiencing major outages. Expect significant customer loss and revenue impact.",
            variant: "destructive",
            duration: 4000,
          });
        }
      }
      else if (isApproachingCapacity) {
        // High but not critical: 90-95% usage causes moderate degradation
        // Scale from 1.0 (at 90% usage) down to 0.7 (at 95% usage)
        const capacityPressure = (usageRatio - 0.9) / 0.05; // 0 to 1 as we go from 90% to 95%
        serviceQualityRatio = Math.max(0.7, 1 - (0.3 * capacityPressure));
        
        // Notify about service degradation
        if (timeElapsed % 10 === 0) {
          toast({
            title: "Compute System Under Pressure",
            description: "Your system is experiencing intermittent outages. Upgrade your compute capacity to avoid customer loss.",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
      
      // If we don't have enough compute for the potential demand, reduce service quality
      if (newState.computeCapacity.available < potentialTotalComputeUsage) {
        // Calculate how much compute we can actually provide compared to what's needed
        serviceQualityRatio = Math.min(serviceQualityRatio, newState.computeCapacity.available / potentialTotalComputeUsage);
        
        // Show a warning toast when service quality drops severely
        if (timeElapsed % 10 === 0) {
          toast({
            title: "Critical Compute Shortage!",
            description: "Your services are severely degraded due to compute shortage. Significant customer loss is expected.",
            variant: "destructive",
            duration: 3000,
          });
        }
        
        // Handle customer loss for severe outages (completely out of compute)
        if (timeElapsed % 10 === 0) {
          // Max 25% churn for zero compute outages
          const severeChurnRate = 0.25 * (1 - serviceQualityRatio);
          
          // Apply to subscribers
          if (newState.revenue.subscribers > 0) {
            const previousSubscribers = newState.revenue.subscribers;
            newState.revenue.subscribers = Math.floor(
              newState.revenue.subscribers * (1 - severeChurnRate)
            );
            
            const lostSubscribers = previousSubscribers - newState.revenue.subscribers;
            if (lostSubscribers > 10) {
              toast({
                title: "SEVERE: Mass User Exodus!",
                description: `${lostSubscribers} subscribers have abandoned your platform due to complete service failure.`,
                variant: "destructive",
                duration: 4000,
              });
            }
          }
          
          // Also lose some developers (B2B customers)
          if (newState.revenue.developers > 0) {
            const previousDevelopers = newState.revenue.developers;
            newState.revenue.developers = Math.floor(
              newState.revenue.developers * (1 - severeChurnRate * 0.8) // Developers are slightly more tolerant
            );
            
            const lostDevelopers = previousDevelopers - newState.revenue.developers;
            if (lostDevelopers > 5) {
              toast({
                title: "Developers Abandoning Platform!",
                description: `${lostDevelopers} developers have stopped using your API due to complete system failure.`,
                variant: "destructive",
                duration: 3000,
              });
            }
          }
        }
      }
      
      // Additional churn mechanics for high load and critical load scenarios
      if (timeElapsed % 10 === 0) {
        // Apply customer churn for warning (90-95%) and critical (95%+) load 
        if (isApproachingCapacity || isCriticalCapacity) {
          // Calculate churn rates based on severity
          const warningChurnRate = isApproachingCapacity ? 0.05 : 0; // 5% monthly churn at warning level
          const criticalChurnRate = isCriticalCapacity ? 0.15 : 0;   // 15% monthly churn at critical level
          const totalChurnRate = warningChurnRate + criticalChurnRate;
          
          // Apply to subscribers (B2C)
          if (newState.revenue.subscribers > 0 && totalChurnRate > 0) {
            const previousSubscribers = newState.revenue.subscribers;
            newState.revenue.subscribers = Math.floor(
              newState.revenue.subscribers * (1 - totalChurnRate)
            );
            
            const lostSubscribers = previousSubscribers - newState.revenue.subscribers;
            if (lostSubscribers > 10) {
              toast({
                title: isCriticalCapacity ? "Critical: Subscribers Leaving!" : "Warning: Some Subscribers Leaving",
                description: `${lostSubscribers} subscribers have left due to ${isCriticalCapacity ? "major" : "intermittent"} service outages.`,
                variant: "destructive",
                duration: 3000,
              });
            }
          }
          
          // Apply to developers (B2B) - they're slightly more tolerant
          if (newState.revenue.developers > 0 && totalChurnRate > 0) {
            const previousDevelopers = newState.revenue.developers;
            const b2bChurnRate = totalChurnRate * 0.8; // Developers are slightly more tolerant
            
            newState.revenue.developers = Math.floor(
              newState.revenue.developers * (1 - b2bChurnRate)
            );
            
            const lostDevelopers = previousDevelopers - newState.revenue.developers;
            if (lostDevelopers > 5) {
              toast({
                title: isCriticalCapacity ? "Developers Abandoning Platform!" : "Some Developers Leaving",
                description: `${lostDevelopers} developers have reduced usage due to ${isCriticalCapacity ? "significant" : "minor"} reliability issues.`,
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
      
      // ***** FIX: Calculate actual compute usage based on final revenue *****
      const actualB2bComputeUsage = newState.revenue.apiEnabled ? 
        Math.ceil((newState.revenue.b2b / 1000) * 5) : 0; // 5 compute per $1000 of actual B2B revenue
      
      const actualB2cComputeUsage = newState.revenue.subscribers > 0 ? 
        Math.ceil(newState.revenue.subscribers * 0.01) : 0; // 0.01 compute per subscriber
      
      const actualTotalComputeUsage = actualB2bComputeUsage + actualB2cComputeUsage;
      
      // Track customer usage separately for UI display
      newState.computeCapacity.customerUsage = actualTotalComputeUsage;
      
      // Apply actual compute usage
      if (actualTotalComputeUsage > 0) {
        if (newState.computeCapacity.available >= actualTotalComputeUsage) {
          newState.computeCapacity.available -= actualTotalComputeUsage;
          newState.computeCapacity.used += actualTotalComputeUsage;
        } else {
          // Use all available compute
          const usedAmount = newState.computeCapacity.available;
          newState.computeCapacity.available = 0;
          newState.computeCapacity.used += usedAmount;
        }
      }
    } else {
      // No active customers, so zero revenue and usage
      newState.revenue.b2b = 0;
      newState.revenue.b2c = 0;
      newState.computeCapacity.customerUsage = 0;
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
        
        // Track total investment spending
        newState.narrativeFlags.totalInvestmentAmount += 100;
        
        // Also increase compute level for training prerequisites
        newState.levels.compute += 1;
        
        // Increase compute production based on money input
        newState.production.compute *= 1.1;
        
        // Improve cross-resource bonuses
        newState.bonuses.computeToData *= 1.05;
        newState.bonuses.computeToAlgorithm *= 1.05;
        newState.bonuses.computeToIntelligence *= 1.05;
        
        // Check for breakthroughs
        newState.breakthroughs = checkBreakthroughs(newState);
        
        return newState;
      });
      
      toast({
        title: "Infrastructure Upgraded",
        description: "Your AI's compute level has increased, helping meet training prerequisites!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: "You need at least $100 to improve compute infrastructure.",
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
        
        // Track total investment spending
        newState.narrativeFlags.totalInvestmentAmount += 75;
        
        // *** ADD THIS LINE ***
        // This brings the Data resource in line with Compute and Algorithm,
        // ensuring that investing in data quality also increases the overall data level.
        newState.levels.data += 1;
        
        // Increase data production based on quality improvements
        newState.production.data *= 1.1;
        
        // Improve cross-resource bonuses
        newState.bonuses.dataToCompute *= 1.05;
        newState.bonuses.dataToAlgorithm *= 1.05;
        newState.bonuses.dataToIntelligence *= 1.05;
        
        // Check for breakthroughs
        newState.breakthroughs = checkBreakthroughs(newState);
        
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
    const baseCost = 125;
    const currentLevel = gameState.algorithmInputs.architectures;
    // Cost increases with each level of engineers hired
    const scaledCost = Math.floor(baseCost * (1 + (currentLevel * 0.1))); 
    
    if (gameState.money >= scaledCost) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= scaledCost;
        newState.algorithmInputs.architectures += 1;
        
        // Track total investment spending
        newState.narrativeFlags.totalInvestmentAmount += scaledCost;
        
        // Increase algorithm production based on architecture improvements
        newState.production.algorithm *= 1.15;
        
        // Research rate bonus from better engineers
        // This directly impacts the research progress calculation in the game loop
        
        // Also increase algorithm level for training prerequisites
        newState.levels.algorithm += 1;
        
        // Improve cross-resource bonuses
        newState.bonuses.algorithmToCompute *= 1.05;
        newState.bonuses.algorithmToData *= 1.05;
        newState.bonuses.algorithmToIntelligence *= 1.07; // Algorithms have slightly more impact on intelligence
        
        // Check for breakthroughs
        newState.breakthroughs = checkBreakthroughs(newState);
        
        return newState;
      });
      
      toast({
        title: "Hired Better AI Research Engineers",
        description: "Your enhanced research team will improve algorithm development speed and unlock new model architectures!",
      });
    } else {
      toast({
        title: "Not enough money",
        description: `You need at least $${scaledCost} to hire better research engineers.`,
        variant: "destructive",
      });
    }
  };
  
  // Function to hire a research engineer
  const hireResearchEngineer = () => {
    const engineerCost = 250; // Cost to hire one engineer
    
    if (gameState.money >= engineerCost) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= engineerCost;
        
        // Increment research engineers count
        newState.algorithmInputs.researchEngineers = (newState.algorithmInputs.researchEngineers || 0) + 1;
        
        // Each engineer increases algorithm research rate by 0.5 per day
        newState.training.algorithmResearchRate += 0.5;
        
        return newState;
      });
      
      toast({
        title: "Research Engineer Hired",
        description: "A new engineer has joined your research team! Algorithm research will progress faster.",
      });
    } else {
      toast({
        title: "Not enough money",
        description: `You need $${engineerCost} to hire a research engineer.`,
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
          
          // Check and process investment milestones
          checkInvestmentMilestones(newState);
          
          // Check for strategic warnings and contextual hints
          checkStrategicWarnings(newState);
          
          // Check tutorial progression
          checkTutorialProgression(newState);
          
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
          
          // Handle active training runs
          if (newState.training.active && newState.training.daysRemaining > 0) {
            // Decrement the days remaining
            newState.training.daysRemaining -= 1;
            
            // Find the current active training run
            const activeEra = getNextEra(newState.currentEra);
            
            // Skip if we're in final era or if the next era doesn't have a training run
            if (newState.currentEra === Era.GNT7 || !(activeEra in newState.training.runs)) {
              newState.training.active = false;
              newState.training.daysRemaining = 0;
              return newState;
            }
            
            const activeTrainingRun = Object.prototype.hasOwnProperty.call(newState.training.runs, activeEra) ?
              newState.training.runs[activeEra as keyof typeof newState.training.runs] : undefined;
            
            // Skip processing if no active training run exists for this era
            if (!activeTrainingRun) {
              newState.training.active = false;
              newState.training.daysRemaining = 0;
              return newState;
            }
            
            // Check if the training run is in progress
            // The activeTrainingRun should always exist at this point due to our previous checks
            if (activeTrainingRun.status === TrainingStatus.IN_PROGRESS) {
              // Also update the days remaining on the specific training run
              activeTrainingRun.daysRemaining -= 1;
              
              // Check if the training run is complete
              if (newState.training.daysRemaining <= 0) {
                // Mark the run as complete
                activeTrainingRun.status = TrainingStatus.COMPLETE;
                activeTrainingRun.isTrainingReserveActive = false;
                activeTrainingRun.daysRemaining = 0; // Ensure days remaining is exactly 0
                
                // Release the reserved compute
                newState.computeCapacity.used = Math.max(0, newState.computeCapacity.used - newState.training.computeReserved);
                newState.training.computeReserved = 0;
                
                // Apply intelligence boost
                newState.intelligence += activeTrainingRun.intelligenceGain;
                
                // Reset the active training flag
                newState.training.active = false;
                newState.training.daysRemaining = 0; // Ensure global training days is also 0
                
                // Advance to the next era
                newState.currentEra = activeEra;
                
                // Apply era-specific bonuses
                // This calls the same function we use when manually advancing eras
                advanceToNextEra(newState, activeEra);
                
                // Show completion message
                toast({
                  title: `${activeTrainingRun.name} Complete!`,
                  description: `Your AI has advanced to ${activeEra} era, gaining ${activeTrainingRun.intelligenceGain} intelligence!`,
                  duration: 8000,
                });
              }
            }
          } else {
            // If no active training, progress algorithm research
            // Free compute (not used by customers or training) directly contributes to research progress
            
            // Calculate three-way compute allocation:
            // 1. Customer Usage - B2B/B2C services (already calculated earlier in the game loop)
            const customerComputeUsage = newState.computeCapacity.customerUsage || 0;
            
            // 2. Training Usage - Reserved for active training runs
            const trainingComputeUsage = newState.training.computeReserved;
            
            // 3. Free Compute - Available for research (total available minus what customers are using)
            // Compute not being used by customers or training automatically contributes to research
            const freeCompute = Math.max(0, 
               newState.computeCapacity.available - customerComputeUsage - trainingComputeUsage
            );
            
            // Store the free compute value for UI display
            newState.computeCapacity.freeCompute = freeCompute;
            
            // Free compute provides a direct boost to research, with diminishing returns
            // Higher algorithm architectures investment increases efficiency
            const architectureMultiplier = 1 + (newState.algorithmInputs.architectures * 0.1); // 10% boost per architecture level
            const computeEfficiency = Math.log10(freeCompute + 1) * 0.5; // Logarithmic scaling for free compute (increased from 0.2 to 0.5)
            
            // *** ADD a bonus for hired engineers ***
            const engineerBonus = (newState.algorithmInputs.researchEngineers || 0) * 0.25; // Each engineer adds a flat 0.25 to the rate
            
            // Calculate new research rate:
            // Base rate + engineer bonus + (compute efficiency * architecture multiplier)
            newState.training.algorithmResearchRate = Math.max( 
              0.1, // Minimum base rate even with no compute
              0.5 + engineerBonus + (computeEfficiency * architectureMultiplier) // Add the engineer bonus here
            );
            
            // Apply the research rate to progress
            newState.training.algorithmResearchProgress = Math.min(
              100, // Cap at 100%
              newState.training.algorithmResearchProgress + newState.training.algorithmResearchRate
            );
            
            // If we've reached 100% research, check if we can unlock the next training run
            if (newState.training.algorithmResearchProgress >= 100) {
              const nextEra = getNextEra(newState.currentEra);
              
              // Handle special case for GNT-7 (final era) - no further training runs
              if (newState.currentEra === Era.GNT7) {
                // Already at final era, no next training run
                return newState;
              }
              
              // Skip if next era run doesn't exist
              if (!Object.prototype.hasOwnProperty.call(newState.training.runs, nextEra)) {
                return newState;
              }
              
              const nextTrainingRun = newState.training.runs[nextEra as keyof typeof newState.training.runs];
              
              if (nextTrainingRun && nextTrainingRun.status === TrainingStatus.LOCKED) {
                // Check if other prerequisites are met
                let allPrereqsMet = true;
                
                if (newState.levels.compute < nextTrainingRun.prerequisites.compute) allPrereqsMet = false;
                if (newState.dataInputs.quality < nextTrainingRun.prerequisites.data.quality) allPrereqsMet = false;
                if (newState.dataInputs.quantity < nextTrainingRun.prerequisites.data.quantity) allPrereqsMet = false;
                if (newState.dataInputs.formats < nextTrainingRun.prerequisites.data.formats) allPrereqsMet = false;
                if (newState.algorithmInputs.architectures < nextTrainingRun.prerequisites.algorithm.architectures) allPrereqsMet = false;
                if (newState.computeInputs.electricity < nextTrainingRun.prerequisites.computeInputs.electricity) allPrereqsMet = false;
                if (newState.computeInputs.hardware < nextTrainingRun.prerequisites.computeInputs.hardware) allPrereqsMet = false;
                if (newState.computeInputs.regulation < nextTrainingRun.prerequisites.computeInputs.regulation) allPrereqsMet = false;
                
                if (allPrereqsMet) {
                  // Unlock the training run
                  nextTrainingRun.status = TrainingStatus.AVAILABLE;
                  
                  // Notify the player
                  toast({
                    title: "Training Unlocked!",
                    description: `Your AI is ready for the ${nextTrainingRun.name}. Start the training in the Compute panel!`,
                    duration: 5000,
                  });
                }
              }
            }
          }
          
          // Gradually reduce used compute over time (simulates jobs completing)
          if (newState.computeCapacity.used > 0 && !newState.training.active) {
            // Reduce used compute by 1% per tick, but only for non-training compute
            const computeRecovery = Math.ceil((newState.computeCapacity.used - newState.training.computeReserved) * 0.01);
            newState.computeCapacity.used = Math.max(newState.training.computeReserved, 
              newState.computeCapacity.used - computeRecovery);
          }
          
          // As money is invested in compute and hardware improves, max capacity increases
          // NEW, MORE BALANCED FORMULA: provides stronger, compounding growth that can keep pace
          // with the 10x training requirement.
          if (timeElapsed % 10 === 0) { // Update max capacity every 10 seconds
            const baseCapacity = 2000;
            const computeLevelBonus = newState.levels.compute * 1000;
            const hardwareLevelBonus = newState.computeInputs.hardware * 500;
            const electricityBonus = 1 + (newState.computeInputs.electricity * 0.1); // 10% bonus per level
            
            newState.computeCapacity.maxCapacity = Math.floor(
              (baseCapacity + computeLevelBonus + hardwareLevelBonus) * electricityBonus
            );
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
    // Get current cost from game state
    const toolUpgradeCost = gameState.revenue.developerToolsCost;
    
    if (gameState.money >= toolUpgradeCost) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= toolUpgradeCost;
        newState.revenue.developerToolsLevel += 1;
        
        // Increasing developer tools gives +5% permanent bonus to B2B revenue
        // This is already handled in the calculateRevenue function
        
        // Increase cost for next upgrade
        newState.revenue.developerToolsCost = Math.round(newState.revenue.developerToolsCost * 2);
        
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
    // Get current cost from game state
    const chatbotUpgradeCost = gameState.revenue.chatbotImprovementCost;
    
    if (gameState.money >= chatbotUpgradeCost) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= chatbotUpgradeCost;
        newState.revenue.chatbotImprovementLevel += 1;
        
        // Increasing chatbot capabilities gives +5% permanent bonus to subscriber growth
        // This is already handled in the calculateRevenue function
        
        // Increase cost for next upgrade
        newState.revenue.chatbotImprovementCost = Math.round(newState.revenue.chatbotImprovementCost * 2.5);
        
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
    // Get current cost from game state
    const adCampaignCost = gameState.revenue.marketingCampaignCost;
    
    // Intelligence-based subscriber gain
    const intelligenceMultiplier = Math.max(1, gameState.intelligence / 200);
    const subscribersGained = Math.round(1000 * intelligenceMultiplier);
    
    if (gameState.money >= adCampaignCost) {
      setGameState(prevState => {
        const newState = { ...prevState };
        newState.money -= adCampaignCost;
        newState.revenue.subscribers += subscribersGained;
        
        // Record last campaign time
        newState.revenue.lastMarketingCampaign = timeElapsed;
        
        // Increase cost for next campaign
        newState.revenue.marketingCampaignCost = Math.round(newState.revenue.marketingCampaignCost * 1.5);
        
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
    allocateMoneyToDataQuality: allocateMoneyToData, // Reusing existing function for quality
    allocateMoneyToDataQuantity,
    allocateMoneyToDataFormats,
    // Detailed algorithm inputs
    allocateMoneyToAlgorithmArchitectures: allocateMoneyToAlgorithm, // Reusing existing function for architectures
    hireResearchEngineer, // Function to hire research engineers for algorithm research
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
