export interface GameStateType {
  isRunning: boolean;
  timer: number;
  
  // Core Metrics
  money: number;
  intelligence: number; // Renamed from smartnessScore to better reflect AGI goal
  
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
}

export const initialGameState: GameStateType = {
  isRunning: false,
  timer: 1200, // 20 minutes in seconds
  
  // Core metrics
  money: 1000, // Starting capital
  intelligence: 100, // Intelligence score (AGI progress metric)
  
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
  
  // Breakthroughs
  breakthroughs: [
    {
      id: 1,
      name: "Basic Language Understanding",
      description: "Your AI can now form coherent sentences by processing text examples!",
      unlocked: false,
      requiredLevels: { data: 2 },
      type: "data",
      realWorldParallel: "Just like how large language models like GPT learn to generate text by analyzing patterns in vast amounts of written data."
    },
    {
      id: 2,
      name: "Mathematical Problem Solving",
      description: "Your AI can now solve math problems by breaking them down into steps!",
      unlocked: false,
      requiredLevels: { algorithm: 2 },
      type: "algorithm",
      realWorldParallel: "Similar to how Chain-of-Thought prompting helps AI models reason through complex problems step by step."
    },
    {
      id: 3,
      name: "Image & Text Integration",
      description: "Your AI can now process and understand both images and text together!",
      unlocked: false,
      requiredLevels: { compute: 3 },
      type: "compute",
      realWorldParallel: "Just like multimodal models such as GPT-4 Vision that can process both text and images simultaneously thanks to increased computational resources."
    },
    {
      id: 4,
      name: "Advanced Reasoning",
      description: "Your AI can now handle complex logical reasoning tasks!",
      unlocked: false,
      requiredLevels: { algorithm: 3, data: 3 },
      type: "combined",
      realWorldParallel: "Similar to how modern AI systems combine high-quality reasoning datasets with sophisticated training methods to solve complex problems."
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
