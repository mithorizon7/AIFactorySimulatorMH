# Release A Runbook

## Pre-release

1. Fetch upstream and record branch, HEAD, `origin/main`, ahead/behind, and dirty-tree status.
2. Run the full required suite from a clean Node 22.23.4 / npm 10.9.9 install.
   Use `npm ci --ignore-scripts`, then `npm run check:runtime`; do not let a
   globally shadowed npm silently choose the lockfile format or resolution.
3. Confirm production audit has zero vulnerabilities and the full dependency tree has no critical advisories.
4. Record initial JS, LCP, console, keyboard, and axe regression results against the committed baseline.
5. Build with the exact release SHA injected as `BUILD_SHA`, using
   `npm run build:release`. A null, abbreviated, or mismatched SHA is a release
   failure.
6. Confirm enforced CSP has no unexplained violation. The current inline-style
   exception has an owner and Release C production-sign-off expiry; any
   extension requires a recorded security/accessibility review.
7. Confirm the deployed TLS edge supplies HSTS, or explicitly configure and
   verify the application/edge policy. `hsts: false` in source is not evidence
   that the edge protects it.

## Deployment verification

1. Confirm `/api/healthz` is healthy and `/api/readyz` reports the core ruleset loaded.
2. Confirm `/api/version` serves the intended build SHA and version tuple. A null or mismatched SHA fails the release.
3. Run a synthetic browser canary: fresh anonymous start, command save, reload, exact resume, pause/no-time-drift, reset/new-run, and deterministic completion.
4. Confirm retired endpoints still return stable JSON `410` responses.
5. Inspect browser console, CSP violations, keyboard-critical flows, and serious/critical axe findings.
6. Confirm the deployment runtime reports Node 22.23.4 or a later approved 22.x
   patch, the released package lock is the reviewed one, and no stale database
   integration or port mapping is active.

The HTTP portion is automated by `BASE_URL=<served-origin> EXPECTED_BUILD_SHA=<full-sha> npm run release:verify`. It deliberately fails while core readiness is false.

Record the median of five cold production navigations with `BASE_URL=<served-origin> npm run measure:lcp`. Later A/B checks pass that committed value as `BASELINE_LCP_MS`; regression requires both more than 250 ms and more than 20% degradation.

## Rollback and degraded telemetry

Core health/version/static-serving failures and synthetic startup/save/resume/completion failures use the release rollback thresholds. `/api/v1/events` failure is telemetry degradation only and does not independently trigger rollback. If telemetry is unavailable, synthetic local save/resume evidence is the release-safety signal.

Release A currently has no product telemetry endpoint and `migrationVersion` is `null`.

## Provider-side configuration

The checked-in `.replit` source now requests Node 22 and only exposes port 5000
to port 80, but it is not proof of the active provider configuration. Before
deployment, a provider owner must:

1. Confirm no retained PostgreSQL/database integration is still needed; export
   or retain it under the provider's backup policy before removing it.
2. Configure the build to use `npm run build:release` and inject the immutable
   `BUILD_SHA` / `EXPECTED_BUILD_SHA` for the exact commit.
3. Record the deployment ID, live runtime version, served SHA, and HTTPS header
   response. Do not treat a repository commit or build log as substitute
   evidence.

## Evidence packet

Record the local commit, upstream commit, CI run, deployment ID, served SHA/version response, synthetic canary output, browser screenshots, console/CSP/axe results, dependency audits, and any accepted risks. Keep each truth layer distinct.
