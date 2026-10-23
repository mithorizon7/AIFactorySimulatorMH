import { execFileSync } from "node:child_process";

const options = {
  encoding: "utf8",
  env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
};
const sha = execFileSync("git", ["rev-parse", "HEAD"], options).trim();
if (!/^[a-f0-9]{40}$/.test(sha))
  throw new Error("A full Git revision is required.");
const dirty = execFileSync(
  "git",
  ["status", "--porcelain", "--untracked-files=normal"],
  options,
).trim();
if (dirty)
  throw new Error("Release builds require a clean source tree.");
for (const name of ["BUILD_SHA", "EXPECTED_BUILD_SHA"]) {
  if (process.env[name] && process.env[name] !== sha) {
    throw new Error(`${name} must match the checked-out revision.`);
  }
}
execFileSync("npm", ["ci", "--ignore-scripts"], {
  stdio: "inherit",
  env: process.env,
});
execFileSync("npm", ["run", "build:release"], {
  stdio: "inherit",
  env: { ...process.env, BUILD_SHA: sha, EXPECTED_BUILD_SHA: sha },
});
