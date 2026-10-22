import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const gitOptions = { encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } };
const revision = execFileSync('git', ['rev-parse', 'HEAD'], gitOptions).trim();
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('A verified Git revision is required to build.');
const dirty = execFileSync('git', ['status', '--porcelain'], gitOptions).trim().length > 0;
await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  packages: 'external',
  format: 'esm',
  outdir: 'dist',
  define: { __RELEASE_SHA__: JSON.stringify(revision + (dirty ? '-dirty' : '')) },
});
