import { defineConfig } from "@playwright/test";
import production from "./playwright.production.config";

const baseURL = process.env.BASE_URL;
if (!baseURL || new URL(baseURL).protocol !== "https:") {
  throw new Error("BASE_URL must identify the deployed HTTPS application.");
}
if (!/^[a-f0-9]{40}$/.test(process.env.EXPECTED_BUILD_SHA ?? "")) {
  throw new Error(
    "EXPECTED_BUILD_SHA must identify the intended full revision.",
  );
}

export default defineConfig(production, {
  webServer: undefined,
  use: { baseURL },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "output/playwright/live-report" }],
  ],
  outputDir: "output/playwright/live-results",
});
