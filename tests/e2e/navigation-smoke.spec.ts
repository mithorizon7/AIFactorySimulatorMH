import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
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

test('mobile navigation contains every tab without covering content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('button-start-game').click();
  const tabs = page.getByRole('tablist', { name: 'Game sections' });
  const contained = await tabs.evaluate(list => {
    const container = list.getBoundingClientRect();
    return Array.from(list.querySelectorAll('[role="tab"]')).every(tab => {
      const box = tab.getBoundingClientRect();
      return box.top >= container.top - 1 && box.bottom <= container.bottom + 1;
    });
  });
  expect(contained).toBe(true);
  for (const tab of await tabs.getByRole('tab').all()) {
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }
});

test('continuous gameplay saves its latest state without restarting the timer', async ({ page }) => {
  await page.getByTestId('button-start-game').click();
  const request = await page.waitForRequest(request =>
    request.url().endsWith('/api/game-state') && request.method() === 'POST',
    { timeout: 40_000 },
  );
  const response = await request.response();
  expect(response?.ok()).toBe(true);
  expect(request.postDataJSON().timeRemaining).toBeGreaterThan(0);
  const saved = await page.request.get('/api/game-state');
  expect(saved.ok()).toBe(true);
  const body = await saved.json();
  expect(body.data.timeRemaining).toBeGreaterThan(0);
  expect(body.data.ownerHash).toBeUndefined();
});
