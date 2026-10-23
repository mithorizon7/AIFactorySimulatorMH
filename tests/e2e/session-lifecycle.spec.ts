import { expect, test } from "@playwright/test";
import type { GameStateV2 } from "../../shared/game/schemas/state";
import { getNextEra } from "../../shared/game/domain/era";

test("anonymous run saves tutorial/navigation, pauses, reloads without catch-up and resets safely", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("dialog", { name: "Welcome to AI Factory!" })
    .getByRole("button", { name: "Skip Tutorial" })
    .click();
  await page.getByTestId("button-start-game").click();
  await expect(page.getByTestId("active-time")).not.toHaveText("0:00");
  await page.getByTestId("button-pause-game").click();
  const pausedTime = await page.getByTestId("active-time").innerText();
  await page.getByRole("tab", { name: "Training", exact: true }).click();
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  await page.waitForTimeout(1_200);
  await expect(page.getByTestId("active-time")).toHaveText(pausedTime);
  await page.reload();
  await expect(page.getByTestId("active-time")).toHaveText(pausedTime);
  await expect(page.getByTestId("button-start-game")).toContainText("Resume");
  await expect(
    page.getByRole("tab", { name: "Training", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(
    page.getByRole("dialog", { name: "Welcome to AI Factory!" }),
  ).toBeHidden();
  await page.getByTestId("button-reset-game").click();
  await page.getByTestId("button-confirm-reset").click();
  await expect(page.getByTestId("active-time")).toHaveText("0:00");
  await expect(page.getByTestId("button-start-game")).toContainText(
    "Start Game",
  );
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  await page.reload();
  await expect(page.getByTestId("active-time")).toHaveText("0:00");
});

test("two tabs require explicit takeover and fence the old writer", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page
    .getByRole("dialog", { name: "Welcome to AI Factory!" })
    .getByRole("button", { name: "Skip Tutorial" })
    .click();
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.getByTestId("session-status")).toContainText("Read-only");
  await expect(other.getByTestId("button-start-game")).toBeDisabled();
  await other.getByRole("button", { name: "Take over this run" }).click();
  await expect(other.getByTestId("button-start-game")).toBeEnabled();
  await expect(page.getByTestId("session-status")).toContainText("Read-only");
  await expect(page.getByTestId("button-start-game")).toBeDisabled();
  await other.close();
});

test("mobile navigation rows clear the Resources heading", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("dialog", { name: "Welcome to AI Factory!" })
    .getByRole("button", { name: "Skip Tutorial" })
    .click();
  await page.getByRole("tab", { name: "Resources", exact: true }).click();
  const tabs = await page.getByRole("tablist").first().boundingBox();
  const heading = await page
    .getByRole("heading", { name: "Resource Factories" })
    .boundingBox();
  expect(tabs).not.toBeNull();
  expect(heading).not.toBeNull();
  expect(tabs!.y + tabs!.height).toBeLessThanOrEqual(heading!.y);
});

test("reset disables commands while a storage transaction is pending", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("dialog", { name: "Welcome to AI Factory!" })
    .getByRole("button", { name: "Skip Tutorial" })
    .click();
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ai-factory");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("runs", "readwrite");
    let released = false;
    (
      window as Window & { releaseTestStorageLock?: () => void }
    ).releaseTestStorageLock = () => {
      released = true;
    };
    const keepAlive = () => {
      tx.objectStore("runs").get("hold").onsuccess = () => {
        if (!released) keepAlive();
      };
    };
    keepAlive();
    tx.oncomplete = () => db.close();
  });
  await page.getByTestId("button-reset-game").click();
  await page.getByTestId("button-confirm-reset").click();
  await expect(page.getByTestId("game-controls")).toBeDisabled();
  await expect(page.getByTestId("button-start-game")).toBeDisabled();
  await page
    .getByTestId("button-start-game")
    .evaluate((button: HTMLButtonElement) => button.click());
  await page.evaluate(() =>
    (
      window as Window & { releaseTestStorageLock?: () => void }
    ).releaseTestStorageLock?.(),
  );
  await expect(page.getByTestId("game-controls")).toBeEnabled();
  await expect(page.getByTestId("button-start-game")).toContainText(
    "Start Game",
  );
  await expect(page.getByTestId("active-time")).toHaveText("0:00");
  expect(errors).toEqual([]);
});

