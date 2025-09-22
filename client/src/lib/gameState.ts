// Era definition for phase-based progression
// GNT = Generative Neural Transformer
export enum Era {
  GNT2 = "GNT-2",    // Early Phase (~2019)
  GNT3 = "GNT-3",    // Mid Phase I (~2020-2021)
  GNT4 = "GNT-4",    // Mid Phase II (~2022-2023)
  GNT5 = "GNT-5",    // Late Phase I (Near Future)
  GNT6 = "GNT-6",    // Late Phase II (Future)
  GNT7 = "GNT-7"     // Final Phase (AGI Threshold)
}

// Training run states
export enum TrainingStatus {
  AVAILABLE = "available", // Prerequisites met, can start training
  IN_PROGRESS = "in-progress", // Training is actively running
  COMPLETE = "complete", // Training has finished for this era
  LOCKED = "locked" // Prerequisites not met for starting training
}

// Game events that can occur during gameplay 
export interface GameEvent {
  id: number;
  title: string;
  description: string;
  triggered: boolean;
  era: Era;           // Era during which this event can occur
  effect: {
    type: 'compute' | 'data' | 'algorithm' | 'money' | 'regulation' | 'hardware' | 'multiple';
    impact: 'positive' | 'negative' | 'mixed';
    magnitude: number; // Percentage or absolute impact
  };
  realWorldContext: string; // Educational tie-in
}

// Investment milestones representing different funding rounds
export interface InvestmentMilestone {
  id: number;
  name: string;           // Name of the funding round (e.g., "Seed", "Series A")
  requiredIntelligence: number; // Intelligence threshold to unlock
  funding: number;        // Amount of money provided
  unlocked: boolean;      // Whether this milestone has been reached
  era: Era;               // Era associated with this milestone
  description: string;    // Description of the milestone
  realWorldParallel: string; // Educational tie-in
}

export interface GameStateType {
  isRunning: boolean;
  timeElapsed: number;
  
  // Core Metrics
  money: number;
  intelligence: number; // Renamed from smartnessScore to better reflect AGI goal
  
  // Game Era/Phase Tracking
  currentEra: Era;       // Current game era/phase (GPT-2, GPT-3, etc.)
  daysElapsed: number;   // Game time tracking for events
  
  // Training Run System - Central to game progression
  training: {
    // Currently active training run (if any)
    active: boolean;          // Whether a training run is currently in progress
    daysRemaining: number;    // Days remaining until training completion
    computeReserved: number;  // Compute currently reserved for training
    
    // Current training progress toward next era
    algorithmResearchProgress: number; // Progress toward research needed for next training run (0-100)
    algorithmResearchRate: number;     // Current rate of algorithm research progress
    
    // Per-era training runs
    runs: {
      [Era.GNT3]: TrainingRun;  // Training run to advance from GNT-2 to GNT-3
      [Era.GNT4]: TrainingRun;  // Training run to advance from GNT-3 to GNT-4
      [Era.GNT5]: TrainingRun;  // Training run to advance from GNT-4 to GNT-5
      [Era.GNT6]: TrainingRun;  // Training run to advance from GNT-5 to GNT-6
      [Era.GNT7]: TrainingRun;  // Training run to advance from GNT-6 to GNT-7
    };
  };
  
  // Primary Resources
  resources: {
    compute: number;
    data: number;
    algorithm: number;
  };
  
  // Resource Production Rates
  production: {
    compute: number;
    data: number;
    algorithm: number;
  };
  
  // Resource Advancement Levels
  levels: {
    compute: number;
    data: number;
    algorithm: number;
  };
  
  // Compute Capacity and Usage Metrics
  computeCapacity: {
    available: number;     // Total compute capacity available
    used: number;          // Amount of compute currently being used
    maxCapacity: number;   // Maximum possible compute capacity
    freeCompute?: number;  // Compute available for research (not used by customers or training)
    customerUsage?: number; // Compute used specifically by customers (B2B/B2C)
  };
  
  // Enabling Inputs for Compute
  computeInputs: {
    money: number;         // Investment into compute infrastructure
    electricity: number;   // Power efficiency and availability
    hardware: number;      // Quality of hardware components
    regulation: number;    // Regulatory environment affecting compute access
  };
  
  // Enabling Inputs for Data
  dataInputs: {
    quality: number;       // Quality of collected data
    quantity: number;      // Amount of collected data
    formats: number;       // New data formats (text, image, audio, etc.)
  };
  
