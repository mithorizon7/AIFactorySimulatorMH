import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import {
  createApiApp,
  createContentSecurityPolicy,
  installTerminalHandlers,
  type AppDependencies,
} from "../../server/app";
import { serveStatic } from "../../server/vite";

function app(dependencies: AppDependencies = {}) {
  const instance = createApiApp({ environment: "production", ...dependencies });
  installTerminalHandlers(instance);
  return instance;
}

function productionStaticApp() {
  const instance = createApiApp({
    environment: "production",
    buildSha: "0123456789abcdef0123456789abcdef01234567",
  });
  serveStatic(instance);
  installTerminalHandlers(instance);
  return instance;
}

describe("Release A API containment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["get", "/api/game-state"],
    ["post", "/api/game-state"],
    ["get", "/api/leaderboard"],
    ["post", "/api/leaderboard"],
    ["get", "/api/ranking/999999"],
  ] as const)("returns JSON 410 for %s %s", async (method, path) => {
    const response = await request(app())[method](path).send({ forged: true });
    expect(response.status).toBe(410);
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.body).toMatchObject({
      error: { code: "LEGACY_ENDPOINT_RETIRED" },
      meta: { requestId: response.headers["x-request-id"] },
    });
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value) =>
      output.push(String(value)),
    );
    const response = await request(app()).get(
      "/api/does-not-exist?secret=query-secret",
    );
    expect(response.status).toBe(404);
    expect(response.type).toBe("application/json");
    expect(response.body.error.code).toBe("APPLICATION_ERROR");
    expect(output.join("\n")).not.toContain("query-secret");
  });

  it("maps malformed JSON to 400", async () => {
    const response = await request(app())
      .post("/api/game-state")
      .set("Content-Type", "application/json")
      .send('{"broken"');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  it("maps bodies over 16 KB to 413", async () => {
    const response = await request(app())
      .post("/api/game-state")
      .send({ payload: "x".repeat(17 * 1024) });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("rejects compressed bodies without inflating untrusted content", async () => {
    const response = await request(app())
      .post("/api/game-state")
      .set("Content-Encoding", "gzip")
      .set("Content-Type", "application/json")
      .send("compressed-content");
    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe("UNSUPPORTED_CONTENT_ENCODING");
  });

  it("exposes enforced security headers without script exceptions", async () => {
    const response = await request(app()).get("/api/healthz");
    expect(response.status).toBe(200);
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["permissions-policy"]).toContain("camera=()");
    expect(response.headers["content-security-policy"]).toContain(
      "script-src 'self'",
    );
    expect(response.headers["content-security-policy"]).not.toContain(
      "unsafe-eval",
    );
    expect(response.headers["content-security-policy"]).not.toContain(
      "script-src 'self' 'unsafe-inline'",
    );
    expect(response.headers["content-security-policy"]).not.toContain("ws:");
    expect(response.headers["content-security-policy"]).not.toContain(
      "unsafe-inline",
    );
    expect(response.headers["content-security-policy"]).toMatch(
      /style-src 'self' 'nonce-[A-Za-z0-9+/]{32}'/,
    );
    expect(response.headers["content-security-policy"]).toContain(
      "style-src-attr 'none'",
    );
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("uses a fresh matching nonce for every HTML response and never serves the build placeholder", async () => {
    const instance = productionStaticApp();
    const nonces = new Set<string>();
    for (const url of ["/", "/index.html", "/%69ndex.html", "/journey"]) {
      const response = await request(instance).get(url);
      expect(response.status).toBe(200);
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(response.text).not.toContain("__AI_FACTORY_REQUEST_NONCE__");
      const nonce = response.headers["content-security-policy"].match(
        /'nonce-([A-Za-z0-9+/]{32})'/,
      )?.[1];
      expect(nonce).toBeTruthy();
      expect(response.text).toContain(`nonce="${nonce}"`);
      nonces.add(nonce!);
    }
    expect(nonces.size).toBe(4);
  });

  it("selects CSP exceptions from explicit environment input", () => {
    const production = JSON.stringify(
      createContentSecurityPolicy("production"),
    );
    const development = JSON.stringify(
      createContentSecurityPolicy("development"),
    );

    expect(production).not.toContain("sha256-Z2/iFzh9");
    expect(production).not.toContain("ws://");
    expect(development).toContain("sha256-Z2/iFzh9");
    expect(development).toContain("ws://127.0.0.1:*");
    expect(development).toContain("ws://localhost:*");
  });

  it.each([
    ["production", "production", false],
    ["development", "development", true],
    ["unexpected", "test", false],
  ] as const)(
    "derives the %s application environment when no explicit dependency is supplied",
    (nodeEnvironment, expectedEnvironment, expectsDevelopmentPolicy) => {
      const original = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = nodeEnvironment;
        const instance = createApiApp();
        const policy = JSON.stringify(
          createContentSecurityPolicy(instance.get("env")),
        );

        expect(instance.get("env")).toBe(expectedEnvironment);
        expect(policy.includes("ws://127.0.0.1:*")).toBe(
          expectsDevelopmentPolicy,
        );
      } finally {
        if (original === undefined) {
          delete process.env.NODE_ENV;
        } else {
          process.env.NODE_ENV = original;
        }
      }
    },
  );

  it("uses only artifact metadata passed into the app", async () => {
    const withoutSha = await request(app()).get("/api/version");
    expect(withoutSha.body.data.buildSha).toBeNull();
    expect(withoutSha.body.data.migrationVersion).toBeNull();
    expect(withoutSha.body.data.nodeVersion).toBe(process.version);

    const buildSha = "0123456789abcdef0123456789abcdef01234567";
    const withSha = await request(app({ buildSha })).get("/api/version");
    expect(withSha.body.data.buildSha).toBe(buildSha);
  });

  it("reports not ready until the real ruleset is validated", async () => {
    const pending = await request(app()).get("/api/readyz");
    expect(pending.status).toBe(503);
    expect(pending.headers["cache-control"]).toBe("no-store");
    expect(pending.body.data).toMatchObject({
      status: "not_ready",
      rulesetLoaded: false,
      ruleset: "not_yet_integrated",
    });

    const ready = await request(app({ rulesetLoaded: true })).get(
      "/api/readyz",
    );
    expect(ready.status).toBe(200);
    expect(ready.body.data).toMatchObject({
      status: "ready",
      rulesetLoaded: true,
      ruleset: "validated",
    });
  });

  it("replaces an invalid incoming request ID", async () => {
    const response = await request(app())
      .get("/api/healthz")
      .set("X-Request-ID", "invalid request id with spaces");
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.body.meta.requestId).toBe(response.headers["x-request-id"]);
  });

  it("preserves a valid incoming request ID", async () => {
    const requestId = "release.123:abc";
    const response = await request(app())
      .get("/api/healthz")
      .set("X-Request-ID", requestId);

    expect(response.headers["x-request-id"]).toBe(requestId);
    expect(response.body.meta.requestId).toBe(requestId);
  });

  it("does not put query strings or request bodies into structured logs", async () => {
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value) =>
      output.push(String(value)),
    );
    await request(app())
      .post("/api/leaderboard?secret=query-secret")
      .send({ playerName: "body-secret", command: "payload-secret" });
    expect(output.join("\n")).not.toContain("query-secret");
    expect(output.join("\n")).not.toContain("body-secret");
    expect(output.join("\n")).not.toContain("payload-secret");
  });

  it("serves production HTML and metadata no-store while hashing assets immutably", async () => {
    const shell = await request(productionStaticApp()).get("/");
    expect(shell.status).toBe(200);
    expect(shell.headers["cache-control"]).toBe("no-store");
    expect(shell.headers["content-security-policy"]).toContain(
      "script-src 'self'",
    );

    const assetPath = shell.text.match(
      /src="(\/assets\/index-[^"]+\.js)"/,
    )?.[1];
    expect(assetPath).toBeTruthy();
    const asset = await request(productionStaticApp()).get(assetPath!);
    expect(asset.status).toBe(200);
    expect(asset.headers["cache-control"]).toBe(
      "public, max-age=31536000, immutable",
    );

    const metadata = await request(productionStaticApp()).get(
      "/build-meta.json",
    );
    expect(metadata.status).toBe(200);
    expect(metadata.headers["cache-control"]).toBe("no-store");
  });

  it("keeps the Express 5 SPA fallback available without caching it", async () => {
    const response = await request(productionStaticApp()).get("/journey/era-2");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.type).toContain("html");
  });
});
