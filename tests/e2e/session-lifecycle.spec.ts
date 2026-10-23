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
    .getByRole("heading", { name: "Invest in your lab" })
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
  await expect(page.getByTestId("game-controls")).toHaveAttribute(
    "disabled",
    "",
  );
  await expect(page.getByTestId("button-start-game")).toBeDisabled();
  await page
    .getByTestId("button-start-game")
    .evaluate((button: HTMLButtonElement) => button.click());
  await page.evaluate(() =>
    (
      window as Window & { releaseTestStorageLock?: () => void }
    ).releaseTestStorageLock?.(),
  );
  await expect(page.getByTestId("game-controls")).not.toHaveAttribute(
    "disabled",
    "",
  );
  await expect(page.getByTestId("button-start-game")).toContainText(
    "Start Game",
  );
  await expect(page.getByTestId("active-time")).toHaveText("0:00");
  expect(errors).toEqual([]);
});

test("a public-control strategy completes the ladder and persists its factual scorecard", async ({
  page,
  browserName,
}, testInfo) => {
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
  // Optional qualification reuses this exact public-control strategy and durable
  // message/reload path; it never injects a simulation state or a second policy.
  const heapSession =
    process.env.PERFORMANCE_HEAP === "1" && browserName === "chromium"
      ? await page.context().newCDPSession(page)
      : null;
  const heapSamples: Array<{
    phase: string;
    tick: number;
    era: string;
    usedBytes: number;
  }> = [];
  const sampleHeap = async (phase: string) => {
    if (!heapSession) return;
    await heapSession.send("HeapProfiler.collectGarbage");
    const usage = await heapSession.send("Runtime.getHeapUsage");
    heapSamples.push({
      phase,
      tick: state.clock.activeTick,
      era: state.currentEra,
      usedBytes: usage.usedSize,
    });
  };
  await sampleHeap("opening");
  let nextHeapTick = 300;
  let verifiedPendingMessage = false;
  const dismissBreakthroughs = async () => {
    const toastClose = page.locator('[data-state="open"] [toast-close]');
    while ((await toastClose.count()) > 0) {
      await toastClose.first().focus();
      await page.keyboard.press("Enter");
    }
    const sparkMessage = page.getByTestId("spark-message");
    if (await sparkMessage.isVisible()) {
      if (!verifiedPendingMessage) {
        const pendingId = await sparkMessage.getAttribute("data-message-id");
        await page.clock.runFor(600);
        // IndexedDB completes asynchronously after the debounce timer. Prove the
        // exact pending message is durable before simulating a closed document.
        await expect
          .poll(() =>
            page.evaluate(async (messageId) => {
              const db = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open("ai-factory");
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
              const tx = db.transaction("runs", "readonly");
              const runs = await new Promise<
                Array<{
                  experience: { queuedMessages: Array<{ messageId: string }> };
                }>
              >((resolve, reject) => {
                const request = tx.objectStore("runs").getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
              db.close();
              return runs.some((run) =>
                run.experience.queuedMessages.some(
                  (message) => message.messageId === messageId,
                ),
              );
            }, pendingId),
          )
          .toBe(true);
        await page.reload();
        await expect(sparkMessage).toHaveAttribute(
          "data-message-id",
          pendingId!,
        );
        verifiedPendingMessage = true;
      }
      await sparkMessage
        .getByRole("button", { name: /Dismiss Spark message/ })
        .click();
    }
    const dismissCoaching = page.getByRole("button", {
      name: "Dismiss coaching message",
    });
    while (await dismissCoaching.isVisible()) await dismissCoaching.click();
    const dismissAdvisor = page.getByRole("button", { name: "Got it, Spark!" });
    while (await dismissAdvisor.isVisible()) {
      await dismissAdvisor.click();
    }
    // Dismissing an advisor can itself resume the run. Observe either valid
    // control on each retry rather than waiting on a start button React has
    // legitimately replaced between isVisible() and click().
    await expect(async () => {
      if (await page.getByTestId("button-pause-game").isVisible()) return;
      const resume = page.getByTestId("button-start-game");
      if (await resume.isDisabled({ timeout: 500 })) {
        await expect(resume).toHaveText("Run Complete");
        return;
      }
      await resume.click({ timeout: 500 });
    }).toPass({ timeout: 10_000 });
  };
  for (
    let iteration = 0;
    iteration < 2_000 &&
    state.clock.status !== "completed" &&
    state.clock.activeTick <= 1_800;
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
        for (const [current, required, selector] of upgrades) {
          if (current >= required) continue;
          const button = page.locator(selector);
          await expect(button).toBeVisible();
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
    // Each step is no longer than one engine interval, so no simulation tick
    // is skipped, while decorative animation frames do not swamp the canary.
    await page.clock.fastForward(1_000);
    await page.clock.fastForward(600);
    state = await savedState();
    if (heapSession && state.clock.activeTick >= nextHeapTick) {
      await sampleHeap("public-play");
      nextHeapTick += 300;
    }
  }
  expect(state.clock.status).toBe("completed");
  expect(state.clock.activeTick).toBeLessThanOrEqual(1_800);
  expect(verifiedPendingMessage).toBe(true);
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
  if (heapSession) {
    for (let sample = 1; sample <= 3; sample++) {
      await page.clock.runFor(30000);
      await sampleHeap(`completed-idle-${sample * 30}s`);
    }
    const plateau = heapSamples.slice(-3).map((sample) => sample.usedBytes);
    const evidence = {
      scope:
        "Existing public-control full-run canary including durable message reload, summary/bests persistence and completed-run reload",
      heapSamples,
      plateauDeltas: [plateau[1] - plateau[0], plateau[2] - plateau[1]],
      plateauGrowthBytes: plateau[2] - plateau[0],
      plateauDiagnosticToleranceBytes: 256 * 1024,
      boundary:
        "Three GC-controlled post-completion samples are a bounded plateau diagnostic, not proof of absence of all leaks",
    };
    await testInfo.attach("public-full-run-heap", {
      body: JSON.stringify(evidence, null, 2),
      contentType: "application/json",
    });
    expect(evidence.plateauGrowthBytes).toBeLessThanOrEqual(
      evidence.plateauDiagnosticToleranceBytes,
    );
  }
  expect(browserErrors).toEqual([]);
});
