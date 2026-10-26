import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("CI uses the immutable official browser image matching the locked package", () => {
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const version = lock.packages["node_modules/@playwright/test"].version;
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  expect(workflow).toMatch(
    new RegExp(
      `image: mcr\\.microsoft\\.com/playwright:v${version.replaceAll(".", "\\.")}-noble@sha256:[a-f0-9]{64}`,
    ),
  );
  expect(workflow).toContain("PLAYWRIGHT_BROWSERS_PATH: /ms-playwright");
  expect(workflow).toContain("node-version-file: .nvmrc");
  expect(workflow).toContain("npm run check:runtime");
  expect(workflow).toContain("--user 1001 --shm-size=1g");
  expect(workflow).not.toContain("playwright install --with-deps");
});

it.each(["development", "production"])(
  "Replit explicitly keeps optional collection off in %s",
  (environment) => {
    const configuration = readFileSync(".replit", "utf8");
    expect(configuration).toMatch(
      new RegExp(
        `\\[userenv\\.${environment}\\]\\s+TELEMETRY_ENABLED\\s*=\\s*"false"`,
      ),
    );
  },
);

it.each([
  ["save", "false"],
  ["ignore-scripts", "true"],
  ["engine-strict", "true"],
])("the project npm policy resolves %s=%s", (setting, expected) => {
  const env = { ...process.env };
  // Read the reviewed project defaults, not npm-run's inherited overrides.
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === `npm_config_${setting.replaceAll("-", "_")}`)
      delete env[key];
  }
  const value = execFileSync("npm", ["config", "get", setting], {
    encoding: "utf8",
    env,
  }).trim();
  expect(value).toBe(expected);
});
