import { afterEach, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
// The executable helper is intentionally also importable for isolated fixtures.
// @ts-expect-error JavaScript CLI has no separate declaration file.
import {
  measureInitialJavaScript,
  INITIAL_GZIP_LIMIT,
} from "../../../scripts/check-bundle-budget.mjs";

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(
    temporary
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});
async function fixture(html: string, modules: Record<string, string>) {
  const directory = await mkdtemp(path.join(tmpdir(), "initial-graph-"));
  temporary.push(directory);
  await writeFile(path.join(directory, "index.html"), html);
  for (const [name, source] of Object.entries(modules)) {
    await mkdir(path.dirname(path.join(directory, name)), { recursive: true });
    await writeFile(path.join(directory, name), source);
  }
  return directory;
}
it("counts shared static dependencies, cycles, preload roots and inline code exactly once", async () => {
  const modules = {
    "assets/main.js": 'import "./shared.js"; import("./lazy.js");',
    "assets/shared.js": 'export { value } from "./leaf.js";',
    "assets/leaf.js": 'import "./main.js"; export const value = 1;',
    "assets/preloaded.js": 'import "./shared.js";',
    "assets/lazy.js": 'throw new Error("must not be initial");',
  };
  const html =
    '<script type="module" src="/assets/main.js"></script><link rel="modulepreload" href="/assets/preloaded.js"><script>globalThis.ready = true;</script>';
  const result = await measureInitialJavaScript(await fixture(html, modules));
  expect(result.assets.map((item: { path: string }) => item.path)).toEqual([
    "assets/leaf.js",
    "assets/main.js",
    "assets/preloaded.js",
    "assets/shared.js",
  ]);
  expect(result.inlineScripts).toBe(1);
  const initial = Object.entries(modules)
    .filter(([name]) => name !== "assets/lazy.js")
    .map(([, source]) => source);
  initial.push("globalThis.ready = true;");
  expect(result.currentBytes).toBe(
    initial.reduce((sum, source) => sum + Buffer.byteLength(source), 0),
  );
  expect(result.gzipBytes).toBe(
    initial.reduce(
      (sum, source) => sum + gzipSync(source, { level: 9 }).length,
      0,
    ),
  );
  expect(INITIAL_GZIP_LIMIT).toBe(307200);
});
it("fails closed for externally hosted static JavaScript instead of hiding it from the budget", async () => {
  const directory = await fixture(
    '<script type="module" src="https://external.invalid/main.js"></script>',
    {},
  );
  await expect(measureInitialJavaScript(directory)).rejects.toThrow(
    /External initial JavaScript/,
  );
});
it("does not mistake text inside strings or dynamic imports for static startup imports", async () => {
  const directory = await fixture(
    '<script type="module" src="/main.js"></script>',
    {
      "main.js":
        'const note = "import x from imaginary"; export const lazy = () => import("./not-built-yet.js");',
    },
  );
  expect((await measureInitialJavaScript(directory)).assets).toHaveLength(1);
});

it("counts query-distinct initial response URLs rather than deduplicating only their disk path", async () => {
  const directory = await fixture(
    '<script type="module" src="/main.js?a"></script><link rel="modulepreload" href="/main.js?b">',
    { "main.js": "export const ready = true;" },
  );
  const result = await measureInitialJavaScript(directory);
  expect(result.assets.map((item: { path: string }) => item.path)).toEqual([
    "main.js?a",
    "main.js?b",
  ]);
  expect(result.currentBytes).toBe(
    2 * Buffer.byteLength("export const ready = true;"),
  );
});
