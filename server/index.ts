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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