  // Enabling Inputs for Algorithms
  algorithmInputs: {
    architectures: number; // Breakthroughs in model architectures
    researchEngineers: number; // Research engineers hired to accelerate algorithm research
  };
  
  // Revenue Streams
  revenue: {
    b2b: number;           // API usage by developers
    b2c: number;           // Monthly subscriptions
    investors: number;     // Funding from investors
    
    // Era-based Revenue Availability
    apiAvailable: boolean;  // Whether API service is available yet (era-gated)
    chatbotAvailable: boolean; // Whether chatbot service is available yet (era-gated)
    
    // Revenue Service Status
    apiEnabled: boolean;   // Whether the company has activated API service (user choice)
    chatbotEnabled: boolean; // Whether the company has activated chatbot service (user choice)
    
    // Developer Growth Metrics (B2B)
    developers: number;      // Number of developers using the API
    developerGrowthRate: number; // Rate at which new developers join per update
    
    // B2B Revenue Fields
    baseApiRate: number;     // Base API rate for B2B calculations
    developerToolsLevel: number; // Level of developer tools (improves B2B revenue)
    developerToolsCost: number; // Cost to upgrade developer tools level
    
    // B2C Revenue Fields
    subscribers: number;     // Number of subscribers for B2C calculations
    subscriberGrowthRate: number; // Rate at which new subscribers join per update
    monthlyFee: number;      // Monthly fee per subscriber
    chatbotImprovementLevel: number; // Level of chatbot improvements (improves B2C revenue)
    chatbotImprovementCost: number; // Cost to upgrade chatbot quality level
    
    // Marketing Campaign Metrics
    marketingCampaignCost: number; // Cost of running a marketing campaign
    lastMarketingCampaign: number; // Timestamp of the last marketing campaign
  };
  
  // Investment Milestones/Funding Rounds
  investmentMilestones: InvestmentMilestone[];
  nextMilestoneId: number; // ID of the next milestone to be reached
  
  // Bonus Multipliers (cross-resource effects)
  bonuses: {
    computeToData: number;      // How compute affects data processing
    computeToAlgorithm: number; // How compute affects algorithm development
    computeToIntelligence: number; // How compute affects intelligence growth
    
    dataToCompute: number;      // How data quality affects compute efficiency
    dataToAlgorithm: number;    // How data affects algorithm effectiveness
    dataToIntelligence: number; // How data affects intelligence growth
    
    algorithmToCompute: number; // How algorithms optimize compute usage
    algorithmToData: number;    // How algorithms improve data utilization
    algorithmToIntelligence: number; // How algorithms affect intelligence growth
  };
  
  // Costs of upgrading primary resources
  upgradeCosts: {
    compute: number;
    data: number;
    algorithm: number;
  };
  

  
  // AI Breakthroughs
  breakthroughs: Breakthrough[];
  
  // Game Events
  events: GameEvent[];
  
  // Current Goal
  currentGoal: {
    id: number;
    progress: number;
  };
  
  // Narrative warning flags to prevent message spam
  narrativeFlags: {
    hasSeenComputeWarning: boolean;
    hasSeenLowFundsWarning: boolean;
    hasSeenFirstTraining: boolean;
    hasSeenFirstRevenue: boolean;
    hasSeenBalanceAdvice: boolean;
    hasSeenInvestmentMilestone1M: boolean;
    hasSeenInvestmentMilestone10M: boolean;
    totalInvestmentAmount: number; // Track total money spent
    // Fail-safe funding flags (one-time only)
    hasGrantedEarlyGrant: boolean;
    hasGranted20MinBoost: boolean;
    hasGrantedLateStageFunding: boolean;
    // Stuck detection flags for guidance
    hasSeenStuckNoMoney: boolean;
    hasSeenStuckNoRevenue: boolean;
    hasSeenStuckTrainingBlocked: boolean;
    hasSeenStuckNoBreakthroughs: boolean;
    // Stuck detection cooldown system
    lastStuckHintAt: number;
    lastStuckHintId: string;
    
    // Service unlock guidance flags
    shownApiServiceAvailable: boolean;
    shownChatbotServiceAvailable: boolean;
    shownApiOptimizationAdvice: boolean;
    shownChatbotOptimizationAdvice: boolean;
    
    // Auto-enabling guidance flags
    apiServiceUnlockedTime: number | null; // Timestamp when API service was unlocked
    hasOfferedApiAutoEnable: boolean; // Whether we've offered to auto-enable API service
  };
  
