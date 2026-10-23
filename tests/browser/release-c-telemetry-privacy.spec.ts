import { expect, test, type Page } from "@playwright/test";
import { z } from "zod";
import type { GameStateV2 } from "../../shared/game/schemas/state";
import {
  OUTBOX_STORE,
  outboxRecordSchema,
  telemetryBatchSchema,
  type OutboxRecord,
} from "../../shared/telemetry/contracts";

const consentKey = "ai-factory.analytics-consent";
const consentLabel = "Share optional anonymous product analytics";
const versionSchema = z
  .object({
    data: z
      .object({
        buildSha: z.string().regex(/^[a-f0-9]{40}$/),
        telemetry: z.literal("not_configured"),
      })
      .passthrough(),
  })
  .passthrough();

test.use({ reducedMotion: "reduce" });

/** Dedicated HTTPS-fixture suite: no event/research request is forwarded. */
async function localTelemetry(
  page: Page,
  baseURL: string | undefined,
  ready: boolean,
) {
  if (!baseURL) throw new Error("Local browser baseURL is required");
  const origin = new URL(baseURL).origin;
  if (!/^https:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))
    throw new Error("Telemetry privacy fixtures are loopback HTTPS only");
  const versionResponse = await page.request.get(`${origin}/api/version`);
  expect(versionResponse.ok()).toBe(true);
  const actualVersion = versionSchema.parse(await versionResponse.json());
  if (process.env.EXPECTED_BUILD_SHA)
    expect(actualVersion.data.buildSha).toBe(process.env.EXPECTED_BUILD_SHA);
  const posts: Array<{
    url: string;
    headers: Record<string, string>;
    body: unknown;
  }> = [];
  const researchRequests: string[] = [];
  let browserVersionRequests = 0;
  page.context().on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname === "/api/version")
      browserVersionRequests++;
  });
  await page.context().route(
    (url) => url.pathname === "/api/v1/events",
    async (route) => {
      const request = route.request();
      expect(new URL(request.url()).origin).toBe(origin);
      expect(request.method()).toBe("POST");
      posts.push({
        url: request.url(),
        headers: await request.allHeaders(),
        body: request.postDataJSON(),
      });
      // Deliberately unacknowledged, so the real SDK keeps a real queued record
      // for the opt-out purge assertion. This response never reaches a provider.
      await route.fulfill({ status: 202, json: { acceptedEventIds: [] } });
    },
  );
  await page.context().route(
    (url) => /^\/api\/v1\/research(?:\/|$)/.test(url.pathname),
    async (route) => {
      researchRequests.push(route.request().url());
      await route.abort("blockedbyclient");
    },
  );
  if (ready) {
    await page.context().route(`${origin}/api/version`, async (route) => {
      const response = await route.fetch();
      const original = versionSchema.parse(await response.json());
      expect(original.data.buildSha).toBe(actualVersion.data.buildSha);
      // Preserve the actual local build SHA and every other version field.
      await route.fulfill({
        response,
        json: { ...original, data: { ...original.data, telemetry: "ready" } },
      });
    });
  }
  return {
    posts,
    researchRequests,
    actualVersion,
    versionRequests: () => browserVersionRequests,
  };
}

async function openLab(page: Page) {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Open my lab", exact: true }).click();
  await expect(page.getByTestId("session-status")).toContainText(
    "Saved on this device",
  );
  await expect(
    page.getByRole("checkbox", { name: consentLabel }),
  ).toBeVisible();
  await page.clock.runFor(600);
}

