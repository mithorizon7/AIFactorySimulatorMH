import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [
    ["list"],
    [
      "html",
      { open: "never", outputFolder: "output/playwright/production-report" },
    ],
  ],
  outputDir: "output/playwright/production-results",
  use: {
    baseURL: "http://127.0.0.1:5003",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 1024 },
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:5003/api/healthz",
    env: {
      PORT: "5003",
      NODE_ENV: "production",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium-production",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
