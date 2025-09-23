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
  private leaderboardEntries: LeaderboardEntry[];
  currentId: number;
  currentGameStateId: number;

  constructor() {
    this.users = new Map();
    this.gameStates = new Map();
    this.leaderboardEntries = [];
    this.currentId = 1;
    this.currentGameStateId = 1;
    this.breakthroughs = [
      {
        id: 1,
        name: "Transformer Architecture Discovery",
        description: "Revolutionary self-attention mechanism discovered! Your AI can now understand context much better than previous RNN-based models.",
        unlocked: false,
        requiredLevels: { algorithm: 4, compute: 3, data: 3 },
        type: "algorithm",
        realWorldParallel: "2017's 'Attention Is All You Need' paper introduced the Transformer architecture, enabling models like BERT and GPT.",
        gameEffect: "15% improvement in all AI model efficiency. Unlocks path to large language models.",
        contributingFactors: "Advanced algorithm research combined with sufficient compute to test new architectures."
      },
      {
        id: 2,
        name: "Large-Scale Language Modeling",
        description: "Breakthrough in scaling! Your AI can now generate surprisingly coherent text by learning from massive datasets.",
        unlocked: false,
        requiredLevels: { compute: 6, data: 5, algorithm: 5 },
        type: "compute",
        realWorldParallel: "GPT-2 (2019) demonstrated that scaling up transformer models leads to emergent capabilities in language generation.",
        gameEffect: "Unlocks B2B API services. +25% revenue from text generation services.",
        contributingFactors: "Massive compute scaling combined with internet-scale text data and transformer architectures."
      },
      {
        id: 3,
        name: "Few-Shot Learning Emergence",
        description: "Amazing! Your AI can now learn new tasks from just a few examples without retraining - an emergent capability from scale.",
        unlocked: false,
        requiredLevels: { compute: 8, data: 7, algorithm: 6 },
        type: "combined",
        realWorldParallel: "GPT-3 (2020) showed that sufficiently large models develop few-shot learning abilities, revolutionizing AI applications.",
        gameEffect: "Unlocks advanced API pricing tiers. +40% B2B revenue. Reduces training costs by 20%.",
        contributingFactors: "Massive scale in all three factors: 175B parameters, 300B+ tokens of high-quality data, and refined transformer architectures."
      },
      {
        id: 4,
        name: "Code Generation Mastery",
        description: "Your AI can now write, debug, and explain code! This opens entirely new market opportunities in software development.",
        unlocked: false,
        requiredLevels: { data: 8, algorithm: 7, compute: 7 },
        type: "data",
        realWorldParallel: "GitHub Copilot (2021) and Codex showed how specialized training on code repositories enables AI programming assistance.",
        gameEffect: "Unlocks developer tools market. +60% B2B revenue. New subscription tier for developers.",
        contributingFactors: "Specialized high-quality code datasets combined with refined training techniques and sufficient compute for code-specific fine-tuning."
      },
      {
        id: 5,
        name: "Human Feedback Integration",
        description: "Revolutionary training method! Your AI now learns from human preferences, making it much more helpful and aligned with user intentions.",
        unlocked: false,
        requiredLevels: { algorithm: 9, data: 8, compute: 8 },
        type: "algorithm",
        realWorldParallel: "RLHF (Reinforcement Learning from Human Feedback) used in ChatGPT made AI assistants dramatically more useful and safer.",
        gameEffect: "Unlocks consumer chatbot services. +100% B2C revenue. Reduces harmful outputs by 80%.",
        contributingFactors: "Novel RLHF algorithms combined with high-quality human preference data and substantial compute for reinforcement learning."
      },
      {
        id: 6,
        name: "Multimodal Understanding",
        description: "Breakthrough integration! Your AI can now seamlessly process and understand text, images, and even audio together.",
        unlocked: false,
        requiredLevels: { compute: 10, data: 10, algorithm: 9 },
        type: "compute",
        realWorldParallel: "GPT-4 Vision and similar multimodal models require massive compute to process different data modalities simultaneously.",
        gameEffect: "Unlocks multimodal API services. +80% revenue across all segments. New enterprise markets.",
        contributingFactors: "Massive compute scaling for multimodal training, diverse high-quality datasets across modalities, and advanced architecture integration."
      },
      {
        id: 7,
        name: "Advanced Reasoning Capabilities",
        description: "Your AI can now perform complex multi-step reasoning, solve challenging problems, and even discover new solutions independently.",
        unlocked: false,
        requiredLevels: { algorithm: 11, compute: 10, data: 9 },
        type: "algorithm",
        realWorldParallel: "Models like o1 (2024) use advanced reasoning techniques and chain-of-thought to solve complex mathematical and scientific problems.",
        gameEffect: "Unlocks scientific research applications. +150% premium service revenue. New enterprise consulting tier.",
        contributingFactors: "Breakthrough reasoning algorithms combined with specialized training on problem-solving data and massive inference compute."
      },
      {
        id: 8,
        name: "Autonomous Agent Systems",
        description: "Ultimate breakthrough! Your AI can now operate independently, using tools, making decisions, and completing complex multi-step tasks.",
        unlocked: false,
        requiredLevels: { compute: 12, algorithm: 12, data: 11 },
        type: "combined",
        realWorldParallel: "Future autonomous AI agents that can operate independently, similar to advanced versions of AutoGPT or emerging agentic systems.",
        gameEffect: "Unlocks autonomous service offerings. +300% total revenue. Path to artificial general intelligence.",
        contributingFactors: "Perfect synthesis of massive compute infrastructure, sophisticated multi-agent algorithms, and comprehensive real-world interaction data."
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

  // Leaderboard operations - MemStorage versions with actual persistence
  async saveLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const newEntry: LeaderboardEntry = {
      id: this.currentId++,
      ...entry,
      createdAt: new Date().toISOString()
    };
    
    // Actually store the entry in memory
    this.leaderboardEntries.push(newEntry);
    return newEntry;
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    // Sort by performance: highest intelligence first, then fastest time, then highest peak money
    return this.leaderboardEntries
      .sort((a, b) => {
        // Primary sort: highest intelligence first
        if (b.finalIntelligence !== a.finalIntelligence) {
          return b.finalIntelligence - a.finalIntelligence;
        }
        // Tie breaker: fastest time (lowest totalTimeElapsed)
        if (a.totalTimeElapsed !== b.totalTimeElapsed) {
          return a.totalTimeElapsed - b.totalTimeElapsed;
        }
        // Final tie breaker: highest peak money
        return b.peakMoney - a.peakMoney;
      })
      .slice(0, limit);
  }

  async getPlayerRanking(finalIntelligence: number): Promise<{ rank: number; total: number; percentile: number }> {
    const total = this.leaderboardEntries.length;
    if (total === 0) {
      return { rank: 1, total: 1, percentile: 100 };
    }

    // Count players with better performance than the given intelligence
    const playersAhead = this.leaderboardEntries.filter(entry => {
      return entry.finalIntelligence > finalIntelligence;
    }).length;

    const rank = playersAhead + 1;
    const percentile = Math.round(((total - rank + 1) / total) * 100);
    
    return { rank, total, percentile };
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
