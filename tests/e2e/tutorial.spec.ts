import { expect, test, type Page } from "@playwright/test";
import type { GameStateV2 } from "../../shared/game/schemas/state";
import { getRunGuidance } from "../../shared/game/guidance";

async function savedState(page: Page): Promise<GameStateV2> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ai-factory");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction(["meta", "runs"], "readonly");
    const active = await new Promise<{ key: string; runId: string }>(
      (resolve, reject) => {
        const request = tx.objectStore("meta").get("activeRunId");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    const run = await new Promise<{ simulation: GameStateV2 }>(
      (resolve, reject) => {
        const request = tx.objectStore("runs").get(active.runId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    db.close();
    return run.simulation;
  });
}

test("one welcome leads to real contextual investment without locking navigation", async ({
  page,
}) => {
  const began = Date.now();
  await page.goto("/");
  const welcome = page.getByRole("dialog", { name: "Welcome to AI Factory!" });
  await expect(welcome).toBeVisible();
  await welcome.getByRole("button", { name: "Open my lab" }).focus();
  await page.keyboard.press("Enter");
  await expect(welcome).toBeHidden();
  await expect(page.getByTestId("run-goal")).toContainText("Current blocker:");
  await expect(page.getByTestId("run-goal")).toContainText("Why it matters:");
  await page.getByTestId("button-start-game").click();
  await page.getByRole("tab", { name: "Resources", exact: true }).click();
  await page.getByTestId("investment-INVEST_COMPUTE").click();
  expect(Date.now() - began).toBeLessThan(90_000);
  await expect(page.getByTestId("compute-overview")).toBeHidden();
  await page.getByRole("tab", { name: "Dashboard", exact: true }).click();
  await expect(page.getByTestId("compute-overview")).toContainText("Level 2");
  await page.getByRole("tab", { name: "Journey", exact: true }).click();
  await expect(page.getByTestId("journey-panel")).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Journey", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await page.waitForTimeout(700);
  await page.reload();
  await expect(welcome).toBeHidden();
  await expect(
    page.getByRole("tab", { name: "Journey", exact: true }),
  ).toHaveAttribute("data-state", "active");
  await expect(page.locator(".tutorial-active-target")).toHaveCount(0);
});

test("contextual goal choices complete first training within the 6–8 minute target", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Open my lab" }).click();
  await page.getByTestId("button-start-game").click();
  await page.clock.runFor(600);
  let state = await savedState(page);
  let firstSpendTick: number | null = null;
  for (let step = 0; step < 480 && state.currentEra === "GNT-2"; step++) {
    const choice = getRunGuidance(state).actions.find(
      (action) =>
        action.enabled &&
        action.command &&
        action.command.type !== "PAUSE_RUN" &&
        (action.command.type !== "HIRE_RESEARCH_ENGINEER" ||
          state.algorithmInputs.researchEngineers === 0),
    );
    if (choice) await page.getByTestId(`goal-action-${choice.id}`).click();
    await page.clock.fastForward(1_000);
    await page.clock.fastForward(600);
    state = await savedState(page);
    if (state.facts.totalSpend > 0 && firstSpendTick === null)
      firstSpendTick = state.clock.activeTick;
  }
  expect(firstSpendTick).not.toBeNull();
  expect(firstSpendTick!).toBeLessThanOrEqual(90);
  expect(state.currentEra).toBe("GNT-3");
  expect(state.clock.activeTick).toBeLessThanOrEqual(480);
  expect(state.clock.activeTick).toBeGreaterThanOrEqual(360);
  await testInfo.attach("first-training-timing", {
    body: JSON.stringify({
      ruleset: state.rulesetVersion,
      firstInvestmentTick: firstSpendTick,
      firstTrainingCompletionTick: state.clock.activeTick,
    }),
    contentType: "application/json",
  });
  await expect(page.getByTestId("run-goal")).not.toContainText(
    "learn by doing",
  );
  await expect(page.getByTestId("spark-message")).toHaveCount(1);
  await expect(page.getByTestId("button-pause-game")).toBeVisible();
  expect(errors).toEqual([]);
});
