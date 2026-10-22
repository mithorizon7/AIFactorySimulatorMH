# Security And Delivery

Use Node 22.23.4 or a newer patched Node 22 release. `.nvmrc` and the runtime guard
cover development, builds and production startup. A hosting module selection alone
does not prove its patch version; inspect the deployed runtime before sign-off.

Install with `npm ci --ignore-scripts`. This project uses packaged esbuild binaries;
the audited macOS build and tests work without dependency lifecycle scripts.
Validate with `npm run check`, `npm run test:security`, `npm run test:tutorial`,
`npm run build`, `npm run audit:security`, and `npm run test:e2e`.
`node tools/security-production-smoke.mjs` tests a loopback-only production build
using in-memory storage and no database credentials. Install its matching browser
with `npx --no-install playwright install chromium` first.

The full development and production dependency audit reports zero vulnerabilities.
Tailwind 4 replaces the vulnerable legacy glob chain. CI fails on any advisory,
scanner failure or incomplete output, without advisory exceptions. Keep public
previews in production mode and do not build untrusted configuration.

Before deploying the ownership change, apply `migrations/security-save-ownership.sql`
to the project's database with a migration role. This adds nullable owner hashes and
unique indexes to saves and leaderboard entries, preserving existing rows. Existing
unowned saves are intentionally inaccessible through the API. Browser cookies
identify anonymous owners; these are not named accounts or cross-device recovery.
Saves and leaderboard results are upserted once per owner. Scores remain self-reported.
Do not use this leaderboard for prizes or access control without authoritative gameplay.

After confirming a restorable backup, `npm run db:migrate-security` applies the
additive change transactionally with a short lock timeout. It is not run during
startup or builds. Startup checks that both ownership columns exist before serving.
The standard PostgreSQL driver supports private Replit Helium and external Neon;
external connections always require validated TLS, never disabled verification.

Set `PUBLIC_HOSTS` to exact production hostnames. `REPLIT_DOMAINS` is also honored.
Set `TRUSTED_PROXIES` only to documented ingress CIDRs after verifying that the
ingress replaces forwarded headers; the default does not trust forwarded IPs.
Rate limits are per process, so multiple replicas need edge/shared rate limits and
database retention/quotas. Established anonymous owners have separate leaderboard
write limits even when a classroom shares one ingress IP. Keep `DATABASE_URL` server-side and never use a `VITE_`
prefix for secrets. See `.env.example` for variable names, without real credentials.

Build with dev dependencies installed, then `npm prune --omit=dev --ignore-scripts`
in the deployment artifact and run `NODE_ENV=production node dist/index.js`.
Do not run Vite, Drizzle Studio or test/debug servers on a public production port.
`/api/health` returns the Git revision embedded at build time. Startup logs record
the running Node/OpenSSL versions and storage type without connection details.

See [the dated audit](docs/security-audit-2026-10-22.md) for evidence, remaining
coverage gaps, incident-specific checks and production authorization steps.
