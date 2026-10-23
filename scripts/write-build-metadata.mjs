import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const shaPattern = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i;
const candidate = process.env.BUILD_SHA ?? process.env.GIT_COMMIT_SHA ?? null;
const expected = process.env.EXPECTED_BUILD_SHA ?? null;
const requireBuildSha = process.env.REQUIRE_BUILD_SHA === "1";

if (candidate !== null && !shaPattern.test(candidate)) {
  throw new Error(
    "BUILD_SHA/GIT_COMMIT_SHA must be a full 40- or 64-character commit SHA.",
  );
}
if (expected !== null && candidate !== expected) {
  throw new Error(
    `Build SHA ${candidate ?? "null"} does not match expected SHA ${expected}.`,
  );
}
if (requireBuildSha && candidate === null) {
  throw new Error(
    "A release build requires BUILD_SHA or GIT_COMMIT_SHA to be a full commit SHA.",
  );
}

const metadata = `${JSON.stringify(
  { buildSha: candidate, builtAt: new Date().toISOString() },
  null,
  2,
)}\n`;
const targets = [
  path.resolve("dist/build-meta.json"),
  path.resolve("dist/public/build-meta.json"),
];

await Promise.all(
  targets.map(async (target) => {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, metadata, "utf8");
  }),
);

console.log(JSON.stringify({ buildSha: candidate, targets }));
