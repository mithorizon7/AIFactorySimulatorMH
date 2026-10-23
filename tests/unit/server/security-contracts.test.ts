import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer as createViteServer } from "vite";
import { createContentSecurityPolicy } from "../../../server/app";
import { isCommitSha, readBuildMetadata } from "../../../server/buildMetadata";
import { globalErrorHandler } from "../../../server/errorHandler";
import { log, setupVite } from "../../../server/vite";
import viteConfig from "../../../vite.config";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
  vi.restoreAllMocks();
});

describe("security and artifact contracts", () => {
  it("development transform diagnostics cannot terminate the process", async () => {
    const httpServer = createHttpServer();
    const exit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("Unexpected request-triggered process exit");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const vite = await setupVite(express(), httpServer);
    try {
      expect(() =>
        vite.config.logger.error("ordinary transform failure"),
      ).not.toThrow();
      expect(exit).not.toHaveBeenCalled();
    } finally {
      await vite.close();
    }
  });

  it("production policy has no development script or WebSocket exceptions", () => {
    const policy = JSON.stringify(createContentSecurityPolicy("production"));
    expect(policy).not.toContain("sha256-");
    expect(policy).not.toContain("ws://");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("development policy pins every Vite-injected inline script by exact hash", async () => {
    const httpServer = createHttpServer();
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      appType: "custom",
      server: { middlewareMode: true, hmr: { server: httpServer } },
    });

    try {
      const template = await readFile(
        path.resolve("client/index.html"),
        "utf8",
      );
      const transformed = await vite.transformIndexHtml("/", template);
      const inlineScripts = Array.from(
        transformed.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi),
        (match) => match[1],
      ).filter((content) => content.trim().length > 0);
      const policy = createContentSecurityPolicy("development");
      const scriptSources = policy.directives.scriptSrc;

      expect(inlineScripts.length).toBeGreaterThan(0);
      for (const content of inlineScripts) {
        const digest = createHash("sha256").update(content).digest("base64");
        expect(scriptSources).toContain(`'sha256-${digest}'`);
      }
    } finally {
      await vite.close();
    }
  });

  it("reads only full commit SHAs from generated metadata", async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), "ai-factory-build-meta-"),
    );
    temporaryDirectories.push(directory);
    const metadataPath = path.join(directory, "build-meta.json");
    const buildSha = "0123456789abcdef0123456789abcdef01234567";

    await writeFile(
      metadataPath,
      JSON.stringify({ buildSha, builtAt: "2026-07-10T00:00:00.000Z" }),
      "utf8",
    );
    expect(readBuildMetadata(metadataPath)).toEqual({
      buildSha,
      builtAt: "2026-07-10T00:00:00.000Z",
    });
    expect(isCommitSha(buildSha)).toBe(true);

    await writeFile(
      metadataPath,
      JSON.stringify({ buildSha: "deployment-id", builtAt: 123 }),
      "utf8",
    );
    expect(readBuildMetadata(metadataPath)).toEqual({
      buildSha: null,
      builtAt: null,
    });
  });

  it.each([null, "string failure", undefined])(
    "normalizes arbitrary thrown value %s without throwing",
    (thrown) => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const request = {
        app: { get: () => "production" },
        method: "GET",
        path: "/api/test",
      } as unknown as Request;
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const response = { headersSent: false, status } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      expect(() =>
        globalErrorHandler(thrown, request, response, next),
      ).not.toThrow();
      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: { code: "INTERNAL_ERROR", message: expect.any(String) },
        }),
      );
    },
  );

  it("delegates errors after response headers were sent", () => {
    const request = {} as Request;
    const response = { headersSent: true } as Response;
    const next = vi.fn() as unknown as NextFunction;
    const error = new Error("late failure");

    globalErrorHandler(error, request, response, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it("only returns original error detail in development", () => {
    const invoke = (environment: "development" | "production") => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const request = {
        app: { get: () => environment },
        method: "GET",
        path: "/api/test",
      } as unknown as Request;
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const response = { headersSent: false, status } as unknown as Response;

      globalErrorHandler(
        new Error("sensitive diagnostic detail"),
        request,
        response,
        vi.fn() as unknown as NextFunction,
      );
      return json.mock.calls[0]?.[0];
    };

    expect(invoke("production").error).not.toHaveProperty("details");
    expect(invoke("development").error).toMatchObject({
      details: { originalMessage: "sensitive diagnostic detail" },
    });
  });

  it("labels startup diagnostics with their explicit source", () => {
    const output = vi.spyOn(console, "log").mockImplementation(() => {});

    log("ready on port 5000", "release-a");

    expect(output).toHaveBeenCalledOnce();
    expect(output.mock.calls[0]?.[0]).toMatch(
      /\[release-a\] ready on port 5000$/,
    );
  });
});
