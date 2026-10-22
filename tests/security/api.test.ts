import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import { get, type Server } from 'node:http';
import { configureSecurity } from '../../server/security';
import { saveOwnerHash } from '../../server/security';
import { registerRoutes } from '../../server/routes';
import { MemStorage } from '../../server/storage';
import { globalErrorHandler, notFoundHandler } from '../../server/errorHandler';
import { logger } from '../../server/logger';

let server: Server;
let base: string;
const save = { intelligence: 100, timeRemaining: 50, money: 1000, resourceCompute: 10,
  resourceData: 10, resourceAlgorithm: 10, computeLevel: 1, dataLevel: 1,
  algorithmLevel: 1, unlockedBreakthroughs: [] };
const score = { playerName: 'Player', finalIntelligence: 100_000, totalTimeElapsed: 200,
  peakMoney: 1000, totalMoneyEarned: 1000, peakB2BSubscribers: 10, peakB2CSubscribers: 10,
  breakthroughsUnlocked: 21, erasReached: 6, hasAchievedAGI: true };
const post = (path: string, data: unknown, headers = {}) => fetch(base + path, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data),
});

before(async () => {
  const app = express();
  configureSecurity(app);
  app.use(express.json({ limit: '16kb', inflate: false }));
  server = await registerRoutes(app, new MemStorage());
  app.use(notFoundHandler);
  app.use(globalErrorHandler);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));

test('saves are isolated, do not expose owner hashes, and replace rather than append', async () => {
  assert.equal((await fetch(base + '/api/game-state')).status, 404);
  const first = await post('/api/game-state', save);
  assert.equal(first.status, 200);
  const cookie = first.headers.get('set-cookie')!;
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  const data = (await first.json()).data;
  assert.equal(data.ownerHash, undefined);
  assert.equal((await fetch(base + '/api/game-state')).status, 404);
  const second = await post('/api/game-state', { ...save, intelligence: 200 });
  const secondCookie = second.headers.get('set-cookie')!.split(';')[0];
  assert.equal((await (await fetch(base + '/api/game-state', { headers: { Cookie: secondCookie } })).json()).data.intelligence, 200);
  const ownerCookie = cookie.split(';')[0];
  const updated = await post('/api/game-state', { ...save, intelligence: 300 }, { Cookie: ownerCookie });
  assert.equal((await updated.json()).data.id, data.id);
  assert.equal((await (await fetch(base + '/api/game-state', { headers: { Cookie: ownerCookie } })).json()).data.intelligence, 300);
});

test('caller cannot assign ownership or provide arbitrary JSON breakthroughs', async () => {
  assert.equal((await post('/api/game-state', { ...save, userId: 1 })).status, 400);
  assert.equal((await post('/api/game-state', { ...save, ownerHash: 'forged' })).status, 400);
  assert.equal((await post('/api/game-state', { ...save, unlockedBreakthroughs: {} })).status, 400);
  assert.equal((await post('/api/game-state', { ...save, unlockedBreakthroughs: [22] })).status, 400);
});

test('rejects cross-site writes, disallowed hosts, non-JSON and compressed requests', async () => {
  assert.equal((await post('/api/game-state', save, { Origin: 'https://untrusted.example' })).status, 403);
  assert.equal((await post('/api/game-state', save, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  const hostStatus = await new Promise<number | undefined>((resolve, reject) => {
    get(base + '/api/breakthroughs', { headers: { Host: 'untrusted.example' } }, res => {
      res.resume(); resolve(res.statusCode);
    }).on('error', reject);
  });
  assert.equal(hostStatus, 403);
  assert.equal((await fetch(base + '/api/game-state', { method: 'POST', body: 'text' })).status, 415);
  assert.equal((await post('/api/game-state', save, { 'Content-Encoding': 'br' })).status, 415);
});

test('bad JSON and excessive bodies return bounded 4xx responses without stack traces', async () => {
  const bad = await fetch(base + '/api/game-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).details, undefined);
  assert.equal((await post('/api/game-state', { value: 'x'.repeat(17_000) })).status, 413);
});

test('numeric queries reject suffixes, arrays and integer overflows', async () => {
  for (const path of ['/api/leaderboard?limit=1junk', '/api/leaderboard?limit=1&limit=2', '/api/ranking/1e9', '/api/ranking/9999999999999999']) {
    assert.equal((await fetch(base + path)).status, 400);
  }
});

test('leaderboard has server-side bounds and submission rate limits', async () => {
  assert.equal((await post('/api/leaderboard', { ...score, playerName: 'x'.repeat(31) })).status, 400);
  assert.equal((await post('/api/leaderboard', { ...score, totalTimeElapsed: -1 })).status, 400);
  assert.equal((await post('/api/leaderboard', { ...score, hasAchievedAGI: false })).status, 400);
  assert.equal((await post('/api/leaderboard', score)).status, 200);
  await post('/api/leaderboard', score);
  assert.equal((await post('/api/leaderboard', score)).status, 429);
  const firstSave = await post('/api/game-state', save);
  const firstOwner = firstSave.headers.get('set-cookie')!.split(';')[0];
  let id;
  for (let count = 0; count < 5; count++) {
    const response = await post('/api/leaderboard', score, { Cookie: firstOwner });
    assert.equal(response.status, 200);
    const data = (await response.json()).data;
    assert.equal(data.ownerHash, undefined);
    if (id !== undefined) assert.equal(data.id, id);
    id = data.id;
  }
  assert.equal((await post('/api/leaderboard', score, { Cookie: firstOwner })).status, 429);
  const secondSave = await post('/api/game-state', save);
  const secondOwner = secondSave.headers.get('set-cookie')!.split(';')[0];
  assert.equal((await post('/api/leaderboard', score, { Cookie: secondOwner })).status, 200);
});

test('responses have privacy and browser security headers', async () => {
  const res = await fetch(base + '/api/breakthroughs');
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.match(res.headers.get('content-security-policy')!, /frame-ancestors 'none'/);
});

test('production ownership cookies have secure host-only attributes', () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    let recorded: { name: string; options: Record<string, unknown> } | undefined;
    const req = { headers: {} } as Parameters<typeof saveOwnerHash>[0];
    const res = { cookie(name: string, _value: string, options: Record<string, unknown>) { recorded = { name, options }; } } as Parameters<typeof saveOwnerHash>[1];
    assert.match(saveOwnerHash(req, res, true)!, /^[a-f0-9]{64}$/);
    assert.equal(recorded!.name, '__Host-ai-factory-save');
    assert.deepEqual(recorded!.options, { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 2_592_000_000 });
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('logger drops request bodies, URLs, arguments and underlying error details', () => {
  const output: string[] = [];
  const original = console.log;
  console.log = (line: string) => output.push(line);
  try {
    logger.logDatabaseError('test', new Error('sensitive-sentinel'), { password: 'sensitive-sentinel' }, { requestBody: 'sensitive-sentinel', url: '?token=sensitive-sentinel' });
  } finally { console.log = original; }
  assert.equal(output.length, 1);
  assert.ok(!output[0].includes('sensitive-sentinel'));
});
