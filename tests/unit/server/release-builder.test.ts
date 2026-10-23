import { spawnSync } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const wrapper = path.resolve("tools/build-release.mjs");
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function fixture(commit = true) {
  const directory = await mkdtemp(path.join(tmpdir(), "release-builder-test-"));
  temporaryDirectories.push(directory);
  const repository = path.join(directory, "repository");
  const binaries = path.join(directory, "bin");
  const log = path.join(directory, "npm-calls.jsonl");
  await mkdir(repository);
  await mkdir(binaries);
  const git = (...args: string[]) => {
    const result = spawnSync("git", args, {
      cwd: repository,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: "/dev/null",
      },
    });
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  };
  git("init", "--quiet");
  git("config", "user.name", "Release Contract Test");
  git("config", "user.email", "release-test@example.invalid");
  await writeFile(path.join(repository, "source.txt"), "committed source\n");
  git("add", "source.txt");
  if (commit) git("commit", "--quiet", "-m", "Fixture source");
  // The stub records executable invocations without installing or building anything.
  const npm = path.join(binaries, "npm");
  await writeFile(
    npm,
    `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.RELEASE_TEST_LOG, JSON.stringify({
  args,
  buildSha: process.env.BUILD_SHA ?? null,
  expectedBuildSha: process.env.EXPECTED_BUILD_SHA ?? null,
}) + "\\n");
if (args[0] === process.env.RELEASE_TEST_FAIL_STAGE) process.exit(9);
`,
  );
  await chmod(npm, 0o755);
  const run = async (overrides: Record<string, string> = {}) => {
    const environment = { ...process.env };
    delete environment.BUILD_SHA;
    delete environment.EXPECTED_BUILD_SHA;
    const result = spawnSync(process.execPath, [wrapper], {
      cwd: repository,
      encoding: "utf8",
      env: {
        ...environment,
        PATH: `${binaries}${path.delimiter}${process.env.PATH}`,
        RELEASE_TEST_LOG: log,
        ...overrides,
      },
    });
    const calls = await readFile(log, "utf8")
      .then((content) =>
        content
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line)),
      )
      .catch((error) => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
    return { ...result, calls };
  };
  return { repository, run, sha: commit ? git("rev-parse", "HEAD") : null };
}

describe("production release builder executable contract", () => {
  it("installs without lifecycle scripts, then builds with verified Git identity", async () => {
    const { run, sha } = await fixture();
    const result = await run();
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls).toEqual([
      {
        args: ["ci", "--ignore-scripts"],
        buildSha: null,
        expectedBuildSha: null,
      },
      { args: ["run", "build:release"], buildSha: sha, expectedBuildSha: sha },
    ]);
  });

  it.each(["BUILD_SHA", "EXPECTED_BUILD_SHA"])(
    "rejects mismatching %s before npm runs",
    async (name) => {
      const { run } = await fixture();
      const result = await run({ [name]: "f".repeat(40) });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(`${name} must match`);
      expect(result.calls).toEqual([]);
    },
  );

  it("accepts explicitly matching build identities", async () => {
    const { run, sha } = await fixture();
    const result = await run({ BUILD_SHA: sha!, EXPECTED_BUILD_SHA: sha! });
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls).toHaveLength(2);
    expect(result.calls[1].buildSha).toBe(sha);
  });

  it("rejects tracked modifications before install or build", async () => {
    const { repository, run } = await fixture();
    await writeFile(
      path.join(repository, "source.txt"),
      "uncommitted change\n",
    );
    const result = await run();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("clean");
    expect(result.calls).toEqual([]);
  });

  it("rejects untracked source before claiming a commit identity", async () => {
    const { repository, run } = await fixture();
    await writeFile(
      path.join(repository, "untracked-source.js"),
      "export default 1;\n",
    );
    const result = await run();
    expect(result.status).not.toBe(0);
    expect(result.calls).toEqual([]);
  });

  it("rejects a repository with no valid commit before npm runs", async () => {
    const { run } = await fixture(false);
    const result = await run();
    expect(result.status).not.toBe(0);
    expect(result.calls).toEqual([]);
  });

  it("does not build when the clean install fails", async () => {
    const { run } = await fixture();
    const result = await run({ RELEASE_TEST_FAIL_STAGE: "ci" });
    expect(result.status).not.toBe(0);
    expect(result.calls.map((call) => call.args)).toEqual([
      ["ci", "--ignore-scripts"],
    ]);
  });

  it("propagates build failure after a successful clean install", async () => {
    const { run } = await fixture();
    const result = await run({ RELEASE_TEST_FAIL_STAGE: "run" });
    expect(result.status).not.toBe(0);
    expect(result.calls.map((call) => call.args)).toEqual([
      ["ci", "--ignore-scripts"],
      ["run", "build:release"],
    ]);
  });
});
