import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { createContentSecurityPolicy } from "../server/app";
import viteConfig from "../vite.config";

const httpServer = createHttpServer();
const vite = await createViteServer({
  ...viteConfig,
  configFile: false,
  appType: "custom",
  server: { middlewareMode: true, hmr: { server: httpServer } },
});

try {
  const template = await readFile(path.resolve("client/index.html"), "utf8");
  const transformed = await vite.transformIndexHtml("/", template);
  const inlineScripts = Array.from(
    transformed.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi),
    (match) => match[1],
  ).filter((content) => content.trim().length > 0);
  const policy = createContentSecurityPolicy("development");
  const scriptSources = policy.directives.scriptSrc;
  const requiredHashes = inlineScripts.map(
    (content) =>
      `'sha256-${createHash("sha256").update(content).digest("base64")}'`,
  );
  const missing = requiredHashes.filter(
    (hash) => !scriptSources.includes(hash),
  );

  console.log(
    JSON.stringify({
      inlineScriptCount: inlineScripts.length,
      missing,
      requiredHashes,
      scriptSources,
    }),
  );

  if (inlineScripts.length === 0) {
    throw new Error("Vite development transform injected no inline scripts.");
  }
  if (missing.length > 0) {
    throw new Error(`Development CSP is missing ${missing.join(", ")}.`);
  }
} finally {
  await vite.close();
}
