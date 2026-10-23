import { defineConfig } from "@playwright/test";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const port = process.env.LOCAL_HTTPS_PORT ?? "5014";
export default defineConfig({
  testDir: path.join(root, "tests"),
  testMatch: [
    "**/e2e/release-c-accessibility.spec.ts",
    "**/browser/release-c-telemetry-privacy.spec.ts",
  ],
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: path.join(root, "output/c-accessibility-results.json") },
    ],
  ],
  outputDir: path.join(root, "output/playwright/c-accessibility"),
  use: {
    baseURL: `https://127.0.0.1:${port}`,
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
    navigationTimeout: 15000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 900 },
  },
  // Only the throwaway loopback certificate is ignored; application CSP remains
  // production-enforced. WebKit upgrades insecure HTTP assets by that policy.
  webServer: {
    command: "node scripts/serve-accessibility-https.mjs",
    cwd: root,
    url: `https://127.0.0.1:${port}/api/healthz`,
    ignoreHTTPSErrors: true,
    env: {
      LOCAL_HTTPS_PORT: port,
      LOCAL_BACKEND_PORT: process.env.LOCAL_BACKEND_PORT ?? "5015",
      // Browser fixtures must never activate a provider-backed telemetry sink.
      TELEMETRY_ENABLED: "false",
    },
    reuseExistingServer: false,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
