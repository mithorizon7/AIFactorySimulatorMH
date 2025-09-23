import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameStateSchema, insertLeaderboardSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  asyncHandler, 
  extractRequestContext, 
  withDatabaseErrorHandling,
  withBusinessLogicErrorHandling,
  createSuccessResponse,
  AppError
} from "./errorHandler";
import { logger } from "./logger";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current game state
  app.get("/api/game-state", asyncHandler(async (req, res) => {
    const requestContext = extractRequestContext(req);
    
    const gameState = await withDatabaseErrorHandling(
      () => storage.getLatestGameState(),
      'getLatestGameState',
      {}
    );
    
    if (!gameState) {
      logger.info('No game state found', {
        ...requestContext,
        operation: 'get_game_state'
      });
      throw new AppError('No game state found', 404);
    }
    
    logger.info('Game state retrieved successfully', {
      ...requestContext,
      operation: 'get_game_state'
    });
    
    res.json(createSuccessResponse(gameState, 'Game state retrieved successfully'));
  }));

  // Save game state
  app.post("/api/game-state", asyncHandler(async (req, res) => {
    const requestContext = extractRequestContext(req);
    
    const gameStateData = await withBusinessLogicErrorHandling(
      async () => {
        return insertGameStateSchema.parse({
          ...req.body,
          createdAt: new Date().toISOString(),
        });
      },
      'validateGameStateData',
      req.body
    );
    
    const savedGameState = await withDatabaseErrorHandling(
      () => storage.saveGameState(gameStateData),
      'saveGameState',
      gameStateData
    );
    
    logger.info('Game state saved successfully', {
      ...requestContext,
      operation: 'save_game_state',
      dataSize: JSON.stringify(gameStateData).length
    });
    
    res.json(createSuccessResponse(savedGameState, 'Game state saved successfully'));
  }));

  // Get all breakthroughs
  app.get("/api/breakthroughs", asyncHandler(async (req, res) => {
    const requestContext = extractRequestContext(req);
    
    const breakthroughs = await withDatabaseErrorHandling(
      () => storage.getAllBreakthroughs(),
      'getAllBreakthroughs',
      {}
    );
    
    logger.info('Breakthroughs retrieved successfully', {
      ...requestContext,
      operation: 'get_breakthroughs',
      resultCount: breakthroughs.length
    });
    
    res.json(createSuccessResponse(breakthroughs, 'Breakthroughs retrieved successfully'));
  }));

  // Save leaderboard entry
  app.post("/api/leaderboard", asyncHandler(async (req, res) => {
    const requestContext = extractRequestContext(req);
    
    const entryData = await withBusinessLogicErrorHandling(
      async () => insertLeaderboardSchema.parse(req.body),
      'validateLeaderboardEntry',
      req.body
    );
    
    const savedEntry = await withDatabaseErrorHandling(
      () => storage.saveLeaderboardEntry(entryData),
      'saveLeaderboardEntry',
      entryData
    );
    
    logger.info('Leaderboard entry saved successfully', {
      ...requestContext,
      operation: 'save_leaderboard_entry',
      playerScore: entryData.finalIntelligence
    });
    
    res.json(createSuccessResponse(savedEntry, 'Leaderboard entry saved successfully'));
  }));

  // Get leaderboard
  app.get("/api/leaderboard", asyncHandler(async (req, res) => {
    const requestContext = extractRequestContext(req);
    
    const limit = await withBusinessLogicErrorHandling(
      async () => {
        const limitParam = req.query.limit as string;
        if (limitParam) {
          const parsed = parseInt(limitParam);
          if (isNaN(parsed) || parsed <= 0 || parsed > 1000) {
            throw new AppError('Limit must be a number between 1 and 1000', 400);
          }
          return parsed;
        }
        return 50;
      },
      'validateLeaderboardLimit',
      { limit: req.query.limit }
    );
    
    const leaderboard = await withDatabaseErrorHandling(
      () => storage.getLeaderboard(limit),
      'getLeaderboard',
      { limit }
    );
    
    logger.info('Leaderboard retrieved successfully', {
      ...requestContext,
      operation: 'get_leaderboard',
      limit,
      resultCount: leaderboard.length
    });
    
    res.json(createSuccessResponse(leaderboard, 'Leaderboard retrieved successfully'));
  }));

  // Get player ranking
  app.get("/api/ranking/:intelligence", asyncHandler(async (req, res) => {
    const requestContext = extractRequestContext(req);
    
    const intelligence = await withBusinessLogicErrorHandling(
      async () => {
        const parsed = parseInt(req.params.intelligence);
        if (isNaN(parsed) || parsed < 0) {
          throw new AppError('Intelligence must be a valid positive number', 400);
        }
        return parsed;
      },
      'validateIntelligenceParam',
      { intelligence: req.params.intelligence }
    );
    
    const ranking = await withDatabaseErrorHandling(
      () => storage.getPlayerRanking(intelligence),
      'getPlayerRanking',
      { intelligence }
    );
    
    logger.info('Player ranking retrieved successfully', {
      ...requestContext,
      operation: 'get_player_ranking',
      intelligence,
      ranking: ranking.rank
    });
    
    res.json(createSuccessResponse(ranking, 'Player ranking retrieved successfully'));
  }));

  const httpServer = createServer(app);

  return httpServer;
}
