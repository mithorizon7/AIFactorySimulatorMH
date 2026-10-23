import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { Buffer } from "node:buffer";
import { init, parse } from "es-module-lexer";

// The roadmap's "300 KB" uses a documented binary limit: 300 KiB = 307,200 bytes.
// Sum separate gzip-9 responses, not a fictitious concatenated compression stream.
export const INITIAL_GZIP_LIMIT = 300 * 1024;

export async function measureInitialJavaScript(publicDirectory) {
  await init;
  const base = path.resolve(publicDirectory);
  const html = await readFile(path.join(base, "index.html"), "utf8");
  const pending = [];
  const visited = new Set();
  const assets = [];
  const inline = [];
  const attribute = (tag, name) =>
    tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
  const resolve = (specifier, importer) => {
    const url = new URL(
      specifier,
      `https://bundle.invalid/${path.relative(base, importer).split(path.sep).join("/")}`,
    );
    if (url.origin !== "https://bundle.invalid")
      throw new Error(
        `External initial JavaScript cannot escape the budget: ${specifier}`,
      );
    const local = path.resolve(base, `.${decodeURIComponent(url.pathname)}`);
    if (!local.startsWith(`${base}${path.sep}`))
      throw new Error("Initial module escapes public directory");
    return {
      file: local,
      key: `${url.pathname}${url.search}`,
      query: url.search,
    };
  };
  const follow = (source, importer) => {
    const [imports] = parse(source);
    for (const item of imports) {
      if (item.d !== -1) continue; // dynamic chunks are verified absent at startup in the browser gate
      if (!item.n) throw new Error("Unresolved static initial import");
      pending.push(resolve(item.n, importer));
    }
  };
  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    const type = attribute(match[1], "type");
    if (
      type &&
      !["module", "text/javascript", "application/javascript"].includes(type)
    )
      continue;
    const src = attribute(match[1], "src");
    if (src) pending.push(resolve(src, path.join(base, "index.html")));
    else if (match[2].trim()) {
      inline.push(Buffer.from(match[2]));
      follow(match[2], path.join(base, "index.html"));
    }
  }
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attribute(match[0], "rel");
    if (
      rel === "modulepreload" ||
      (rel === "preload" && attribute(match[0], "as") === "script")
    ) {
      const href = attribute(match[0], "href");
      if (!href) throw new Error("Initial preload has no URL");
      pending.push(resolve(href, path.join(base, "index.html")));
    }
  }
  while (pending.length) {
    const asset = pending.pop();
    if (visited.has(asset.key)) continue;
    visited.add(asset.key);
    const bytes = await readFile(asset.file);
    follow(bytes.toString("utf8"), asset.file);
    assets.push({
      path: `${path.relative(base, asset.file)}${asset.query}`,
      bytes: bytes.length,
      gzipBytes: gzipSync(bytes, { level: 9 }).length,
    });
  }
  if (!assets.length && !inline.length)
    throw new Error("No initial JavaScript found");
  return {
    assets: assets.sort((a, b) => a.path.localeCompare(b.path)),
    inlineScripts: inline.length,
    currentBytes:
      assets.reduce((total, item) => total + item.bytes, 0) +
      inline.reduce((total, item) => total + item.length, 0),
    gzipBytes:
      assets.reduce((total, item) => total + item.gzipBytes, 0) +
      inline.reduce(
        (total, item) => total + gzipSync(item, { level: 9 }).length,
        0,
      ),
    gzipLimitBytes: INITIAL_GZIP_LIMIT,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = process.cwd();
  const baseline = JSON.parse(
    await readFile(path.join(root, "tests/baselines/release-a.json"), "utf8"),
  );
  const result = await measureInitialJavaScript(path.join(root, "dist/public"));
  const maximumBytes = Math.floor(
    baseline.initialJavaScriptBytes *
      (1 + baseline.maximumUnexplainedIncreaseRatio),
  );
  console.log(
    JSON.stringify({
      ...result,
      baselineBytes: baseline.initialJavaScriptBytes,
      maximumBytes,
      changePercent: Number(
        (
          (result.currentBytes / baseline.initialJavaScriptBytes) * 100 -
          100
        ).toFixed(2),
      ),
    }),
  );
  if (result.currentBytes > maximumBytes)
    throw new Error(
      "Complete initial JavaScript exceeds the Release A regression floor",
    );
  if (result.gzipBytes > INITIAL_GZIP_LIMIT)
    throw new Error("Complete initial JavaScript exceeds 300 KiB gzip");
}
