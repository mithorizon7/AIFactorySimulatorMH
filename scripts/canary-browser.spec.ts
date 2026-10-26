import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
// Reuse the reviewed public-control completion test, not a production backdoor
// or a second strategy implementation. Config grep selects it plus this canary.
import "../tests/e2e/session-lifecycle.spec";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true });
  });
});

async function savedRun(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("ai-factory");
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const tx = db.transaction(["meta", "runs"], "readonly");
    const active = await new Promise<{ runId: string }>((resolve, reject) => {
      const request = tx.objectStore("meta").get("activeRunId");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const snapshot = await new Promise<{
      runId: string;
      simulation: { clock: { activeTick: number; status: string } };
      experience: unknown;
    }>((resolve, reject) => {
      const request = tx.objectStore("runs").get(active.runId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return snapshot;
  });
}

test("canary checks durable startup and explicit resume", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Open my lab" }).click();
  await page.getByTestId("button-start-game").click();
  await page.clock.runFor(2_000);
  await page.getByTestId("button-pause-game").click();
  await page.getByRole("tab", { name: "Training", exact: true }).click();
  await page.clock.runFor(600);
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  const before = await savedRun(page);
  expect(before.simulation.clock.activeTick).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByTestId("button-start-game")).toContainText("Resume");
  const reloaded = await savedRun(page);
  expect(reloaded.runId).toBe(before.runId);
  expect(reloaded.simulation).toEqual(before.simulation);
  expect(reloaded.experience).toEqual(before.experience);
  await page.clock.runFor(2_000);
  expect((await savedRun(page)).simulation.clock.activeTick).toBe(
    before.simulation.clock.activeTick,
  );
  await page.getByTestId("button-start-game").click();
  await page.clock.runFor(2_000);
  await page.getByTestId("button-pause-game").click();
  await page.clock.runFor(600);
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  const resumed = await savedRun(page);
  expect(resumed.runId).toBe(before.runId);
  expect(resumed.simulation.clock.activeTick).toBe(
    before.simulation.clock.activeTick + 2,
  );
});
