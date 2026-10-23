import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "canary-browser.spec.ts",
  grep: /canary checks durable startup and explicit resume|a public-control strategy completes the ladder and persists its factual scorecard/,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["./canary-reporter.mjs"]],
  outputDir: "../output/canary/browser-temporary",
  webServer: [],
  use: {
    baseURL: process.env.BASE_URL,
    viewport: { width: 1440, height: 1024 },
    extraHTTPHeaders: { "Sec-GPC": "1" },
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