  // Interactive Tutorial System
  tutorial: {
    isActive: boolean;        // Whether tutorial is currently running
    phase: number;           // Current tutorial phase (1-4)
    step: number;            // Current tutorial step within phase
    isCompleted: boolean;    // Whether tutorial has been completed
    hasShownWelcome: boolean; // Whether welcome modal has been shown
    completedActions: string[]; // Track which tutorial actions user has completed
    currentTarget: string | null; // Current element being highlighted
  };
  
  // AGI Victory Threshold
  agiThreshold: number; // Intelligence score needed to win
  
  // Victory Statistics for Leaderboard and Summary
  victoryStats: {
    gameStartTime: number; // Timestamp when game started
    totalTimeElapsed: number; // Total time in seconds
    peakMoney: number; // Highest money amount achieved
    totalMoneyEarned: number; // Total money earned throughout game
    peakB2BSubscribers: number; // Highest B2B subscriber count
    peakB2CSubscribers: number; // Highest B2C subscriber count
    breakthroughsUnlocked: number; // Total breakthroughs achieved
    erasReached: number; // Highest era reached (starts at GNT-2 = 1)
    finalIntelligence: number; // Intelligence at victory
    strategiesUsed: string[]; // Key strategies player used
    hasAchievedAGI: boolean; // Whether player reached AGI
  };
}

export interface Breakthrough {
  id: number;
  name: string;
  description: string;
  unlocked: boolean;
  requiredLevels: {
    compute?: number;
    data?: number;
    algorithm?: number;
  };
  type: 'compute' | 'data' | 'algorithm' | 'combined';
  realWorldParallel: string;
  era?: Era; // Optional era association
}

// Training run model - a discrete training operation that advances the AI to the next era
export interface TrainingRun {
  targetEra: Era; // What era this training run is trying to reach
  status: TrainingStatus; // Current status of the training run
  daysRequired: number; // How many days the training takes to complete (30 by default)
  daysRemaining: number; // How many days remain until completion
  computeRequired: number; // How much compute is required/locked during training
  moneyCost: number; // Monetary cost required to start this training run
  computePerCustomer: number; // How much compute each customer uses
  isTrainingReserveActive: boolean; // Whether compute is currently reserved for this training
  
  // Completion bonus
  intelligenceGain: number; // Base intelligence gained on completion
  
  // Prerequisites for starting the training
  prerequisites: {
    compute: number; // Required compute capacity level
    data: {
      quality: number; // Required data quality level
      quantity: number; // Required data quantity level
      formats: number; // Required data formats level
    };
    algorithm: {
      architectures: number; // Required algorithm architecture level
      researchProgress: number; // Required research progress (0-100)
    };
    computeInputs: {
      electricity: number; // Required electricity level
      hardware: number; // Required hardware level
      regulation: number; // Required regulation level
    };
  };
  
  // Educational content
  name: string; // Name of this training run
  description: string; // Description of what this training run accomplishes
  realWorldParallel: string; // Educational context
}

