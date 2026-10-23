import { expect, test } from "@playwright/test";
import { RULESET_VERSION } from "../../shared/version";

test("legacy global persistence and ranking APIs are retired", async ({
  request,
}) => {
  const cases: Array<{ method: "get" | "post"; path: string; data?: object }> =
    [
      { method: "get", path: "/api/game-state" },
      { method: "post", path: "/api/game-state", data: {} },
      { method: "get", path: "/api/leaderboard" },
      { method: "post", path: "/api/leaderboard", data: {} },
      { method: "get", path: "/api/ranking/999999" },
    ];

  for (const apiCase of cases) {
    const response = await request[apiCase.method](apiCase.path, {
      data: apiCase.data,
    });
    expect(response.status(), apiCase.path).toBe(410);
    expect(response.headers()["x-request-id"], apiCase.path).toBeTruthy();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "LEGACY_ENDPOINT_RETIRED" },
      meta: { requestId: expect.any(String) },
    });
  }
});

test("health and version endpoints expose truthful nullable release identity", async ({
  request,
}) => {
  const health = await request.get("/api/healthz");
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toMatchObject({
    data: { status: "ok" },
    meta: { requestId: expect.any(String) },
  });

  const readiness = await request.get("/api/readyz");
  expect(readiness.status()).toBe(200);
  await expect(readiness.json()).resolves.toMatchObject({
    data: { status: "ready", rulesetLoaded: true, ruleset: "validated" },
    meta: { requestId: expect.any(String) },
  });

  const version = await request.get("/api/version");
  expect(version.status()).toBe(200);
  const versionBody = await version.json();
  expect(versionBody).toMatchObject({
    data: {
      rulesetVersion: RULESET_VERSION,
      snapshotVersion: 1,
      commandSchemaVersion: 1,
      migrationVersion: null,
      scoreAlgorithmVersion: null,
      profileClassifierVersion: null,
    },
    meta: { requestId: expect.any(String) },
  });
  expect(versionBody.data.buildSha).toBe(
    process.env.EXPECTED_BUILD_SHA ?? null,
  );
});

test("leaderboard controls and submissions are absent from the game", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("button-open-leaderboard")).toHaveCount(0);
  await expect(page.getByTestId("button-submit-leaderboard")).toHaveCount(0);
});
