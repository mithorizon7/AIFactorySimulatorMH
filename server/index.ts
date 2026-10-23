import { createServer } from "http";
import { createApiApp, installTerminalHandlers } from "./app";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./logger";
import { readBuildMetadata } from "./buildMetadata";
import { createFreshGameState } from "../shared/game/factory";
import { RULESET_VERSION } from "../shared/version";

async function startServer(): Promise<void> {
  const environment =
    process.env.NODE_ENV === "production" ? "production" : "development";
  const buildMetadata = readBuildMetadata();
  // The factory performs strict state-schema and ruleset validation. A broken
  // ruleset fails startup instead of allowing readiness to claim a usable app.
  const startupState = createFreshGameState({
    ruleset: RULESET_VERSION,
    seed: 1,
  });
  const app = createApiApp({
    environment,
    buildSha: environment === "production" ? buildMetadata.buildSha : null,
    // No production database schema applies to anonymous browser-local runs.
    migrationVersion: null,
    rulesetLoaded: startupState.rulesetVersion === RULESET_VERSION,
  });
  const server = createServer(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  installTerminalHandlers(app);

  server.requestTimeout = 30_000;
  server.headersTimeout = 35_000;
  server.keepAliveTimeout = 5_000;
  server.on("error", (error) => {
    logger.fatal("HTTP server failure", error);
    process.exitCode = 1;
  });

  const port = Number(process.env.PORT ?? 5000);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen({ port, host: "0.0.0.0" }, () => {
      server.off("error", reject);
      log(`serving on port ${port}`);
      resolve();
    });
  });
}

startServer().catch((error) => {
  logger.fatal("Application startup failed", error as Error);
  process.exit(1);
});
