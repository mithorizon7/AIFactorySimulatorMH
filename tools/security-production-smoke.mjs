import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = 'http://127.0.0.1:5017';
await mkdir('output/security/2026-10-22', { recursive: true, mode: 0o700 });
const child = spawn(process.execPath, ['dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'production', PUBLIC_HOSTS: '127.0.0.1', HOST: '127.0.0.1', PORT: '5017', DATABASE_URL: '', REPL_ID: '' },
  stdio: 'ignore',
});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await fetch(base)).ok; } catch { /* Wait for this child only. */ }
    if (ready) break;
    if (child.exitCode !== null) throw new Error('Production server exited before becoming ready');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Production server must start');
  const response = await fetch(base);
  assert.match(response.headers.get('content-security-policy'), /script-src 'self';/);
  assert.ok(!response.headers.get('content-security-policy').includes('unsafe-eval'));
  assert.equal((await fetch(base + '/api/unknown')).status, 404);
  const health = await (await fetch(base + '/api/health')).json();
  assert.match(health.release, /^[a-f0-9]{40}(-dirty)?$/);
  const html = await response.text();
  const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/)[1];
  assert.equal((await fetch(base + asset)).status, 200);
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  // This bundled browser is used only for local test pages, never general browsing.
  await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('dialog', { name: 'Welcome to AI Factory!' }).waitFor();
  await page.screenshot({ path: 'output/security/2026-10-22/production-desktop.png' });
  await page.getByRole('button', { name: 'Skip Tutorial' }).click();
  await page.getByTestId('button-start-game').click();
  await page.getByTestId('button-pause-game').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'output/security/2026-10-22/production-mobile.png' });
  assert.deepEqual(errors, [], 'Production page should have no uncaught errors');
  console.log(JSON.stringify({ status: 'passed', node: process.version, browser: browser.version(), checks: ['production boot', 'static asset', 'CSP', 'API 404', 'welcome dialog', 'start gameplay', 'desktop/mobile screenshots', 'no uncaught page errors'] }));
} finally {
  await browser?.close();
  if (child.exitCode === null) {
    const exit = once(child, 'exit');
    child.kill('SIGTERM');
    await exit;
  }
}
