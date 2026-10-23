import express, { type Express } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import {
  globalErrorHandler,
  notFoundHandler,
  requestIdMiddleware,
  requestLogger,
} from "./errorHandler";

export interface AppDependencies {
  environment?: "development" | "test" | "production";
  buildSha?: string | null;
  migrationVersion?: string | null;
  rulesetLoaded?: boolean;
}

const viteReactRefreshHash =
  "'sha256-Z2/iFzh9VMlVkEOar1f/oSHWwQk3ve1qk/C2WdsC4Xk='";

export function createContentSecurityPolicy(
  environment: AppDependencies["environment"],
) {
  const isDevelopment = environment === "development";
  return {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      scriptSrc: [
        "'self'",
        // Vite injects this exact React refresh preamble in development only.
        // Pinning its hash keeps the production policy free of inline scripts.
        ...(isDevelopment ? [viteReactRefreshHash] : []),
      ],
      scriptSrcAttr: ["'none'"],
      // Temporary Release A exception for Radix/react-remove-scroll dialog scroll locking.
      // Owner: Release C accessibility/security lane. Expiry: Release C production
      // sign-off; any extension requires a recorded security/accessibility review.
      styleSrc: ["'self'", "'unsafe-inline'"],
      styleSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: [
        "'self'",
        ...(isDevelopment ? ["ws://127.0.0.1:*", "ws://localhost:*"] : []),
      ],
      workerSrc: ["'self'", "blob:"],
      mediaSrc: ["'self'"],
    },
  };
}

export function createApiApp(dependencies: AppDependencies = {}): Express {
  const environment =
    dependencies.environment ??
    (process.env.NODE_ENV === "production"
      ? "production"
      : process.env.NODE_ENV === "development"
        ? "development"
        : "test");
  const app = express();
  app.set("env", environment);
  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      contentSecurityPolicy: createContentSecurityPolicy(environment),
      crossOriginEmbedderPolicy: false,
      // The TLS edge must prove its HSTS policy before this is enabled here.
      // Do not infer that a managed Cloud Run/Replit edge injects it.
      hsts: false,
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    );
    next();
  });
  app.use(express.json({ limit: "16kb", inflate: false }));
  app.use(
    express.urlencoded({
      extended: false,
      limit: "16kb",
      parameterLimit: 100,
      inflate: false,
    }),
  );
  app.use(requestLogger);
  registerRoutes(app, {
    buildSha: dependencies.buildSha ?? null,
    migrationVersion: dependencies.migrationVersion ?? null,
    rulesetLoaded: dependencies.rulesetLoaded ?? false,
  });
  app.use("/api", notFoundHandler);
  return app;
}

export function installTerminalHandlers(app: Express): void {
  app.use(notFoundHandler);
  app.use(globalErrorHandler);
}
