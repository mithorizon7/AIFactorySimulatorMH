import { users, type User, type InsertUser, GameState, InsertGameState, leaderboard, type LeaderboardEntry, type InsertLeaderboardEntry } from "@shared/schema";
import { Breakthrough } from "../client/src/lib/gameState";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLatestGameState(): Promise<GameState | undefined>;
  saveGameState(gameState: InsertGameState): Promise<GameState>;
  getAllBreakthroughs(): Promise<Breakthrough[]>;
  // Leaderboard operations
  saveLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getPlayerRanking(finalIntelligence: number): Promise<{ rank: number; total: number; percentile: number }>;
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
      revenueB2B: gameState.revenueB2B || 0,
      revenueB2C: gameState.revenueB2C || 0,
      revenueInvestors: gameState.revenueInvestors || 0,
      id,
      createdAt: new Date().toISOString()
    };
    this.gameStates.set(id, normalizedGameState);
    return normalizedGameState;
  }

  async getAllBreakthroughs(): Promise<Breakthrough[]> {
    return this.breakthroughs;
  }

  // Leaderboard operations - MemStorage versions
  async saveLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const newEntry: LeaderboardEntry = {
      id: this.currentId++,
      ...entry,
      createdAt: new Date().toISOString()
    };
    
    // For MemStorage, we'll just store in memory
    // In real implementation, this would go to database
    return newEntry;
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    // Return empty array for MemStorage
    // In real implementation, this would query the database
    return [];
  }

  async getPlayerRanking(finalIntelligence: number): Promise<{ rank: number; total: number; percentile: number }> {
    // Return default ranking for MemStorage
    // In real implementation, this would calculate based on database
    return { rank: 1, total: 1, percentile: 100 };
  }
}

// Database implementation for leaderboard operations
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLatestGameState(): Promise<GameState | undefined> {
    // For now, return undefined as we're focusing on leaderboard
    return undefined;
  }

  async saveGameState(gameState: InsertGameState): Promise<GameState> {
    // For now, just return a mock response as we're focusing on leaderboard
    return { id: 1, ...gameState } as GameState;
  }

  async getAllBreakthroughs(): Promise<Breakthrough[]> {
    // Return empty array for now as we're focusing on leaderboard
    return [];
  }

  // Real database implementation for leaderboard
  async saveLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const [savedEntry] = await db
      .insert(leaderboard)
      .values({
        ...entry,
        createdAt: new Date().toISOString()
      })
      .returning();
    return savedEntry;
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    return await db
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.finalIntelligence), leaderboard.totalTimeElapsed)
      .limit(limit);
  }

  async getPlayerRanking(finalIntelligence: number): Promise<{ rank: number; total: number; percentile: number }> {
    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leaderboard);

    // Get rank (count of players with higher intelligence, or same intelligence but better time)
    const [{ count: playersAhead }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leaderboard)
      .where(sql`final_intelligence > ${finalIntelligence} OR (final_intelligence = ${finalIntelligence} AND total_time_elapsed < (SELECT total_time_elapsed FROM leaderboard WHERE final_intelligence = ${finalIntelligence} ORDER BY total_time_elapsed ASC LIMIT 1))`);

    const rank = playersAhead + 1;
    const percentile = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 100;

    return { rank, total, percentile };
  }
}

// Use DatabaseStorage for production, keep MemStorage as backup
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
