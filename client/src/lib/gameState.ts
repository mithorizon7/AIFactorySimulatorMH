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

export interface GameStateType {
  isRunning: boolean;
  timeElapsed: number;
  
  // Core Metrics
  money: number;
  intelligence: number; // Renamed from smartnessScore to better reflect AGI goal
  
  // Game Era/Phase Tracking
  currentEra: Era;       // Current game era/phase (GPT-2, GPT-3, etc.)
  daysElapsed: number;   // Game time tracking for events
  
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
  };
  
  // Revenue Streams
  revenue: {
    b2b: number;           // API usage by developers
    b2c: number;           // Monthly subscriptions
    investors: number;     // Funding from investors
  };
  
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
  
  // Costs of investing in primary resource capabilities
  investCosts: {
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
  
  // AGI Victory Threshold
  agiThreshold: number; // Intelligence score needed to win
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

export const initialGameState: GameStateType = {
  isRunning: false,
  timeElapsed: 0, // Counting up from 0 seconds
  
  // Core metrics
  money: 1000, // Starting capital
  intelligence: 100, // Intelligence score (AGI progress metric)
  
  // Game Era/Phase Tracking
  currentEra: Era.GNT2, // Start in GNT-2 era
  daysElapsed: 0,       // No time elapsed yet
  
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
    architectures: 1 // Initial architecture sophistication
  },
  
  // Revenue streams
  revenue: {
    b2b: 0,        // Initial B2B API revenue
    b2c: 0,        // Initial B2C subscription revenue
    investors: 0   // Initial investor funding
  },
  
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
  
  // Investment costs for primary resources
  investCosts: {
    compute: 100,
    data: 80,
    algorithm: 120
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
        magnitude: 25 // 25% reduction in compute production
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
    }
  ],
  
  // Current goal
  currentGoal: {
    id: 1,
    progress: 0
  },
  
  // AGI victory threshold
  agiThreshold: 1000 // Intelligence needed to achieve AGI
};
