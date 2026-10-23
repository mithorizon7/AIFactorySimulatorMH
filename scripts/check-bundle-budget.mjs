import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const baseline = JSON.parse(
  await readFile(path.join(root, "tests/baselines/release-a.json"), "utf8"),
);
const assetsDirectory = path.join(root, "dist/public/assets");
const assetNames = await readdir(assetsDirectory);
const initialJavaScript = assetNames.filter((name) =>
  /^index-.*\.js$/.test(name),
);

if (initialJavaScript.length !== 1) {
  throw new Error(
    `Expected one initial index JavaScript asset, found ${initialJavaScript.length}: ${initialJavaScript.join(", ")}`,
  );
}

const currentBytes = (
  await stat(path.join(assetsDirectory, initialJavaScript[0]))
).size;
const maximumBytes = Math.floor(
  baseline.initialJavaScriptBytes *
    (1 + baseline.maximumUnexplainedIncreaseRatio),
);
const changeRatio = currentBytes / baseline.initialJavaScriptBytes - 1;

console.log(
  JSON.stringify({
    baselineBytes: baseline.initialJavaScriptBytes,
    currentBytes,
    maximumBytes,
    changePercent: Number((changeRatio * 100).toFixed(2)),
  }),
);

if (currentBytes > maximumBytes) {
  throw new Error(
    `Initial JavaScript is ${currentBytes} bytes, above the ${maximumBytes}-byte regression floor.`,
  );
}
