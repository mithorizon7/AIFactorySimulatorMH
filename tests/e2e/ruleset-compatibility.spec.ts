import { expect, test } from "@playwright/test";
import { createFreshGameState } from "../../shared/game/factory";
import { applyGameCommand, advanceGameTicks } from "../../shared/game/engine";
import { createFreshExperienceState } from "../../shared/experience/schemas";
import {
  snapshotPayload,
  checksumPayload,
} from "../../client/src/lib/persistence/repository";
import type { GameCommandIntent } from "../../shared/game/schemas/commands";
import type { GameStateV2 } from "../../shared/game/schemas/state";

test("new presentation hydrates an intact paused Release A save without reinterpreting mechanics", async ({
  page,
}) => {
  let state = createFreshGameState({ ruleset: "release-a.1", seed: 777 });
  let sequence = 0;
  const command = (intent: GameCommandIntent) => {
    state = applyGameCommand(state, {
      ...intent,
      id: `00000000-0000-4000-8000-${(++sequence).toString(16).padStart(12, "0")}`,
      tick: state.clock.activeTick,
      commandSchemaVersion: 1,
    }).state;
  };
  command({ type: "START_RUN", payload: {} });
  command({ type: "INVEST_COMPUTE", payload: {} });
  state = advanceGameTicks(state, 17).state;
  command({ type: "PAUSE_RUN", payload: {} });
  const experience = createFreshExperienceState(true);
  // This is a real A navigation value; B must retain its presentation alias.
  experience.lastActiveTab = "progression";
  const payload = snapshotPayload(
    "77777777-7777-4777-8777-777777777777",
    7,
    state,
    experience,
  );
  const checksum = await checksumPayload(payload);
  await page.goto("/");
  await page
    .getByRole("dialog", { name: "Welcome to AI Factory!" })
    .getByRole("button", { name: "Skip Tutorial" })
    .click();
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  // Seed a synthetic legacy record to test migration/hydration, not completion.
  // The browser context is disposable and contains no player data.
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
      const writerRequest = tx.objectStore("meta").get("writer");
      writerRequest.onsuccess = () => {
        const lease = writerRequest.result.lease;
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
  await page.reload();
  await expect(page.getByTestId("active-time")).toHaveText("0:17");
  await expect(page.getByTestId("button-start-game")).toContainText("Resume");
  const saved = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("ai-factory");
      request.onsuccess = () => resolve(request.result);
    });
    const tx = db.transaction("runs", "readonly");
    const state = await new Promise<GameStateV2>((resolve) => {
      const request = tx
        .objectStore("runs")
        .get("77777777-7777-4777-8777-777777777777");
      request.onsuccess = () => resolve(request.result.simulation);
    });
    db.close();
    return state;
  });
  expect(saved).toEqual(state);
  expect(saved.rulesetVersion).toBe("release-a.1");
  await page.getByTestId("button-start-game").click();
  await expect(page.getByTestId("active-time")).not.toHaveText("0:17");
  await page.getByTestId("button-pause-game").click();
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
});
