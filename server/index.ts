import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { configureSecurity } from "./security";
import '../tools/check-runtime.mjs';
import { globalErrorHandler, notFoundHandler, requestLogger } from "./errorHandler";
import { logger } from "./logger";
import { pool } from './db';
import { release } from './release';

const app = express();
configureSecurity(app);
app.use(express.json({ limit: '16kb', inflate: false, strict: true }));

// Use structured request logging
app.use(requestLogger);

(async () => {
  // Fail before serving requests if the release schema was not migrated.
  if (pool) {
    await pool.query('SELECT owner_hash FROM game_states LIMIT 0');
    await pool.query('SELECT owner_hash FROM leaderboard LIMIT 0');
  }
  const server = await registerRoutes(app);
  app.use('/api', notFoundHandler);

  // Setup Vite BEFORE 404 handler so SPA can load
  if (app.get("env") === "development") {
    // Keep the development-only module out of the production bundle.
    const devModule = './vite';
    const { setupVite } = await import(devModule);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Handle 404 errors (after Vite setup)
  app.use(notFoundHandler);
  
  // Global error handler (must be last)
  app.use(globalErrorHandler);

  // Default to 5000 for hosted environments, but allow local overrides.
  const port = Number(process.env.PORT ?? 5000);
  server.listen({
    port,
    host: process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'),
  }, () => {
    logger.info(`serving on port ${port}`);
    console.log(JSON.stringify({ event: 'release_started', release, node: process.version, openssl: process.versions.openssl, storage: pool ? 'postgresql' : 'memory' }));
  });
})().catch(() => {
  logger.fatal('Server startup failed. Verify production hosts, database connectivity and ownership migration.');
  process.exitCode = 1;
  void pool?.end();
});
