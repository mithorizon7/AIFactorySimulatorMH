import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("live verification targets HTTPS and never starts an inherited local server", async () => {
  vi.stubEnv("BASE_URL", "https://aifactorysimulation.com");
  vi.stubEnv("EXPECTED_BUILD_SHA", "a".repeat(40));
  const { default: config } = await import("../../../playwright.live.config");
  expect(config.webServer).toEqual([]);
  expect(config.use?.baseURL).toBe("https://aifactorysimulation.com");
  expect(config.projects).toHaveLength(1);
});

it.each([
  ["http://127.0.0.1:5003", "a".repeat(40)],
  ["https://aifactorysimulation.com", "short-sha"],
])("rejects an unsafe live target or ambiguous identity", async (url, sha) => {
  vi.stubEnv("BASE_URL", url);
  vi.stubEnv("EXPECTED_BUILD_SHA", sha);
  await expect(import("../../../playwright.live.config")).rejects.toThrow();
});
