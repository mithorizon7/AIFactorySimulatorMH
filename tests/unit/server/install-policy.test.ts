import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

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
