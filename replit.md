# Replit and deployment notes

This file describes the checked-in application source. It is not evidence of a
currently running Replit deployment, its environment variables, database
resources, or served revision.

## Current application shape

- **Client:** React and TypeScript, styled with Tailwind CSS and Radix
  primitives.
- **Simulation:** a deterministic, browser-hosted game engine for the GNT-2 to
  GNT-7 learning scenario.
- **Server:** a small Node/Express delivery layer for static assets,
  `/api/healthz`, `/api/readyz`, and `/api/version`.
- **Legacy API containment:** `/api/game-state`, `/api/leaderboard`, and
  `/api/ranking/:intelligence` deliberately return JSON `410 Gone`. The client
  no longer submits global saves or leaderboard claims.
- **Identity and data:** the checked-in source has no account, session,
  PostgreSQL, Drizzle, Neon, or server-side game-state implementation. The
  current client only stores its tutorial-start marker in browser local storage;
  durable IndexedDB run persistence remains a Release A implementation item,
  not a claim made by this source today.

## Checked-in Replit configuration

`.replit` requests `nodejs-22` and `web`, with one public mapping from local
port 5000 to port 80. The application defaults to port 5000 and honors the
platform-provided `PORT` value. The stale PostgreSQL module, JavaScript database
integration, and unrelated historical port mappings were removed from source
configuration during the October 22 security remediation.

Source configuration does not delete a provider resource. Before a provider
owner removes any retained database/integration, they must determine whether it
contains data that requires export, retention, or incident review.

## Secure build and deployment requirements

1. Use Node **22.23.4 or later approved 22.x**, and npm **10.9.9**. The
   application refuses to start or build on an older Node 22 runtime.
2. Install dependencies through `npm ci --ignore-scripts` from the reviewed
   lockfile.
3. The checked-in Replit command runs `tools/with-node22.sh` and
   `tools/build-release.mjs`. It verifies the bootstrap runtime, requires a clean
   tracked source tree, installs the reviewed lock without lifecycle scripts,
   and passes the full checked-out Git SHA into `npm run build:release` as both
   `BUILD_SHA` and `EXPECTED_BUILD_SHA`. Verify the actual provider command before
   release; stale dashboard settings can override source configuration.
4. After deployment, record the deployment ID and runtime version, then verify
   `/api/version` returns the intended full SHA. A null or mismatched SHA fails
   release verification.
5. Confirm the HTTPS edge enforces HSTS and that the live retired routes return
   `410` for both GET and POST. Do not infer either property from this file.

The operational release procedure and evidence requirements are in
[docs/release-a-runbook.md](docs/release-a-runbook.md). The current security
scope, findings, and provider-side checklist are in
[docs/security-audit-2026-10-22.md](docs/security-audit-2026-10-22.md).
