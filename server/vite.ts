import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { renderNonceHtml } from "./csp";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const configuredHosts = (process.env.VITE_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter((host) => /^[A-Za-z0-9.-]+$/.test(host));
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ["127.0.0.1", "localhost", ...configuredHosts],
    // Vite 8 otherwise changes this default when it detects an agent process.
    // Browser failures are asserted by Playwright instead of forwarded to logs.
    forwardConsole: false,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    // Request/transform errors must not terminate the public development server.
    // Actual startup failures propagate to the startup-only failure handler.
    customLogger: viteLogger,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res
        .status(200)
        .set({ "Content-Type": "text/html", "Cache-Control": "no-store" })
        .end(renderNonceHtml(page, res));
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
  return vite;
}

export function serveStatic(app: Express) {
  // The bundled server lives in dist/, while source-level API tests import
  // this module from server/. Resolve the same built client artifact in both
  // contexts instead of making the test path diverge from production.
  const distPath = [
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "..", "dist", "public"),
  ].find((candidate) => fs.existsSync(candidate));

  if (!distPath) {
    throw new Error(
      "Could not find dist/public, make sure to build the client first",
    );
  }

  const template = fs.readFileSync(
    path.resolve(distPath, "index.html"),
    "utf8",
  );
  const serveHtml: express.RequestHandler = (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.type("html").send(renderNonceHtml(template, res));
  };
  // express.static's index:false does not intercept an explicit /index.html.
  app.get(["/", "/index.html"], serveHtml);

  app.get("/build-meta.json", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(path.resolve(distPath, "build-meta.json"));
  });
  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      index: false,
      setHeaders(res) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      },
    }),
  );

  // fall through to index.html if the file doesn't exist
  app.use(serveHtml);
}
