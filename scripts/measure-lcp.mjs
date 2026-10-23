import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL;
const sampleCount = Number(process.env.LCP_SAMPLE_COUNT ?? 5);
const baseline = process.env.BASELINE_LCP_MS
  ? Number(process.env.BASELINE_LCP_MS)
  : null;

if (!baseUrl) throw new Error("BASE_URL is required.");
if (!Number.isInteger(sampleCount) || sampleCount < 3 || sampleCount > 15) {
  throw new Error("LCP_SAMPLE_COUNT must be an integer from 3 through 15.");
}
if (baseline !== null && (!Number.isFinite(baseline) || baseline <= 0)) {
  throw new Error("BASELINE_LCP_MS must be a positive finite number.");
}

const browser = await chromium.launch({ headless: true });
const samples = [];

try {
  for (let index = 0; index < sampleCount; index += 1) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1024 },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__aiFactoryLcp = 0;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const latest = entries.at(-1);
        if (latest) window.__aiFactoryLcp = latest.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(2_500);
    const lcp = await page.evaluate(() => window.__aiFactoryLcp ?? 0);
    await context.close();
    if (!Number.isFinite(lcp) || lcp <= 0) {
      throw new Error(`LCP sample ${index + 1} was unavailable.`);
    }
    samples.push(Number(lcp.toFixed(2)));
  }
} finally {
  await browser.close();
}

samples.sort((left, right) => left - right);
const median = samples[Math.floor(samples.length / 2)];
const output = { baseUrl, baseline, median, samples };
console.log(JSON.stringify(output));

if (baseline !== null) {
  const absoluteRegression = median - baseline;
  const relativeRegression = median / baseline - 1;
  if (absoluteRegression > 250 && relativeRegression > 0.2) {
    throw new Error(
      `Median LCP regressed by ${absoluteRegression.toFixed(2)} ms (${(
        relativeRegression * 100
      ).toFixed(2)}%).`,
    );
  }
}
