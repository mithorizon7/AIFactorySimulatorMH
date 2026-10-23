import { defineConfig } from "@playwright/test";
import path from "node:path";
import accessibility from "./accessibility.playwright.config";

const root = path.resolve(import.meta.dirname, "../..");
export default defineConfig({
  ...accessibility,
  testMatch: "session-lifecycle.spec.ts",
  grep: /a public-control strategy/,
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: path.join(
          root,
          "output/c-full-run-performance-results.json",
        ),
      },
    ],
  ],
  outputDir: path.join(root, "output/playwright/c-full-run-performance"),
  webServer: {
    ...accessibility.webServer,
    reuseExistingServer: process.env.LOCAL_REUSE_SERVER === "1",
  },
});
