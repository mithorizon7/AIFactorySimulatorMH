import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function assessAudit(report) {
  if (report.error || !report.vulnerabilities || !report.metadata?.vulnerabilities) {
    throw new Error('Dependency audit did not return a complete result.');
  }
  const total = report.metadata.vulnerabilities.total;
  if (!Number.isSafeInteger(total) || total !== Object.keys(report.vulnerabilities).length) {
    throw new Error('Dependency audit totals do not match its findings.');
  }
  return { unexpected: Object.keys(report.vulnerabilities) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.env.npm_execpath) throw new Error('Run with npm run audit:security.');
    const scan = spawnSync(process.execPath, [process.env.npm_execpath, 'audit', '--json', '--ignore-scripts'], { encoding: 'utf8' });
    if (scan.error || (scan.status !== 0 && scan.status !== 1)) throw new Error('npm audit could not complete.');
    const result = assessAudit(JSON.parse(scan.stdout));
    console.log(JSON.stringify(result));
    process.exitCode = result.unexpected.length ? 1 : 0;
  } catch {
    console.error('Dependency audit failed or returned incomplete data.');
    process.exitCode = 1;
  }
}
