import type { Express, Request, Response } from "express";
import { createSuccessResponse, getRequestId } from "./errorHandler";
import { getVersionInfo } from "@shared/version";

export interface RouteDependencies {
  buildSha: string | null;
  migrationVersion: string | null;
  rulesetLoaded: boolean;
}

const RETIRED_ENDPOINT_MESSAGE =
  "This unscoped legacy endpoint has been retired. AI Factory now keeps runs locally in the browser.";

function retiredEndpoint(req: Request, res: Response): void {
  res.status(410).json({
    error: {
      code: "LEGACY_ENDPOINT_RETIRED",
      message: RETIRED_ENDPOINT_MESSAGE,
    },
    meta: { requestId: getRequestId(req) },
  });
}

function noStore(_req: Request, res: Response, next: () => void): void {
  res.setHeader("Cache-Control", "no-store");
  next();
}

export function registerRoutes(
  app: Express,
  dependencies: RouteDependencies,
): void {
  app.use("/api", noStore);
  app.get("/api/healthz", (req, res) => {
    res.json(createSuccessResponse({ status: "ok" }, getRequestId(req)));
  });

  app.get("/api/readyz", (req, res) => {
    res.status(dependencies.rulesetLoaded ? 200 : 503).json(
      createSuccessResponse(
        {
          status: dependencies.rulesetLoaded ? "ready" : "not_ready",
          rulesetLoaded: dependencies.rulesetLoaded,
          ruleset: dependencies.rulesetLoaded
            ? "validated"
            : "not_yet_integrated",
          telemetry: "not_configured",
        },
        getRequestId(req),
      ),
    );
  });

  app.get("/api/version", (req, res) => {
    res.json(
      createSuccessResponse(
        {
          ...getVersionInfo(
            dependencies.buildSha,
            dependencies.migrationVersion,
          ),
          nodeVersion: process.version,
        },
        getRequestId(req),
      ),
    );
  });

  app.all("/api/game-state", retiredEndpoint);
  app.all("/api/leaderboard", retiredEndpoint);
  app.all("/api/ranking/:intelligence", retiredEndpoint);
}
