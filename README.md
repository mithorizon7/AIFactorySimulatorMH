# AI Factory Simulator

AI Factory is a browser-based learning simulation about the technical, economic, and operational tradeoffs involved in advancing an AI system from GNT-2 through GNT-7.

The current product direction is learning-first and anonymous/local-first. The former global save and leaderboard endpoints are deliberately retired because they were unscoped and accepted unverified client claims.

## Requirements

- Node.js 22.23.4 (`.nvmrc` is committed and CI reads it)
- npm 10.9.9, the version bundled with Node 22.23.4 (`packageManager` records
  the intended installer)
- Chromium for Playwright browser checks

The production bundle targets Chrome/Edge 111+, Firefox 114+, and Safari/iOS
16.4+. Chromium is release-gated today; Firefox and Safari compatibility must
not be claimed until those browser lanes are added.

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
npm run check:bundle
```

Some browser and Supertest checks bind local sockets. Run them in an environment that permits loopback listeners.

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

Build a release artifact with a non-null, full commit SHA:

```bash
BUILD_SHA=<full-commit-sha> EXPECTED_BUILD_SHA=<full-commit-sha> npm run build:release
```

The deployment provider must supply that immutable SHA and must be rechecked
after deployment; a local build alone is not production evidence.
