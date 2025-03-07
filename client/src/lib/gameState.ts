export interface GameStateType {
  isRunning: boolean;
  timer: number;
  smartnessScore: number;
  
  resources: {
    compute: number;
    data: number;
    algorithm: number;
  };
  
  production: {
    compute: number;
    data: number;
    algorithm: number;
  };
  
  levels: {
    compute: number;
    data: number;
    algorithm: number;
  };
  
  upgradeCosts: {
    compute: number;
    data: number;
    algorithm: number;
  };
  
  investCosts: {
    compute: number;
    data: number;
    algorithm: number;
  };
  
  breakthroughs: Breakthrough[];
  
  currentGoal: {
    id: number;
    progress: number;
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
}

export const initialGameState: GameStateType = {
  isRunning: false,
  timer: 1200, // 20 minutes in seconds
  smartnessScore: 100,
  
  resources: {
    compute: 0,
    data: 0,
    algorithm: 0
  },
  
  production: {
    compute: 1,
    data: 1,
    algorithm: 0.5
  },
  
  levels: {
    compute: 1,
    data: 1,
    algorithm: 1
  },
  
  upgradeCosts: {
    compute: 50,
    data: 40,
    algorithm: 60
  },
  
  investCosts: {
    compute: 100,
    data: 80,
    algorithm: 120
  },
  
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
  
  currentGoal: {
    id: 1,
    progress: 0
  }
};
