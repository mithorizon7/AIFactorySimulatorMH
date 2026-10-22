import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessAudit } from '../../tools/audit-dependencies.mjs';

const issue = { nodes: ['node_modules/braces'], via: [{ url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm' }] };
const report = vulnerabilities => ({ vulnerabilities, metadata: { vulnerabilities: { total: Object.keys(vulnerabilities).length } } });

test('all advisories fail the gate, including development dependencies', () => {
  assert.deepEqual(assessAudit(report({ braces: issue }), { 'node_modules/braces': { dev: true } }).unexpected, ['braces']);
  assert.deepEqual(assessAudit(report({ braces: issue }), { 'node_modules/braces': {} }).unexpected, ['braces']);
});
test('only a complete zero-finding audit passes', () => {
  assert.deepEqual(assessAudit(report({})).unexpected, []);
});
test('scanner failure or incomplete output fails closed', () => {
  assert.throws(() => assessAudit({ error: { code: 'network' } }, {}));
  assert.throws(() => assessAudit({}, {}));
  assert.throws(() => assessAudit({ vulnerabilities: {}, metadata: { vulnerabilities: { total: 1 } } }, {}));
});
