import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "output/playwright/html-report" }],
  ],
  outputDir: "output/playwright/test-results",
  use: {
    baseURL: "http://127.0.0.1:5002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 1024 },
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5002",
    env: {
      PORT: "5002",
      NODE_ENV: "development",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
