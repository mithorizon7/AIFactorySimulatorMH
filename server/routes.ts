import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameStateSchema } from "@shared/schema";
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

  const httpServer = createServer(app);

  return httpServer;
}
