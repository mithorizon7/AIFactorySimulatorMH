import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameStateSchema, insertLeaderboardSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current game state
  app.get("/api/game-state", async (req, res) => {
    try {
      const gameState = await storage.getLatestGameState();
      res.json(gameState || { success: false, message: "No game state found" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch game state" });
    }
  });

  // Save game state
  app.post("/api/game-state", async (req, res) => {
    try {
      const gameStateData = insertGameStateSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      
      const savedGameState = await storage.saveGameState(gameStateData);
      res.json({ success: true, gameState: savedGameState });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        res.status(500).json({ success: false, message: "Failed to save game state" });
      }
    }
  });

  // Get all breakthroughs
  app.get("/api/breakthroughs", async (req, res) => {
    try {
      const breakthroughs = await storage.getAllBreakthroughs();
      res.json(breakthroughs);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch breakthroughs" });
    }
  });

  // Save leaderboard entry
  app.post("/api/leaderboard", async (req, res) => {
    try {
      const entryData = insertLeaderboardSchema.parse(req.body);
      const savedEntry = await storage.saveLeaderboardEntry(entryData);
      res.json({ success: true, entry: savedEntry });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        res.status(500).json({ success: false, message: "Failed to save leaderboard entry" });
      }
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
    }
  });

  // Get player ranking
  app.get("/api/ranking/:intelligence", async (req, res) => {
    try {
      const intelligence = parseInt(req.params.intelligence);
      const ranking = await storage.getPlayerRanking(intelligence);
      res.json(ranking);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch ranking" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