/** Read only: no game or telemetry fixtures are inserted into IndexedDB. */
async function localState(page: Page) {
  return page.evaluate(async (outboxStore) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("ai-factory");
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
      opening.onblocked = () =>
        reject(new Error("Storage observation blocked"));
      opening.onupgradeneeded = () => opening.transaction?.abort();
    });
    try {
      const stores = [
        "runs",
        ...(database.objectStoreNames.contains(outboxStore)
          ? [outboxStore]
          : []),
      ];
      const transaction = database.transaction(stores, "readonly");
      const read = <T>(request: IDBRequest<T>) =>
        new Promise<T>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      const runsRequest = transaction
        .objectStore("runs")
        .getAll() as IDBRequest<
        Array<{ runId: string; savedAt: string; simulation: GameStateV2 }>
      >;
      const outboxRequest = stores.includes(outboxStore)
        ? read(
            transaction.objectStore(outboxStore).getAll() as IDBRequest<
              OutboxRecord[]
            >,
          )
        : Promise.resolve([] as OutboxRecord[]);
      const [runs, outbox] = await Promise.all([
        read(runsRequest),
        outboxRequest,
      ]);
      const latest = runs.sort(
        (left, right) => Date.parse(right.savedAt) - Date.parse(left.savedAt),
      )[0];
      return {
        run: latest
          ? {
              runId: latest.runId,
              rulesetVersion: latest.simulation.rulesetVersion,
              activeTick: latest.simulation.clock.activeTick,
              status: latest.simulation.clock.status,
              computeLevel: latest.simulation.levels.compute,
              money: latest.simulation.money,
            }
          : null,
        outbox,
      };
    } finally {
      database.close();
    }
  }, OUTBOX_STORE);
}

async function startAndPause(page: Page) {
  await page.getByTestId("button-start-game").click();
  await expect(page.getByTestId("button-pause-game")).toBeVisible();
  await page.clock.runFor(2200);
  await expect(page.getByTestId("active-time")).not.toHaveText("0:00");
  await page.getByTestId("button-pause-game").click();
  await page.clock.runFor(600);
  await expect
    .poll(async () => (await localState(page)).run?.status)
    .toBe("paused");
}

async function expectQuiet(
  page: Page,
  fixture: Awaited<ReturnType<typeof localTelemetry>>,
) {
  const sent = fixture.posts.length;
  // Exercise more than one real SDK 5-second reconciliation interval, with
  // controlled browser time rather than an arbitrary short wall-clock sleep.
  await page.clock.runFor(11000);
  expect((await localState(page)).outbox).toEqual([]);
  expect(fixture.posts).toHaveLength(sent);
  expect(fixture.researchRequests).toEqual([]);
}

test("default-off blocks event POSTs even when the local version fixture is ready, while gameplay saves", async ({
  page,
  baseURL,
}) => {
  const fixture = await localTelemetry(page, baseURL, true);
  await openLab(page);
  await expect(
    page.getByRole("checkbox", { name: consentLabel }),
  ).not.toBeChecked();
  await startAndPause(page);
  const before = (await localState(page)).run;
  expect(before?.activeTick).toBeGreaterThan(0);
  await expectQuiet(page, fixture);
  expect(fixture.posts).toEqual([]);
  expect(fixture.versionRequests()).toBe(0);
  await page.reload();
  await expect(page.getByTestId("button-start-game")).toContainText("Resume");
  expect((await localState(page)).run).toEqual(before);
  await expectQuiet(page, fixture);
  expect(fixture.posts).toEqual([]);
});

test("an emulated browser GPC signal overrides stored opt-in and disables event capture", async ({
  page,
  baseURL,
}, testInfo) => {
  const fixture = await localTelemetry(page, baseURL, true);
  await page.addInitScript(
    ({ key }) => {
      Object.defineProperty(navigator, "globalPrivacyControl", {
        configurable: true,
        get: () => true,
      });
      localStorage.setItem(key, "yes");
    },
    { key: consentKey },
  );
  await openLab(page);
  const consent = page.getByRole("checkbox", { name: consentLabel });
  await expect(consent).not.toBeChecked();
  await expect(consent).toBeDisabled();
  await expect(
    page.getByText(/Global Privacy Control is active/),
  ).toBeVisible();
  await startAndPause(page);
  await expectQuiet(page, fixture);
  expect(fixture.posts).toEqual([]);
  expect(fixture.versionRequests()).toBe(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), consentKey),
  ).toBe("yes");
  await page
    .locator('section[aria-labelledby="ai-factory-analytics-consent-heading"]')
    .screenshot({ path: testInfo.outputPath("gpc-analytics-off.png") });
});

