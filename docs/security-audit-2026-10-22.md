# Security audit and local remediation — 2026-10-22

Historical audit snapshot: its deployment-pending statements below describe the
audit-time access boundary, not current production. Release A was subsequently
deployed and independently verified. See the
[October 23 delivery verification addendum](security-delivery-verification-2026-10-23.md)
for the exact served revision, remediation evidence and still-unverified scope.

## Bottom line

The checked-in remediation candidate is materially safer: it pins the patched
Node 22 line, replaces the vulnerable production dependency graph, hardens CI,
removes stale delivery configuration, and records a truthful release-evidence
procedure. It is **not** a production attestation.

The urgent unresolved risk is delivery drift. On 2026-10-22, the fetched public
`origin/main` still resolves to
`c372658ea89b1e2c8a640cce345b0d2a1d9f3317`, while the contained local work is
on `codex/ai-factory-trustworthy-core`. The old upstream source exposes
unscoped, client-writable global game state and leaderboard routes. No provider
dashboard, served SHA, environment-variable inventory, build log, database
inventory, or live origin was available from this workspace. Do not infer that
the local fixes are live.

## Immediate provider actions

1. Determine the live deployment's source revision and runtime. If it is
   `c372658` or another revision with the legacy handlers, block
   `/api/game-state`, `/api/leaderboard`, and `/api/ranking/*` at the edge for
   every HTTP method before further release work.
2. Push/review the contained candidate, rebuild from a clean lockfile on Node
   22.23.4 or later approved 22.x, and inject its immutable full commit SHA as
   `BUILD_SHA` and `EXPECTED_BUILD_SHA`.
3. Verify the served SHA with `/api/version`, both GET and POST `410` behavior
   for the retired routes, HTTPS/HSTS headers, and the synthetic browser canary.
4. Inspect retained Replit/Railway-like database resources and environment
   variables before deleting any integration. Preserve data and incident
   evidence according to the provider's retention policy.

These actions need a provider owner because they can affect availability,
credentials, or data. They were not performed by this audit.

## Scope, evidence, and access gaps

| Surface                       | Evidence checked                                                                                     | Result                                                                                                                                                                                     | Remaining gap                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Current source and history    | Tracked files, manifest/lockfile, route and middleware review, 353-commit secret scan                | No detected secrets; no current auth, database client, server-side game-state write path, upload, SSRF-style outbound request, AI/MCP tool path, Docker, or Python/PHP/Bun project surface | Deleted/unreachable history, local untracked files outside the checkout, and provider secrets/logs were not available               |
| Upstream source               | Fresh `git fetch --prune`, `origin/main` inspection                                                  | `origin/main` remains `c372658`; its legacy source has unauthenticated global save/leaderboard routes                                                                                      | Served revision and traffic are unverified                                                                                          |
| Dependency supply chain       | `package.json`, lockfile v3, lifecycle-marker review, isolated no-script install, npm advisory scans | Lock resolves only from `https://registry.npmjs.org/` with integrity metadata; no LiteLLM/package-manager compromise indicator in source                                                   | Historical developer machines, caches, and provider build images cannot be proven clean from a lockfile                             |
| CI/CD                         | Local GitHub workflow/configuration review and GitHub metadata available to the checkout             | Workflow is locally hardened, but it is not present on public `origin/main` and no run proves it has executed                                                                              | GitHub Actions runs, branch protection, secrets, environments, and artifact retention cannot be inspected here                      |
| Replit/delivery configuration | `.replit`, build/start paths, public repository homepage metadata                                    | Source now requests Node 22, one port, and no database integration                                                                                                                         | Actual provider runtime, active ports, database resources, environment variables, logs, backups, and served endpoint are unverified |
| Workstation tool inventory    | Read-only version checks                                                                             | Local Node is 22.23.4; PHP is 8.5.12; pip is 26.2.2; Bun is 1.3.11; no Java runtime is installed                                                                                           | These local tools do not establish versions on hosted services, CI, containers, or other developer devices                          |

## Compromise precheck

Before running project code, the audit inspected the manifest, lockfile,
repository structure, installed-package metadata, and source/history indicators.
No LiteLLM reference, Python dependency manifest, Docker image, floating
container tag, `litellm-1.107.0` marker, foreign npm registry URL, root package
lifecycle hook, or suspect package-install change was found. Gitleaks found no
secrets in the current source archive or in the 353 reachable commits.

