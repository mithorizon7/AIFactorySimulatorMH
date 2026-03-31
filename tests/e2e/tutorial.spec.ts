import { expect, test, type Page } from "@playwright/test";

async function openFreshGame(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/");
}

test.beforeEach(async ({ page }) => {
  await openFreshGame(page);
});

async function expectTutorialStep(page: Page, title: string, stepLabel: string) {
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText(stepLabel)).toBeVisible();
  await expect(page.getByRole("button", { name: "Do the highlighted action" })).toBeVisible();
}

test("tutorial completes end-to-end and starts the run", async ({ page }) => {
  await expect(page.getByRole("dialog", { name: "Welcome to AI Factory!" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("dialog", { name: "The Three Pillars of AI" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Continue" }).click();

  await expectTutorialStep(page, "Pillar 1: Compute Power", "Step 1 of 6");
  await expect(page.locator("[data-tutorial-id='compute-advanced-toggle']")).toBeVisible();
  await page.locator("[data-tutorial-id='compute-advanced-toggle']").click();

  await expectTutorialStep(page, "Invest in Compute Infrastructure", "Step 2 of 6");
  const computeUpgrade = page.locator("[data-tutorial-id='compute-level-upgrade']");
  await expect(computeUpgrade).toBeVisible();
  await computeUpgrade.click();

  await expectTutorialStep(page, "Pillar 2: High-Quality Data", "Step 3 of 6");
  await expect(page.locator("[data-tutorial-id='data-advanced-toggle']")).toBeVisible();
  await page.locator("[data-tutorial-id='data-advanced-toggle']").click();

  await expectTutorialStep(page, "Improve Data Quality", "Step 4 of 6");
  const dataUpgrade = page.locator("[data-tutorial-id='data-quality-upgrade']");
  await expect(dataUpgrade).toBeVisible();
  await dataUpgrade.click();

  await expectTutorialStep(page, "Pillar 3: Smart Algorithms", "Step 5 of 6");
  await expect(page.locator("[data-tutorial-id='algorithm-advanced-toggle']")).toBeVisible();
  await page.locator("[data-tutorial-id='algorithm-advanced-toggle']").click();

  await expectTutorialStep(page, "Research Better Algorithms", "Step 6 of 6");
  const algorithmUpgrade = page.locator("[data-tutorial-id='algorithm-architecture-upgrade']");
  await expect(algorithmUpgrade).toBeVisible();
  await algorithmUpgrade.click();

  await expectTutorialStep(page, "Your AI Development Dashboard", "Step 1 of 3");
  await page.locator("[data-tutorial-id='dashboard-tab']").click();
  await expectTutorialStep(page, "The Path to AGI", "Step 2 of 3");
  await page.locator("[data-tutorial-id='progression-tab']").click();
  await expectTutorialStep(page, "Strategic Funding and Revenue", "Step 3 of 3");
  await page.locator("[data-tutorial-id='economy-tab']").click();

  await expectTutorialStep(page, "The AI Economics Model", "Step 1 of 3");
  await page.locator("[data-tutorial-id='training-tab-trigger']").click();

  await expectTutorialStep(page, "Training Runs: The Path to AGI", "Step 2 of 3");
  await expect(page.locator("[data-tutorial-id='training-panel']")).toBeVisible();
  await page.locator("[data-tutorial-id='training-panel']").click();

  await expect(page.getByRole("dialog", { name: "Tutorial Complete!" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Start Building!" }).click();

  await expect(page.getByTestId("button-pause-game")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Tutorial Complete!" })).toBeHidden();
  await expect.poll(async () => {
    return page.evaluate(() => window.localStorage.getItem("hasPlayedAIFactory"));
  }).toBe("true");
});
