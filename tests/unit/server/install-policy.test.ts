import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

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
