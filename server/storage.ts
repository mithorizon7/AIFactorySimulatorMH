import { users, type User, type InsertUser, GameState, InsertGameState } from "@shared/schema";
import { Breakthrough } from "../client/src/lib/gameState";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLatestGameState(): Promise<GameState | undefined>;
  saveGameState(gameState: InsertGameState): Promise<GameState>;
  getAllBreakthroughs(): Promise<Breakthrough[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameStates: Map<number, GameState>;
  private breakthroughs: Breakthrough[];
  currentId: number;
  currentGameStateId: number;

  constructor() {
    this.users = new Map();
    this.gameStates = new Map();
    this.currentId = 1;
    this.currentGameStateId = 1;
    this.breakthroughs = [
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
    ];
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLatestGameState(): Promise<GameState | undefined> {
    const gameStates = Array.from(this.gameStates.values());
    if (gameStates.length === 0) return undefined;
    
    // Sort by createdAt in descending order and return the most recent
    return gameStates.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })[0];
  }

  async saveGameState(gameState: InsertGameState): Promise<GameState> {
    const id = this.currentGameStateId++;
    // Ensure required fields are set with default values if not provided
    const normalizedGameState = {
      ...gameState,
      money: gameState.money || 1000, 
      userId: gameState.userId === undefined ? null : gameState.userId,
      id,
      createdAt: new Date().toISOString()
    };
    this.gameStates.set(id, normalizedGameState);
    return normalizedGameState;
  }

  async getAllBreakthroughs(): Promise<Breakthrough[]> {
    return this.breakthroughs;
  }
}

export const storage = new MemStorage();
