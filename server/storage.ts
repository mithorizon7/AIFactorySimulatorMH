import { users, gameStates, type User, type InsertUser, GameState, InsertGameState, leaderboard, type LeaderboardEntry, type InsertLeaderboardEntry } from "@shared/schema";
import { Breakthrough, initialGameState } from "../client/src/lib/gameState";

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
    this.breakthroughs = initialGameState.breakthroughs.map(breakthrough => ({
      ...breakthrough,
      requiredLevels: { ...breakthrough.requiredLevels }
    }));
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
      money: gameState.money ?? 1000, 
      userId: gameState.userId === undefined ? null : gameState.userId,
      revenueB2B: gameState.revenueB2B ?? 0,
      revenueB2C: gameState.revenueB2C ?? 0,
      revenueInvestors: gameState.revenueInvestors ?? 0,
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

function requireDatabase() {
  if (!db) {
    throw new Error("Database storage requested without DATABASE_URL configured.");
  }

  return db;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await requireDatabase().select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await requireDatabase().select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await requireDatabase()
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLatestGameState(): Promise<GameState | undefined> {
    const [gameState] = await requireDatabase()
      .select()
      .from(gameStates)
      .orderBy(desc(gameStates.createdAt))
      .limit(1);
    return gameState || undefined;
  }

  async saveGameState(gameState: InsertGameState): Promise<GameState> {
    const [savedGameState] = await requireDatabase()
      .insert(gameStates)
      .values(gameState)
      .returning();
    return savedGameState;
  }

  async getAllBreakthroughs(): Promise<Breakthrough[]> {
    return initialGameState.breakthroughs.map(breakthrough => ({
      ...breakthrough,
      requiredLevels: { ...breakthrough.requiredLevels }
    }));
  }

  // Real database implementation for leaderboard
  async saveLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const [savedEntry] = await requireDatabase()
      .insert(leaderboard)
      .values({
        ...entry,
        createdAt: new Date().toISOString()
      })
      .returning();
    return savedEntry;
  }

  async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    return await requireDatabase()
      .select()
      .from(leaderboard)
      .orderBy(desc(leaderboard.finalIntelligence), leaderboard.totalTimeElapsed, desc(leaderboard.peakMoney))
      .limit(limit);
  }

  async getPlayerRanking(finalIntelligence: number): Promise<{ rank: number; total: number; percentile: number }> {
    // Get total count
    const [{ count: total }] = await requireDatabase()
      .select({ count: sql<number>`count(*)::int` })
      .from(leaderboard);

    // Get rank (count of players with higher intelligence)
    const [{ count: playersAhead }] = await requireDatabase()
      .select({ count: sql<number>`count(*)::int` })
      .from(leaderboard)
      .where(sql`final_intelligence > ${finalIntelligence}`);

    const rank = playersAhead + 1;
    const percentile = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 100;

    return { rank, total, percentile };
  }
}

// Use DatabaseStorage for production, keep MemStorage as backup
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
