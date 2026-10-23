import { expect, test, type Page } from "@playwright/test";
import { createFreshGameState } from "../../shared/game/factory";
import { createFreshExperienceState } from "../../shared/experience/schemas";
import {
  checksumPayload,
  snapshotPayload,
} from "../../client/src/lib/persistence/repository";

async function hydratePriceFixture(page: Page, monthlyFee: number) {
  const simulation = createFreshGameState({
    ruleset: "release-a.1",
    seed: 101,
  });
  simulation.revenue.monthlyFee = monthlyFee;
  const experience = createFreshExperienceState(true);
  experience.lastActiveTab = "economy";
  const payload = snapshotPayload(
    "10101010-1010-4010-8010-101010101010",
    7,
    simulation,
    experience,
  );
  const checksum = await checksumPayload(payload);
  await page.goto("/");
  await page.getByRole("button", { name: "Skip Tutorial" }).click();
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  // Leave the prior document before replacing this disposable synthetic save,
  // so its pagehide flush cannot overwrite the hydration fixture.
  await page.goto("/api/healthz");
  await page.evaluate(
    async ({ payload, checksum }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("ai-factory");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = db.transaction(["runs", "meta"], "readwrite");
      const done = new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      const writer = tx.objectStore("meta").get("writer");
      writer.onsuccess = () => {
        const lease = writer.result.lease;
        const timestamp = new Date().toISOString();
        tx.objectStore("runs").put({
          ...payload,
          checksum,
          createdAt: timestamp,
          savedAt: timestamp,
          abandonedAt: null,
          writerId: lease.writerId,
          writerEpoch: lease.writerEpoch,
          leaseExpiresAt: lease.expiresAt,
        });
        tx.objectStore("meta").put({
          key: "activeRunId",
          runId: payload.runId,
        });
      };
      await done;
      db.close();
    },
    { payload, checksum },
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Financial Dashboard" }),
  ).toBeVisible();
}

async function savedFee(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ai-factory");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("runs", "readonly");
    const fee = await new Promise<number>((resolve, reject) => {
      const request = tx
        .objectStore("runs")
        .get("10101010-1010-4010-8010-101010101010");
      request.onsuccess = () =>
        resolve(request.result.simulation.revenue.monthlyFee);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return fee;
  });
}

test("invalid price drafts stay inline and a fractional legal fee can be applied", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await hydratePriceFixture(page, 10);
  const draft = page.getByLabel("Monthly subscription fee ($5–$25)");
  const apply = page.getByRole("button", { name: "Apply monthly fee" });
  for (const value of ["", "1", "26"]) {
    await draft.fill(value);
    await expect(draft).toHaveAttribute("aria-invalid", "true");
    await expect(apply).toBeDisabled();
    await expect(page.locator("#chatbot-price-validation")).toContainText(
      "Enter a price from $5 to $25",
    );
    await expect(page.getByTestId("current-monthly-fee")).toHaveText(
      "Current fee: $10",
    );
    await expect(
      page.getByRole("heading", { name: "Financial Dashboard" }),
    ).toBeVisible();
  }
  await draft.fill("12.5");
  await expect(draft).toHaveAttribute("aria-invalid", "false");
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(page.getByTestId("current-monthly-fee")).toHaveText(
    "Current fee: $12.5",
  );
  await expect.poll(() => savedFee(page)).toBe(12.5);
  expect(errors).toEqual([]);
});

test("boosted saved fee outside the command range renders without silently changing the actual price", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await hydratePriceFixture(page, 37.5);
  await expect(page.getByTestId("current-monthly-fee")).toHaveText(
    "Current fee: $37.5",
  );
  await expect(
    page.getByLabel("Monthly subscription fee ($5–$25)"),
  ).toHaveValue("25");
  await expect(page.locator("#chatbot-price-help")).toContainText(
    "does not change that price unless you apply it",
  );
  expect(await savedFee(page)).toBe(37.5);
  await page.reload();
  await expect(page.getByTestId("current-monthly-fee")).toHaveText(
    "Current fee: $37.5",
  );
  expect(await savedFee(page)).toBe(37.5);
  expect(errors).toEqual([]);
});