export const initialGameState: GameStateType = {
  isRunning: false,
  timeElapsed: 0, // Counting up from 0 seconds
  
  // Core metrics
  money: 1000, // Starting capital
  intelligence: 100, // Intelligence score (AGI progress metric)
  
  // Game Era/Phase Tracking
  currentEra: Era.GNT2, // Start in GNT-2 era
  daysElapsed: 0,       // No time elapsed yet
  
  // Training Run System
  training: {
    // Current training run state
    active: false,
    daysRemaining: 0,
    computeReserved: 0,
    
    // Research progress toward the next training run
    algorithmResearchProgress: 0, // 0-100 scale
    algorithmResearchRate: 0.5, // Base rate: 0.5 points per day when not training
    
    // Per-era training runs
    runs: {
      // GNT-3 Training Run (advance from GNT-2 to GNT-3)
      [Era.GNT3]: {
        targetEra: Era.GNT3,
        status: TrainingStatus.LOCKED,
        daysRequired: 30, // 30-day training period
        daysRemaining: 30,
        computeRequired: 1000, // Base compute requirement for first era
        moneyCost: 25000, // Substantial investment required for first major training run
        computePerCustomer: 5, // Each B2B or B2C customer uses this much compute
        isTrainingReserveActive: false,
        
        // Intelligence gain on completion
        intelligenceGain: 100,
        
        // Prerequisites
        prerequisites: {
          compute: 2, // Required compute capacity level
          data: {
            quality: 2,
            quantity: 2,
            formats: 1
          },
          algorithm: {
            architectures: 2,
            researchProgress: 100 // Need full research progress
          },
          computeInputs: {
            electricity: 2,
            hardware: 1,
            regulation: 1
          }
        },
        
        // Educational content
        name: "GNT-3 Training Run",
        description: "Scale up your model to billions of parameters and implement few-shot learning capabilities.",
        realWorldParallel: "The leap from early LLMs to models with 175 billion parameters represented a quantum leap in capabilities."
      },
      
      // GNT-4 Training Run (advance from GNT-3 to GNT-4)
      [Era.GNT4]: {
        targetEra: Era.GNT4,
        status: TrainingStatus.LOCKED,
        daysRequired: 30,
        daysRemaining: 30,
        computeRequired: 10000, // 10x the GNT-3 requirement (1000 → 10,000)
        moneyCost: 100000, // 4x the GNT-3 cost - significant strategic investment
        computePerCustomer: 10,
        isTrainingReserveActive: false,
        
        intelligenceGain: 200,
        
        prerequisites: {
          compute: 4,
          data: {
            quality: 3,
            quantity: 3,
            formats: 2
          },
          algorithm: {
            architectures: 3,
            researchProgress: 100
          },
          computeInputs: {
            electricity: 3,
            hardware: 3,
            regulation: 2
          }
        },
        
        name: "GNT-4 Training Run",
        description: "Train a model that can follow instructions and handle multimodal inputs (text and images).",
        realWorldParallel: "The transition to instruction-tuned models and multimodal systems dramatically improved AI's usefulness."
      },
      
      // GNT-5 Training Run (advance from GNT-4 to GNT-5)
      [Era.GNT5]: {
        targetEra: Era.GNT5,
        status: TrainingStatus.LOCKED,
        daysRequired: 30,
        daysRemaining: 30,
        computeRequired: 100000, // 10x the GNT-4 requirement (10,000 → 100,000)
        moneyCost: 500000, // 5x the GNT-4 cost - major research investment
        computePerCustomer: 20,
        isTrainingReserveActive: false,
        
        intelligenceGain: 300,
        
        prerequisites: {
          compute: 6,
          data: {
            quality: 5,
            quantity: 5,
            formats: 3
          },
          algorithm: {
            architectures: 5,
            researchProgress: 100
          },
          computeInputs: {
            electricity: 4,
            hardware: 4,
            regulation: 3
          }
        },
        
        name: "GNT-5 Training Run",
        description: "Train a model with enhanced reasoning capabilities and self-improvement potential.",
        realWorldParallel: "Advanced reasoning and self-improvement capabilities represent the frontier of current AI research."
      },
      
      // GNT-6 Training Run (advance from GNT-5 to GNT-6)
      [Era.GNT6]: {
        targetEra: Era.GNT6,
        status: TrainingStatus.LOCKED,
        daysRequired: 30,
        daysRemaining: 30,
        computeRequired: 1000000, // 10x the GNT-5 requirement (100,000 → 1,000,000)
        moneyCost: 2000000, // 4x the GNT-5 cost - massive enterprise investment
        computePerCustomer: 40,
        isTrainingReserveActive: false,
        
        intelligenceGain: 400,
        
        prerequisites: {
          compute: 8,
          data: {
            quality: 7,
            quantity: 7,
            formats: 5
          },
          algorithm: {
            architectures: 7,
            researchProgress: 100
          },
          computeInputs: {
            electricity: 6,
            hardware: 6,
            regulation: 4
          }
        },
        
        name: "GNT-6 Training Run",
        description: "Train a model that can use external tools and APIs to solve complex problems.",
        realWorldParallel: "Advanced tool use represents a crucial step toward systems that can interface effectively with the digital world."
      },
      
      // GNT-7 Training Run (advance from GNT-6 to GNT-7)
      [Era.GNT7]: {
        targetEra: Era.GNT7,
        status: TrainingStatus.LOCKED,
        daysRequired: 30,
        daysRemaining: 30,
        computeRequired: 10000000, // 10x the GNT-6 requirement (1,000,000 → 10,000,000)
        moneyCost: 10000000, // 5x the GNT-6 cost - ultimate AGI investment
        computePerCustomer: 80,
        isTrainingReserveActive: false,
        
        intelligenceGain: 500,
        
        prerequisites: {
          compute: 10,
          data: {
            quality: 10,
            quantity: 10,
            formats: 7
          },
          algorithm: {
            architectures: 10,
            researchProgress: 100
          },
          computeInputs: {
            electricity: 8,
            hardware: 8,
            regulation: 6
          }
        },
        
        name: "GNT-7 Training Run",
        description: "The final training run to achieve Artificial General Intelligence with human-level capabilities across domains.",
        realWorldParallel: "AGI represents the theoretical culmination of AI research - a system with human-level capabilities across virtually all domains."
      }
    }
  },
  
  // Primary resources
  resources: {
    compute: 10,
    data: 10,
    algorithm: 5
  },
  
  // Production rates
  production: {
    compute: 1,
    data: 1,
    algorithm: 0.5
  },
  
  // Resource levels
  levels: {
    compute: 1,
    data: 1,
    algorithm: 1
  },

  // Compute capacity metrics
  computeCapacity: {
    available: 1000,     // Initial compute capacity
    used: 0,             // No compute used initially
    maxCapacity: 2000,   // Initial maximum capacity
    freeCompute: 1000,   // Initially all compute is free for research
    customerUsage: 0     // No customers using compute initially
  },
  
  // Enabling inputs for Compute
  computeInputs: {
    money: 1,      // Initial investment level
    electricity: 1, // Initial power efficiency
    hardware: 1,    // Initial hardware quality
    regulation: 1   // Initial regulatory environment
  },
  
  // Enabling inputs for Data
  dataInputs: {
    quality: 1,   // Initial data quality
    quantity: 1,  // Initial data quantity
    formats: 1    // Initial data formats available
  },
  
  // Enabling inputs for Algorithms
  algorithmInputs: {
    architectures: 1, // Initial architecture sophistication
    researchEngineers: 0  // Start with no research engineers
  },
  
  // Revenue streams
  revenue: {
    b2b: 0,        // Initial B2B API revenue
    b2c: 0,        // Initial B2C subscription revenue
    investors: 0,  // Initial investor funding
    
    // Era-based Revenue Availability (initially unavailable)
    apiAvailable: false,      // API service not available until GNT-3 era
    chatbotAvailable: false,  // Chatbot service not available until GNT-4 era
    
    // Revenue Service Status (user choices, both start disabled)
    apiEnabled: false,        // API service not enabled initially
    chatbotEnabled: false,    // Chatbot service not enabled initially
    
    // Developer Growth Metrics (B2B)
    developers: 0,            // Start with no developers
    developerGrowthRate: 0,   // Initial growth rate
    
    // B2B Revenue Fields
    baseApiRate: 1000,        // Base API rate for B2B calculations ($1K/week starting point)
    developerToolsLevel: 0,   // Level of developer tools (improves B2B revenue)
    developerToolsCost: 5000, // Initial cost to upgrade developer tools level
    
    // B2C Revenue Fields
    subscribers: 0,           // Start with no subscribers
    subscriberGrowthRate: 0,  // Initial growth rate
    monthlyFee: 10,           // $10 monthly fee per subscriber
    chatbotImprovementLevel: 0, // Level of chatbot improvements (improves B2C revenue)
    chatbotImprovementCost: 10000, // Initial cost to upgrade chatbot quality level
    
    // Marketing Campaign Metrics
    marketingCampaignCost: 10000, // Initial cost of running a marketing campaign
    lastMarketingCampaign: 0      // No marketing campaigns run initially
  },
  
  // Investment Milestones/Funding Rounds
  investmentMilestones: [
    {
      id: 1,
      name: "Seed Funding",
      requiredIntelligence: 0, // Already unlocked at start
      funding: 1000, // Initial $1,000 (already accounted for in starting money)
      unlocked: true,
      era: Era.GNT2,
      description: "Initial funding to begin AI research and development.",
      realWorldParallel: "Early AI research labs started with small seed investments to prove basic concepts."
    },
    {
      id: 2,
      name: "Series A",
      requiredIntelligence: 50, // Intelligence threshold for Series A
      funding: 5000, // $5,000 funding
      unlocked: false,
      era: Era.GNT3,
      description: "First major investment round as your AI shows promising capabilities.",
      realWorldParallel: "AI companies secure Series A funding when they demonstrate working prototypes with basic capabilities."
    },
    {
      id: 3,
      name: "Series B",
      requiredIntelligence: 200, // Intelligence threshold for Series B
      funding: 25000, // $25,000 funding
      unlocked: false,
      era: Era.GNT4,
      description: "Major investment as your AI demonstrates commercial potential.",
      realWorldParallel: "Series B typically comes when AI companies show product-market fit and early revenue streams."
    },
    {
      id: 4,
      name: "Series C",
      requiredIntelligence: 500, // Intelligence threshold for Series C
      funding: 100000, // $100,000 funding
      unlocked: false,
      era: Era.GNT5,
      description: "Massive investment round as your AI approaches transformative capabilities.",
      realWorldParallel: "Large AI companies secure hundreds of millions in Series C funding when they demonstrate transformative technology potential."
    },
    {
      id: 5,
      name: "Series D",
      requiredIntelligence: 800, // Intelligence threshold for Series D
      funding: 1000000, // $1,000,000 funding for expensive late-game
      unlocked: false,
      era: Era.GNT6,
      description: "Unprecedented investment as your AI approaches AGI-level capabilities.",
      realWorldParallel: "Only the most advanced AI companies reach Series D funding, with valuations exceeding $10 billion as they approach transformative AGI capabilities."
    }
  ],
  nextMilestoneId: 2, // Next milestone to reach is Series A (id: 2)
  
  // Cross-resource bonus multipliers (all start at 1.0 = no effect)
  bonuses: {
    computeToData: 1.0,
    computeToAlgorithm: 1.0,
    computeToIntelligence: 1.0,
    
    dataToCompute: 1.0,
    dataToAlgorithm: 1.0,
    dataToIntelligence: 1.0,
    
    algorithmToCompute: 1.0,
    algorithmToData: 1.0,
    algorithmToIntelligence: 1.0
  },
  
  // Upgrade costs for primary resources
  upgradeCosts: {
    compute: 50,
    data: 40,
    algorithm: 60
  },
  
  // Narrative warning flags to prevent message spam
  narrativeFlags: {
    hasSeenComputeWarning: false,
    hasSeenLowFundsWarning: false,
    hasSeenFirstTraining: false,
    hasSeenFirstRevenue: false,
    hasSeenBalanceAdvice: false,
    hasSeenInvestmentMilestone1M: false,
    hasSeenInvestmentMilestone10M: false,
    totalInvestmentAmount: 0,
    // Fail-safe funding flags (one-time only)
    hasGrantedEarlyGrant: false,
    hasGranted20MinBoost: false,
    hasGrantedLateStageFunding: false,
    // Stuck detection flags for guidance
    hasSeenStuckNoMoney: false,
    hasSeenStuckNoRevenue: false,
    hasSeenStuckTrainingBlocked: false,
    hasSeenStuckNoBreakthroughs: false,
    // Stuck detection cooldown system
    lastStuckHintAt: 0,
    lastStuckHintId: '',
    
    // Service unlock guidance flags
    shownApiServiceAvailable: false,
    shownChatbotServiceAvailable: false,
    shownApiOptimizationAdvice: false,
    shownChatbotOptimizationAdvice: false,
    
    // Auto-enabling guidance flags
    apiServiceUnlockedTime: null, // Timestamp when API service was unlocked
    hasOfferedApiAutoEnable: false // Whether we've offered to auto-enable API service
  },
  
  // Breakthroughs - Organized by AI eras
  breakthroughs: [
    // GNT-2 Era Breakthroughs (Early Phase)
    {
      id: 1,
      name: "Transformer Architecture",
      description: "Your AI now uses attention mechanisms to process sequences more effectively!",
      unlocked: false,
      requiredLevels: { algorithm: 2 },
      type: "algorithm",
      era: Era.GNT2,
      realWorldParallel: "The 2017 'Attention Is All You Need' paper introduced transformers, revolutionizing how models handle sequential data like text."
    },
    {
      id: 2,
      name: "Unsupervised Pre-training",
      description: "Your AI can now learn language patterns without explicit supervision!",
      unlocked: false,
      requiredLevels: { data: 2 },
      type: "data",
      era: Era.GNT2,
      realWorldParallel: "Early generative models were built on unsupervised pre-training on diverse internet text, allowing them to learn language patterns without labeled examples."
    },
    
    // GNT-3 Era Breakthroughs (Mid Phase I)
    {
      id: 3,
      name: "Massive Parameter Scaling",
      description: "Your AI can now scale to billions of parameters, dramatically increasing capabilities!",
      unlocked: false,
      requiredLevels: { compute: 3 },
      type: "compute",
      era: Era.GNT3,
      realWorldParallel: "The leap to 175 billion parameters in large language models demonstrated how scale could dramatically improve capabilities."
    },
    {
      id: 4,
      name: "Few-Shot Learning",
      description: "Your AI can now learn new tasks from just a few examples in its prompt!",
      unlocked: false,
      requiredLevels: { algorithm: 3, data: 3 },
      type: "combined",
      era: Era.GNT3,
      realWorldParallel: "Advanced language models demonstrated 'few-shot learning' where the model could perform new tasks given just a few examples in its prompt."
    },
    
    // GNT-4 Era Breakthroughs (Mid Phase II)
    {
      id: 5,
      name: "Instruction Tuning",
      description: "Your AI can now reliably follow human instructions and better align with user intentions!",
      unlocked: false,
      requiredLevels: { algorithm: 4 },
      type: "algorithm",
      era: Era.GNT4,
      realWorldParallel: "Instruction tuning demonstrated how fine-tuning on human instructions dramatically improves model usefulness and safety."
    },
    {
      id: 6,
      name: "Multimodal Integration",
      description: "Your AI can now process and understand both images and text together!",
      unlocked: false,
      requiredLevels: { compute: 4, data: 4 },
      type: "combined",
      era: Era.GNT4,
      realWorldParallel: "Multimodal AI systems can process both text and images simultaneously, opening up new applications and capabilities."
    },
    
    // GNT-5 Era Breakthroughs (Late Phase I - Near Future)
    {
      id: 7,
      name: "Advanced Reasoning",
      description: "Your AI can now break down complex problems into logical steps for better solutions!",
      unlocked: false,
      requiredLevels: { algorithm: 5, data: 5 },
      type: "combined",
      era: Era.GNT5,
      realWorldParallel: "Future AI systems are expected to have dramatically improved reasoning abilities, approaching human-like problem-solving."
    },
    {
      id: 8,
      name: "Self-Improvement Capabilities",
      description: "Your AI can now improve its own code and architecture!",
      unlocked: false,
      requiredLevels: { algorithm: 6 },
      type: "algorithm",
      era: Era.GNT5,
      realWorldParallel: "Advanced AI systems may eventually help optimize their own code, create more efficient algorithms, and improve their architecture."
    },
    
    // GNT-6 Era Breakthroughs (Late Phase II - Future)
    {
      id: 9,
      name: "Advanced Tool Use",
      description: "Your AI can effectively use multiple external tools and APIs to solve problems!",
      unlocked: false,
      requiredLevels: { algorithm: 7, compute: 6 },
      type: "combined",
      era: Era.GNT6,
      realWorldParallel: "Future AI systems will likely have sophisticated abilities to use external tools, APIs, and services to extend their capabilities."
    },
    
    // GNT-7 Era Breakthroughs (Final Phase - AGI Threshold)
    {
      id: 10,
      name: "General Problem Solving",
      description: "Your AI can now solve novel problems across domains without specific training!",
      unlocked: false,
      requiredLevels: { algorithm: 8, data: 7, compute: 7 },
      type: "combined",
      era: Era.GNT7,
      realWorldParallel: "True AGI would be capable of solving novel problems across domains without domain-specific training - a key threshold for artificial general intelligence."
    }
  ],
  
  // Game Events
  events: [
    {
      id: 1,
      title: "Transformer Architecture Breakthrough",
      description: "Researchers have developed a new architecture called 'transformers' that revolutionizes how AI processes sequences of data!",
      triggered: false,
      era: Era.GNT2,
      effect: {
        type: 'algorithm',
        impact: 'positive',
        magnitude: 15 // 15% boost to algorithm production
      },
      realWorldContext: "In 2017, the paper 'Attention Is All You Need' introduced transformers, which became the foundation for all modern language models."
    },
    {
      id: 2,
      title: "Large-Scale Web Scraping Initiative",
      description: "Your team has developed tools to rapidly collect training data from the web.",
      triggered: false,
      era: Era.GNT2,
      effect: {
        type: 'data',
        impact: 'positive',
        magnitude: 20 // 20% boost to data production
      },
      realWorldContext: "Early generative models were trained on vast amounts of web text, including data from Reddit, Wikipedia, and millions of websites."
    },
    {
      id: 3,
      title: "Scaling Laws Discovered",
      description: "Researchers have discovered mathematical relationships between model size, compute, and performance!",
      triggered: false,
      era: Era.GNT3,
      effect: {
        type: 'multiple',
        impact: 'positive',
        magnitude: 10 // 10% boost to compute and algorithm production
      },
      realWorldContext: "In 2020, researchers published scaling laws showing how AI performance improves predictably with scale."
    },
    {
      id: 4,
      title: "GPU Shortage Crisis",
      description: "A global chip shortage has made high-end GPUs scarce and expensive.",
      triggered: false,
      era: Era.GNT3,
      effect: {
        type: 'compute',
        impact: 'negative',
        magnitude: 15 // 15% reduction in compute production (reduced from 25% for better balance)
      },
      realWorldContext: "From 2020-2022, global chip shortages severely constrained GPU availability for AI research, significantly increasing costs and slowing progress."
    },
    {
      id: 5,
      title: "Instruction Tuning Breakthrough",
      description: "Your team has discovered techniques to make models follow instructions more reliably!",
      triggered: false,
      era: Era.GNT4,
      effect: {
        type: 'algorithm',
        impact: 'positive',
        magnitude: 30 // 30% boost to algorithm efficiency
      },
      realWorldContext: "Instruction tuning allowed AI models to follow human instructions more reliably, greatly improving their usefulness and safety."
    },
    {
      id: 6,
      title: "AI Regulation Bill Passes",
      description: "Government has implemented new regulations affecting AI development and deployment.",
      triggered: false,
      era: Era.GNT4,
      effect: {
        type: 'regulation',
        impact: 'mixed',
        magnitude: 15 // Initially negative, but can be mitigated with investment
      },
      realWorldContext: "Around 2022-2023, many countries began developing AI regulations to manage risks while fostering innovation."
    },
    {
      id: 7,
      title: "Multimodal Data Integration",
      description: "Your team can now process and align multiple types of data: text, images, audio!",
      triggered: false,
      era: Era.GNT5,
      effect: {
        type: 'data',
        impact: 'positive',
        magnitude: 40 // 40% boost to data effectiveness
      },
      realWorldContext: "Multimodal AI models combine different types of data, greatly expanding their capabilities beyond just text."
    },
    {
      id: 8,
      title: "Quantum Computing Milestone",
      description: "Access to early quantum computing resources enables unprecedented parallelization.",
      triggered: false,
      era: Era.GNT6,
      effect: {
        type: 'hardware',
        impact: 'positive',
        magnitude: 50 // 50% boost to hardware effectiveness
      },
      realWorldContext: "While still speculative, quantum computing may eventually provide massive speedups for certain AI workloads."
    },
    {
      id: 9,
      title: "Open Source AI Movement",
      description: "The community has released powerful open-source models, accelerating research and reducing costs!",
      triggered: false,
      era: Era.GNT3,
      effect: {
        type: 'algorithm',
        impact: 'positive',
        magnitude: 25 // 25% boost to algorithm research
      },
      realWorldContext: "Open source models like BERT, T5, and others democratized AI research and enabled rapid innovation."
    },
    {
      id: 10,
      title: "Cloud Computing Expansion",
      description: "Major cloud providers have expanded their AI infrastructure, making compute more accessible!",
      triggered: false,
      era: Era.GNT4,
      effect: {
        type: 'compute',
        impact: 'positive',
        magnitude: 20 // 20% boost to compute efficiency
      },
      realWorldContext: "The expansion of cloud AI services by providers like AWS, Google Cloud, and Azure made powerful compute resources more accessible."
    }
  ],
  
  // Current goal
  currentGoal: {
    id: 1,
    progress: 0
  },
  
  // Interactive Tutorial System
  tutorial: {
    isActive: true,         // Start with tutorial active for new players
    phase: 1,              // Start with first phase
    step: 1,               // Start with first step
    isCompleted: false,    // Tutorial not completed yet
    hasShownWelcome: false, // Welcome modal not shown yet
    completedActions: [],   // Track completed tutorial actions
    currentTarget: null     // Current highlighted element
  },
  
  // AGI victory threshold
  agiThreshold: 1000, // Intelligence needed to achieve AGI
  
  // Victory Statistics for Leaderboard and Summary
  victoryStats: {
    gameStartTime: 0, // Timestamp when game started
    totalTimeElapsed: 0, // Total time in seconds
    peakMoney: 0, // Highest money amount achieved
    totalMoneyEarned: 0, // Total money earned throughout game
    peakB2BSubscribers: 0, // Highest B2B subscriber count
    peakB2CSubscribers: 0, // Highest B2C subscriber count
    breakthroughsUnlocked: 0, // Total breakthroughs achieved
    erasReached: 1, // Highest era reached (starts at GNT-2 = 1)
    finalIntelligence: 0, // Intelligence at victory
    strategiesUsed: [], // Key strategies player used
    hasAchievedAGI: false // Whether player reached AGI
  }
};
