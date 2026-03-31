import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/");
  await page.getByRole("dialog").getByRole("button", { name: "Skip Tutorial" }).click();
});

test("core tabs render after skipping the tutorial", async ({ page }) => {
  await page.getByTestId("button-start-game").click();
  await expect(page.getByTestId("button-pause-game")).toBeVisible();

  await page.getByRole("tab", { name: "Dashboard" }).click();
  await expect(page.getByRole("heading", { name: "AGI Readiness" })).toBeVisible();

  await page.getByRole("tab", { name: "Training" }).click();
  await expect(page.getByTestId("training-tab")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Training Prerequisites/i })).toBeVisible();

  await page.getByRole("tab", { name: "Resources" }).click();
  await expect(page.locator("[data-tutorial-id='compute-factory-card']")).toBeVisible();
  await expect(page.locator("[data-tutorial-id='data-factory-card']")).toBeVisible();
  await expect(page.locator("[data-tutorial-id='algorithm-factory-card']")).toBeVisible();

  await page.getByRole("tab", { name: "Economy" }).click();
  await expect(page.getByRole("heading", { name: "Financial Dashboard" })).toBeVisible();

  await page.getByRole("tab", { name: "Breakthroughs" }).click();
  await expect(page.getByRole("heading", { name: "AI Breakthroughs" }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Progression" }).click();
  await expect(page.getByRole("heading", { name: "AI Evolution Timeline" })).toBeVisible();
});
