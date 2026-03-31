import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { globalErrorHandler, notFoundHandler, requestLogger } from "./errorHandler";
import { logger } from "./logger";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use structured request logging
app.use(requestLogger);

(async () => {
  const server = await registerRoutes(app);

  // Setup Vite BEFORE 404 handler so SPA can load
  if (app.get("env") === "development") {
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
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