This is absence of repository evidence, not proof that a developer machine,
CI worker, provider build cache, or unrelated agent session never used the
compromised LiteLLM artifact. The official incident says affected PyPI wheels
were available from 11:39 to 13:23 UTC and floating container tags were affected
on October 21; any environment that used them needs incident response from
trusted media, not an in-place version update. See the
[LiteLLM incident notice](https://docs.litellm.ai/blog/security-incident-oct-21-2026).

## Mandatory incident applicability matrix

Status meanings: **remediated locally, deployment pending** only describes the
working tree; **not applicable in source** does not make a provider or device
safe; **unverified** identifies the exact missing evidence.

| Baseline                                           | Source/local evidence                                                                                                                                            | Status                                                      | Exact next evidence                                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PHP CVE-2026-109618 / CVE-2026-109619              | No Composer, PHP source, PHP server, container, or appliance config. Local CLI PHP is 8.5.12.                                                                    | Not applicable in source; hosted/appliance scope unverified | Provider/service inventory and logs from October 17 onward; PAN-OS/Panorama vendor assessment if present                                                                    |
| Node October 21 release, including CVE-2026-111497 | Old `.replit` used Node 20 and old `.nvmrc` used 22.14.0. Local remediation pins 22.23.4 and enforces it at build/start.                                         | Remediated locally, deployment pending                      | Provider/CI `node --version`, image digest, build log, and served SHA                                                                                                       |
| Bun 1.4.4                                          | No Bun manifest, lock, script, CI, image, or deployment path. Local Bun is 1.3.11.                                                                               | Not applicable in source; local workstation action pending  | Update Bun only where it is intentionally used, then record `bun --version` and trust-store behavior                                                                        |
| Railway credential incident                        | No Railway configuration, token, or service reference found in source.                                                                                           | Unverified external service                                 | Account owner must identify every Railway project/environment, rotate third-party secrets, reconnect affected integrations, and verify running deployments use replacements |
| LiteLLM 1.107.0 compromise                         | No LiteLLM/package/image/agent-gateway reference in source or readable history.                                                                                  | No repository evidence; historical host exposure unverified | Search provider/developer artifact inventories, build logs, and agent traces without starting suspect Python environments                                                   |
| eMudhra / emSign CA incident                       | Local pip is 26.2.2. No Python project or uv/certifi dependency is in this repository. Node 22.23.4 includes the October security release's certificate updates. | Source not applicable; active trust stores unverified       | Inspect the actual package-manager, container, OS, browser, Java, Go/Rust, and provider trust stores; rebuild cached images from trusted bases                              |
| GitLab October 21 release                          | Remote is GitHub; no `.gitlab-ci.yml` or GitLab service config.                                                                                                  | Not applicable in source; runners/infrastructure unverified | Inventory self-managed GitLab/runners separately if any support delivery                                                                                                    |
| Java/GraalVM / Oracle CVE-2026-91403               | No Java/Graal build configuration; local Java reports no installed runtime.                                                                                      | Not applicable in source                                    | Inventory hosted agents, appliances, and developer JDKs by vendor and version                                                                                               |
| BIND / Unbound advisories                          | No DNS-server configuration or package in source.                                                                                                                | Not applicable in source                                    | Provider/DNS inventory, branch/vendor patch matrix, and actual daemon versions                                                                                              |
| Cisco, Splunk SOAR, Fortinet updates               | No network/security-product configuration in source.                                                                                                             | Not applicable in source                                    | Network-owner inventory, firmware versions, supported upgrade path, and provider management-plane confirmation                                                              |
| HTTP/3/QPACK Header Accordions                     | No QUIC or production WebSocket server in source; development CSP permits only localhost Vite HMR sockets.                                                       | Not applicable in source; edge termination unverified       | Identify CDN/load-balancer HTTP/3 terminator and its QPACK mitigation/version                                                                                               |
| Linux PwnEscape, Atlassian, BeyondTrust            | No host image, Kubernetes/IaC, or product configuration in source.                                                                                               | Unverified infrastructure                                   | Managed-host kernel/backport/reboot evidence and self-hosted product inventory                                                                                              |
| Google Cloud Shell WebSocket issue                 | No Cloud Shell dependency and no production WebSocket service.                                                                                                   | Not applicable in source                                    | Do not revoke Google credentials solely for this issue; investigate only if specific session evidence exists                                                                |
| Browser/Electron/Signal and broader stack          | Playwright Chromium is a test dependency; no Electron or Signal/RingRTC package.                                                                                 | Test-browser patch status unverified; no app dependency     | Record exact CI/browser binary version and update through approved Playwright releases                                                                                      |

The CISA KEV feed could not be fetched from this environment (the direct feed
returned an access denial), so KEV status is a recorded coverage gap. No absence
from KEV is treated as a safety conclusion.

## Findings and local remediation

| Priority                  | Finding and affected asset                                                                                           | Evidence and exposure                                                                                                                                        | Local remediation                                                                                                                    | Owner / remaining status                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Release stop              | Public `origin/main` has unauthenticated `GET`/`POST` global save and leaderboard routes and globally scoped storage | Source at `c372658` accepts client game/leaderboard claims; whether it is served is unverified                                                               | Contained local branch already retires each route with JSON `410`                                                                    | Provider owner must prove served SHA and block legacy routes if old source is live                    |
| High                      | Node runtime was stale                                                                                               | `.replit` selected EOL Node 20; `.nvmrc`/CI selected 22.14.0, below the October 21 patch                                                                     | `.nvmrc`, `engines`, CI, README, and a runtime guard now require 22.23.4+ through 22.x                                               | Deployment/CI runtime still pending proof                                                             |
| Critical resolved locally | Express 4 lock graph included `proxy-addr` 2.0.7 and `qs` 6.15.3                                                     | npm/GitHub advisory scan identified the affected production graph                                                                                            | Migrated to Express 5.3.0, adjusted catch-all middleware, and resolved `proxy-addr` 2.0.8, `body-parser` 2.4.0, and `qs` 6.16.1      | Production audit is clean; deploy from reviewed lock still required                                   |
| High resolved locally     | Vite, Vitest, PostCSS, NanoID, source-map-js, and unused Typography resolutions were stale                           | Advisory scan against the prior lock                                                                                                                         | Updated compatible direct tools and removed the unused Typography plugin/package                                                     | Full dependency scan retains Tailwind 3 build-only findings below                                     |
| Medium                    | Tailwind 3 build graph retains advisories                                                                            | Current full lock scan has 5 high and 3 moderate findings under Tailwind 3/chokidar/braces/micromatch/PostCSS selector parsing; production-only scan is zero | No unsafe override or untested Tailwind 4 migration was applied                                                                      | Frontend owner: perform a separately reviewed Tailwind 4 migration with visual/E2E regression proof   |
| Medium                    | Replit config and operations documentation claimed stale database capability                                         | Source retained PostgreSQL module, database integration, eight unrelated port mappings, and obsolete database/session documentation                          | Removed stale source declarations/mappings and rewrote `replit.md` to match current source                                           | Provider owner must preserve/retire actual resources separately                                       |
| Low                       | CI actions used mutable tags and persisted checkout credentials by default                                           | Local workflow used `@v4` tags                                                                                                                               | Pinned reviewed action commits, disabled checkout credential persistence, shortened failure-artifact retention, and added Dependabot | Changes only protect CI after the workflow is pushed and enabled                                      |
| Low                       | Future secret-commit guard was absent                                                                                | `.env*` was not ignored; no local `.env*` was found                                                                                                          | Added narrowly scoped `.env` ignores while preserving example files; current/history Gitleaks scans passed                           | Add an approved server-side secret-scanning gate before relying on it for organization-wide assurance |
| Conditional               | CSP inline-style exception and HSTS delivery                                                                         | Script CSP is enforced; style inline exception remains for a named UI compatibility need; app-side HSTS is intentionally off pending edge proof              | Recorded owner/expiry on the style exception and documented the HSTS verification gate                                               | Security/accessibility and provider owners must resolve before production release                     |

The Express dependency finding is supported by the
[GitHub advisory for `proxy-addr`](https://github.com/advisories/GHSA-jqcg-44mw-7w3h).
Node 22.23.4 is the official patched line for the October 21 release, including
the high-severity Brotli issue and certificate updates; see the
[Node advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).

## Repository changes

- Pinned Node 22.23.4 and npm 10.9.9; added a deterministic build/start runtime
  guard.
- Added `build:release`, which refuses a release build without a full commit
  SHA, while preserving ordinary local build behavior.
- Migrated Express 4 to 5.3.0 and changed the two wildcard fallbacks to
  pathless middleware so they remain valid under Express 5 routing.
- Regenerated `package-lock.json` with Node 22.23.4's bundled npm 10.9.9 and
  no lifecycle scripts.
- Removed the unused `@tailwindcss/typography` plugin.
- Hardened GitHub Actions: immutable action SHAs, no persisted checkout token,
  `npm ci --ignore-scripts`, local Playwright execution, shorter/smaller
  failure artifacts, and weekly Dependabot updates.
- Updated `.replit`, `.gitignore`, README, release runbook, current-state
  record, and the deployment notes.
- Repaired the CI persistence gate so it executes the existing replay,
  snapshot, completed-run, and schema contract tests instead of a nonexistent
  directory.

## Verification record

The final verification results are recorded after every modified source or lock
file is rechecked. The required checks include:

```bash
/usr/local/bin/npm ci --ignore-scripts
/usr/local/bin/npm run check:runtime
/usr/local/bin/npm run format:check
/usr/local/bin/npm run lint
/usr/local/bin/npm run check
/usr/local/bin/npm run test:api
/usr/local/bin/npm run test:unit
/usr/local/bin/npm run test:persistence
/usr/local/bin/npm run test:coverage
/usr/local/bin/npm run build
/usr/local/bin/npm run check:csp:dev
/usr/local/bin/npm run test:e2e
/usr/local/bin/npm audit --package-lock-only --omit=dev --audit-level=high
```

The test environment must allow local loopback listeners for Supertest and
Playwright. The restricted shell blocks those listeners; elevated isolated test
execution is used instead. Full-tree audit findings are not suppressed: the
Tailwind 3 migration remains an explicit open item.

## Provider deployment and rollback checklist

1. Fetch and record `origin/main`, candidate SHA, dirty-tree state, CI run URL,
   and reviewer approval.
2. Confirm branch protection and CI execute the pinned workflow from the
   candidate SHA; never assume the local-only workflow is active.
3. Inventory every provider environment, preview, worker, scheduled job,
   database, bucket, registry credential, and build cache. Preserve relevant
   backups and incident logs before cleanup.
4. Confirm Node 22.23.4+ and npm 10.9.9 in the actual build/runtime; use
   `npm ci --ignore-scripts` from the reviewed lock.
5. Build with `npm run build:release`, injecting the immutable full SHA. Record
   image/build digest and deployment ID.
6. Probe `/api/healthz`, `/api/readyz`, and `/api/version`; a null or mismatched
   build SHA, non-ready core, or fabricated migration version fails release.
7. Probe legacy endpoints with GET and POST and require JSON `410` responses.
8. Run the synthetic browser path: startup, local save, reload/resume,
   pause/no-time-drift, reset/new-run, and completion. Record screenshots,
   console/CSP output, and accessibility results.
9. Verify HTTPS security headers at the real edge, including a documented HSTS
   policy, and check no unexpected port, database, or external API route is
   reachable.
10. Roll back for core health/version/static-serving or synthetic gameplay
    failure. Keep telemetry failures separate from core rollback signals.

## Credential and incident-response checklist

Use this only for services actually in scope; do not rotate shared credentials
speculatively from this repository.

1. If any Railway project was used, follow Railway's incident guidance: rotate
   all environment variables, third-party database/bucket/registry credentials,
   reconnect invalidated Railway API-token integrations, and verify each
   running deployment has replacement values. Railway's own token invalidation
   does not revoke third-party credentials. See the
   [Railway disclosure](https://blog.railway.com/p/security-disclosure-wednesday-october-21st)
   and its live status page.
2. If LiteLLM 1.107.0 or a listed floating image tag ever ran, preserve logs and
   markers, isolate the environment, rebuild from trusted artifacts, rotate all
   reachable secrets and IAM credentials, and review cloud identity/model
   discovery history. Do not start a suspect Python environment to investigate.
3. Search provider logs, CI artifacts, coding-agent traces, and gateway prompts
   for credential exposure without printing values. Record only redacted
   identifiers, issuing service, scope, and affected consumers.
4. For any confirmed secret exposure, revoke at the issuer, create replacement
   credentials in a clean environment, update every consumer, invalidate old
   sessions/temporary credentials, and review access, usage, and billing logs.

## One-time device and network checklist

- Update Bun from local 1.3.11 to 1.4.4 or later only where Bun is intentionally
  used; the repository itself does not use it.
- Keep local PHP at 8.5.12 or newer; it is not a project runtime here.
- Verify every Python distribution/virtual environment that is actually used:
  pip 26.2.2+, uv 0.13.4+, certifi 2026.10.19+, and rebuilt system/container
  certificate stores. Do not disable certificate verification. The
  [Python packaging guidance](https://discuss.python.org/t/information-for-python-users-regarding-emudhra-emsign-ca-certificate-security-incident/109576)
  explains why each tool's own trust bundle matters.
- Inventory non-repository DNS, network, Java, GitLab, Atlassian, BeyondTrust,
  Cisco, Splunk, Fortinet, and managed-host assets with their owners; no source
  file can validate them.
- Obtain managed-host kernel/backport and reboot/livepatch evidence rather than
  using a container or local macOS version as a proxy for provider remediation.

## Confidence and closure criteria

- **High confidence:** source/lockfile findings, local runtime inventory,
  no-secret scan results, and the contained old-upstream route design are
  evidence-backed.
- **Moderate confidence:** the rebuilt dependency graph has zero production npm
  advisories, subject to the audit database's coverage and the reviewed lock
  actually being used by CI/deployment.
- **Low confidence / blocked:** production runtime, served SHA, TLS/HSTS,
  provider secrets, databases, logs, caches, external infrastructure, CISA KEV
  status, and historical host exposure.

Close the deployment blocker only with provider-side evidence for the exact
candidate SHA, runtime version, release artifact, live route behavior, browser
canary, and credential/resource inventory. An audit cannot prove the absence of
all vulnerabilities or compromise.