test("a public-control strategy completes the ladder and persists its factual scorecard", async ({
  page,
}) => {
  test.setTimeout(300_000);
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  await page.clock.install();
  await page.goto("/");
  await page
    .getByRole("dialog", { name: "Welcome to AI Factory!" })
    .getByRole("button", { name: "Skip Tutorial" })
    .click();
  await page.getByTestId("button-start-game").click();
  const savedState = () =>
    page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("ai-factory");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = database.transaction(["meta", "runs"], "readonly");
      const request = tx.objectStore("runs").getAll();
      const snapshots = await new Promise<
        Array<{ simulation: GameStateV2; savedAt: string }>
      >((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      database.close();
      return snapshots.sort(
        (a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt),
      )[0].simulation;
    });
  await page.clock.runFor(600);
  let state = await savedState();
  let verifiedPendingModal = false;
  const dismissBreakthroughs = async () => {
    const toastClose = page.locator('[data-state="open"] [toast-close]');
    while ((await toastClose.count()) > 0) {
      await toastClose.first().focus();
      await page.keyboard.press("Enter");
    }
    const breakthroughClose = page.getByRole("button", {
      name: /Thanks, Spark!/,
    });
    while (await breakthroughClose.isVisible()) {
      if (!verifiedPendingModal) {
        await page.clock.runFor(600);
        await page.reload();
        await expect(breakthroughClose).toBeVisible();
        verifiedPendingModal = true;
      }
      await breakthroughClose.click();
      await page.clock.runFor(1);
    }
    const resume = page.getByTestId("button-start-game");
    if ((await resume.isVisible()) && (await resume.isEnabled()))
      await resume.click();
  };
  for (
    let iteration = 0;
    iteration < 800 && state.clock.status !== "completed";
    iteration++
  ) {
    await dismissBreakthroughs();
    const target = getNextEra(state.currentEra);
    if (target && !state.training.active) {
      const run =
        state.training.runs[target as keyof typeof state.training.runs];
      const upgrades: Array<[number, number, string]> = [
        [
          state.levels.compute,
          run.prerequisites.compute,
          '[data-tutorial-id="compute-level-upgrade"]',
        ],
        [
          state.dataInputs.quality,
          run.prerequisites.data.quality,
          '[data-tutorial-id="data-quality-upgrade"]',
        ],
        [
          state.dataInputs.quantity,
          run.prerequisites.data.quantity,
          '[data-game-command="INVEST_DATA_QUANTITY"]',
        ],
        [
          state.dataInputs.formats,
          run.prerequisites.data.formats,
          '[data-game-command="INVEST_DATA_FORMATS"]',
        ],
        [
          state.algorithmInputs.architectures,
          run.prerequisites.algorithm.architectures,
          '[data-tutorial-id="algorithm-architecture-upgrade"]',
        ],
        [
          state.computeInputs.electricity,
          run.prerequisites.computeInputs.electricity,
          '[data-game-command="INVEST_ELECTRICITY"]',
        ],
        [
          state.computeInputs.hardware,
          run.prerequisites.computeInputs.hardware,
          '[data-game-command="INVEST_HARDWARE"]',
        ],
        [
          state.computeInputs.regulation,
          run.prerequisites.computeInputs.regulation,
          '[data-game-command="INVEST_REGULATION"]',
        ],
      ];
      if (upgrades.some(([current, required]) => current < required)) {
        await page.getByRole("tab", { name: "Resources", exact: true }).click();
        for (const section of ["compute", "data", "algorithm"]) {
          const trigger = page.locator(
            `[data-tutorial-id="${section}-advanced-toggle"]`,
          );
          if ((await trigger.getAttribute("data-state")) === "closed")
            await trigger.click();
        }
        for (const [current, required, selector] of upgrades) {
          if (current >= required) continue;
          const button = page.locator(selector);
          if ((await button.count()) === 0) {
            const section = selector.includes("algorithm-architecture")
              ? "algorithm"
              : selector.includes("INVEST_DATA") ||
                  selector.includes("data-quality")
                ? "data"
                : "compute";
            await page
              .locator(`[data-tutorial-id="${section}-advanced-toggle"]`)
              .click();
            await page.clock.runFor(300);
          }
          for (
            let level = current;
            level < required && (await button.isEnabled());
            level++
          ) {
            await button.click();
            await dismissBreakthroughs();
          }
        }
      }
      await page.getByRole("tab", { name: "Training", exact: true }).click();
      const start = page.getByTestId("start-training-button");
      if (await start.isEnabled()) await start.click();
    }
    await page.clock.runFor(10_600);
    state = await savedState();
  }
  expect(state.clock.status).toBe("completed");
  expect(verifiedPendingModal).toBe(true);
  await expect(
    page.getByRole("heading", { name: /Run complete/ }),
  ).toBeVisible();
  await page.clock.runFor(500);
  await expect(
    page.getByRole("heading", { name: "Personal bests for this ruleset" }),
  ).toBeVisible();
  await expect(page.getByText("Total spend", { exact: true })).toBeVisible();
  await page.getByTestId("button-close-victory").click();
  await page.clock.runFor(500);
  await page.reload();
  await expect(page.getByTestId("button-start-game")).toContainText(
    "Run Complete",
  );
  await expect(
    page.getByRole("heading", { name: /Run complete/ }),
  ).toBeHidden();
  expect(browserErrors).toEqual([]);
});
