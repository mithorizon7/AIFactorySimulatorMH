import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const baseURL = process.env.BASE_URL;
if (!baseURL)
  throw new Error(
    "BASE_URL is required; measurements are never inferred from a build",
  );
const ignoreHTTPSErrors = process.env.LOCAL_TEST_TLS === "1";
if (
  ignoreHTTPSErrors &&
  !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)
)
  throw new Error("The test certificate exception is loopback-only");
const browser = await chromium.launch({ headless: true });
const samples = [];
let report;
try {
  for (let sample = 0; sample < 5; sample++) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1024 },
      reducedMotion: "reduce",
      ignoreHTTPSErrors,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__performanceEvidence = { lcp: 0, cls: 0, longTasks: [] };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          window.__performanceEvidence.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput)
            window.__performanceEvidence.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (window.__performanceEvidence.longTasks.length < 500)
            window.__performanceEvidence.longTasks.push({
              start: entry.startTime,
              duration: entry.duration,
            });
      }).observe({ type: "longtask", buffered: true });
    });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    samples.push(await page.evaluate(() => window.__performanceEvidence));
    await context.close();
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    reducedMotion: "reduce",
    ignoreHTTPSErrors,
  });
  const page = await context.newPage();
  await page.goto(baseURL);
  await page.getByRole("button", { name: "Open my lab" }).click();
  await page.getByTestId("button-start-game").click();
  await page.evaluate(() => {
    window.__steadyTasks = [];
    const start = window.performance.now();
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (entry.startTime > start + 5000 && window.__steadyTasks.length < 500)
          window.__steadyTasks.push(entry.duration);
    }).observe({ type: "longtask" });
  });
  await page.waitForTimeout(30000);
  const steadyTasks = await page.evaluate(() => window.__steadyTasks);
  await context.close();

  const heapContext = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    reducedMotion: "reduce",
    ignoreHTTPSErrors,
  });
  const heapPage = await heapContext.newPage();
  await heapPage.clock.install();
  await heapPage.goto(baseURL);
  await heapPage.getByRole("button", { name: "Open my lab" }).click();
  await heapPage.getByTestId("button-start-game").click();
  const session = await heapContext.newCDPSession(heapPage);
  const heapSamples = [];
  for (let minutes = 5; minutes <= 30; minutes += 5) {
    await heapPage.clock.runFor(5 * 60 * 1000);
    await session.send("HeapProfiler.collectGarbage");
    const heap = await session.send("Runtime.getHeapUsage");
    heapSamples.push({
      simulatedMinutes: minutes,
      usedBytes: heap.usedSize,
      activeTime: await heapPage.getByTestId("active-time").textContent(),
    });
  }
  const heapGrowthBytes =
    heapSamples.at(-1).usedBytes - heapSamples[0].usedBytes;
  const lcp = samples.map((sample) => sample.lcp).sort((a, b) => a - b);
  report = {
    baseURL,
    scope:
      "Local Chromium production-mode startup, 30-second active GNT-2 steady state, and 30-minute accelerated no-investment GNT-2 soak; not a full-run, all-device or production-host qualification",
    coldNavigations: samples,
    medianLcpMilliseconds: lcp[2],
    maximumCls: Math.max(...samples.map((sample) => sample.cls)),
    steadyStateTasksOver50ms: steadyTasks,
    heapSamples,
    heapGrowthBytes,
    gates: {
      lcpAtMost2500ms: lcp.every((value) => value > 0) && lcp[2] <= 2500,
      clsAtMostPointOne: samples.every((sample) => sample.cls <= 0.1),
      noRecurringSteadyTasksOver50ms: steadyTasks.length < 2,
      gcHeapGrowthWithin5MiB: heapGrowthBytes <= 5 * 1024 * 1024,
      acceleratedRunAtLeast30ActiveMinutes: (() => {
        const [minutes, seconds] = heapSamples
          .at(-1)
          .activeTime.split(":")
          .map(Number);
        return minutes * 60 + seconds >= 1800;
      })(),
    },
    heapBoundary:
      "GC-controlled retained-heap drift is reported with a 5 MiB diagnostic tolerance; this does not prove absence of all leaks or replace full-game profiling",
  };
  await heapContext.close();
} finally {
  await browser.close();
}
const output = process.argv.indexOf("--output");
if (output >= 0) {
  if (!process.argv[output + 1]) throw new Error("--output requires a path");
  await writeFile(
    process.argv[output + 1],
    `${JSON.stringify(report, null, 2)}\n`,
  );
}
console.log(JSON.stringify(report));
if (Object.values(report.gates).some((passed) => !passed)) process.exitCode = 1;
