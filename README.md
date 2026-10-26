# AI Factory Simulator

AI Factory is a browser-based learning simulation about the technical, economic, and operational tradeoffs involved in advancing an AI system from GNT-2 through GNT-7.

The current product direction is learning-first and anonymous/local-first. The former global save and leaderboard endpoints are deliberately retired because they were unscoped and accepted unverified client claims.

## Requirements

- Node.js 22.23.4 (`.nvmrc` is committed and CI reads it)
- npm 10.9.9, the version bundled with Node 22.23.4 (`packageManager` records
  the intended installer)
- Pinned Playwright Chromium, Firefox and WebKit for browser checks

The production bundle targets Chrome/Edge 111+, Firefox 114+, and Safari/iOS
16.4+. Critical accessibility flows are gated in all three browser engines.
This does not establish every historical version, native zoom, assistive
technology or physical iOS-device compatibility.

## Local development

```bash
npm ci --ignore-scripts
npm run check:runtime
npm run dev
```

`npm ci --ignore-scripts` is the supported local and CI installation path. It
keeps third-party lifecycle hooks from running during dependency installation;
the checked-in toolchain works without them.

The development server defaults to `http://localhost:5000` and accepts `PORT` as an override.

## Required checks

```bash
npm run format:check
npm run lint
npm run check
npm run check:csp:dev
npm run test:tutorial
npm run test:unit
npm run test:persistence
npm run test:api
npm run build
npm run test:e2e
npm run test:e2e:production
npm exec -- playwright test --config=tests/config/accessibility.playwright.config.ts
npm run check:bundle
```

Some browser and Supertest checks bind local sockets. Run them in an environment that permits loopback listeners.

`npm run test:database` separately requires an explicitly supplied disposable
local PostgreSQL 16.15 database through `C_DB_TEST_ADMIN_URL`; the checked-in
operator guard rejects production targets. CI creates its own ephemeral service.
Never point this test at a provider database.

## Optional pilot infrastructure

Gameplay and saves do not require a server database. Browser storage is schema2,
an exact additive outbox upgrade preserving the six game stores and snapshots.
Only the verified C1/focus checkpoint or a later compatible build is a safe
rollback after schema2 exists; do not erase or downgrade player data.

Product analytics is opt-in, honors Global Privacy Control and remains disabled
unless the separately restricted `TELEMETRY_DATABASE_URL` is configured and
verified. It never falls back to a legacy database credential. Research schemas
and operator tools are separate; no research submission route is installed in
the application. Production collection must remain off until provider access,
retention, backup and credential boundaries are verified. See the
[pilot operations](docs/pilot/data-boundaries-and-withdrawal.md) and
[remaining provider gates](docs/pilot/provider-capability-gaps.md).

Verification bundles, screenshots, detailed reports and SBOMs remain private;
the public CI does not upload those artifacts.

## Release truth

Repo success is not deployment success. A production claim requires all of the following to agree:

1. The intended commit is reviewed and present on the release branch.
2. CI passed for that exact commit.
3. The deployment was built with `BUILD_SHA` or `GIT_COMMIT_SHA` set to that commit.
4. `/api/version` serves the exact SHA and expected ruleset/snapshot/command versions.
5. A synthetic browser completes startup, local save, reload/resume, and completion on the served artifact.

See [current state](docs/current-state.md), [architecture](docs/architecture.md), and the [Release A runbook](docs/release-a-runbook.md).

For a deployed artifact, verify core readiness, served SHA/version, and retired APIs with:

```bash
BASE_URL=https://example.invalid EXPECTED_BUILD_SHA=<full-commit-sha> EXPECTED_RULESET_VERSION=release-b.1 npm run release:verify
```

Migration expectation defaults to `null` while collection is unconfigured. An
activated SQL migration additionally requires `EXPECTED_MIGRATION_VERSION` and
the independently recorded `EXPECTED_MIGRATION_CHECKSUM`; an unknown or mismatched
attestation never counts as migration sign-off.

Build a release artifact with a non-null, full commit SHA:

```bash
BUILD_SHA=<full-commit-sha> EXPECTED_BUILD_SHA=<full-commit-sha> npm run build:release
```

The deployment provider must supply that immutable SHA and must be rechecked
after deployment; a local build alone is not production evidence.
