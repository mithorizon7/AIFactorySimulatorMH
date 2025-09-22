import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const gameStates = pgTable("game_states", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  intelligence: integer("intelligence").notNull(),
  timeRemaining: integer("time_remaining").notNull(),
  money: integer("money").default(1000).notNull(),
  resourceCompute: integer("resource_compute").notNull(),
  resourceData: integer("resource_data").notNull(),
  resourceAlgorithm: integer("resource_algorithm").notNull(),
  computeLevel: integer("compute_level").notNull(),
  dataLevel: integer("data_level").notNull(),
  algorithmLevel: integer("algorithm_level").notNull(),
  // Revenue streams
  revenueB2B: integer("revenue_b2b").default(0),
  revenueB2C: integer("revenue_b2c").default(0),
  revenueInvestors: integer("revenue_investors").default(0),
  unlockedBreakthroughs: jsonb("unlocked_breakthroughs").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Leaderboard table for AGI achievements
export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  finalIntelligence: integer("final_intelligence").notNull(),
  totalTimeElapsed: integer("total_time_elapsed").notNull(), // in seconds
  peakMoney: integer("peak_money").notNull(),
  totalMoneyEarned: integer("total_money_earned").notNull(),
  peakB2BSubscribers: integer("peak_b2b_subscribers").notNull(),
  peakB2CSubscribers: integer("peak_b2c_subscribers").notNull(),
  breakthroughsUnlocked: integer("breakthroughs_unlocked").notNull(),
  erasReached: integer("eras_reached").notNull(),
  hasAchievedAGI: boolean("has_achieved_agi").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertGameStateSchema = createInsertSchema(gameStates).omit({
  id: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameState = typeof gameStates.$inferSelect;
export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;