test("explicit opt-in captures a closed real-Start event; opt-out purges the queue and preserves play/save", async ({
  page,
  baseURL,
}) => {
  const fixture = await localTelemetry(page, baseURL, true);
  await openLab(page);
  const consent = page.getByRole("checkbox", { name: consentLabel });
  await consent.check();
  await expect(consent).toBeChecked();
  expect(fixture.posts).toEqual([]);
  await startAndPause(page);
  await expect.poll(() => fixture.posts.length).toBeGreaterThan(0);
  await expect.poll(async () => (await localState(page)).outbox.length).toBe(1);
  const queued = await localState(page);
  const before = queued.run;
  expect(outboxRecordSchema.parse(queued.outbox[0])).toEqual(queued.outbox[0]);
  for (const post of fixture.posts) {
    const batch = telemetryBatchSchema.parse(post.body);
    expect(batch).toEqual(post.body);
    expect(batch.events).toHaveLength(1);
    expect(batch.events[0]).toEqual(queued.outbox[0].event);
    expect(batch.events[0]).toMatchObject({
      type: "run_started",
      properties: {},
      runId: before?.runId,
      rulesetVersion: before?.rulesetVersion,
      buildSha: fixture.actualVersion.data.buildSha,
    });
    expect(post.headers.cookie).toBeUndefined();
    expect(post.headers.authorization).toBeUndefined();
  }
  // The controlled checkbox settles after the real async IndexedDB purge;
  // click plus an awaited state assertion models that UI contract.
  await consent.click();
  await expect(consent).not.toBeChecked();
  await expect(consent).toBeEnabled();
  await expect.poll(async () => (await localState(page)).outbox.length).toBe(0);
  const sentBeforeMorePlay = fixture.posts.length;
  await page.getByRole("tab", { name: "Resources", exact: true }).click();
  await page
    .getByRole("tabpanel")
    .getByRole("button", { name: /^Invest in compute/ })
    .click();
  await page.clock.runFor(600);
  await expect
    .poll(async () => (await localState(page)).run?.computeLevel)
    .toBe(2);
  const saved = (await localState(page)).run;
  expect(saved?.runId).toBe(before?.runId);
  expect(saved?.money).toBeLessThan(before!.money);
  await expectQuiet(page, fixture);
  expect(fixture.posts).toHaveLength(sentBeforeMorePlay);
  await page.reload();
  await expect(page.getByTestId("button-start-game")).toContainText("Resume");
  await expect(
    page.getByRole("checkbox", { name: consentLabel }),
  ).not.toBeChecked();
  expect((await localState(page)).run).toEqual(saved);
  await expectQuiet(page, fixture);
  expect(fixture.posts).toHaveLength(sentBeforeMorePlay);
});

test("the actual not_configured backend prevents queueing and transmission despite explicit opt-in", async ({
  page,
  baseURL,
}) => {
  // No version interception in this case: readiness is the actual local server.
  const fixture = await localTelemetry(page, baseURL, false);
  await openLab(page);
  const consent = page.getByRole("checkbox", { name: consentLabel });
  await consent.check();
  await expect(consent).toBeChecked();
  const actualBrowserVersion = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/version",
  );
  await startAndPause(page);
  expect(
    versionSchema.parse(await (await actualBrowserVersion).json()).data
      .telemetry,
  ).toBe("not_configured");
  await expect.poll(() => fixture.versionRequests()).toBeGreaterThan(0);
  await expectQuiet(page, fixture);
  expect(fixture.posts).toEqual([]);
  expect((await localState(page)).run?.activeTick).toBeGreaterThan(0);
});

test("a real second-tab opt-out refreshes the first tab and removes its queued analytics", async ({
  page,
  context,
  baseURL,
}) => {
  const fixture = await localTelemetry(page, baseURL, true);
  await openLab(page);
  await page.getByRole("checkbox", { name: consentLabel }).check();
  await startAndPause(page);
  await expect.poll(async () => (await localState(page)).outbox.length).toBe(1);
  const saved = (await localState(page)).run;
  const other = await context.newPage();
  try {
    await other.goto("/");
    await expect(other.getByTestId("session-status")).toContainText(
      "Read-only",
    );
    const otherConsent = other.getByRole("checkbox", { name: consentLabel });
    await expect(otherConsent).toBeChecked();
    await otherConsent.click();
    await expect(otherConsent).not.toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: consentLabel }),
    ).not.toBeChecked();
    await expect
      .poll(async () => (await localState(page)).outbox.length)
      .toBe(0);
    await expectQuiet(page, fixture);
    expect((await localState(page)).run).toEqual(saved);
  } finally {
    await other.close();
  }
});
