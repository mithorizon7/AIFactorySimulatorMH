# Production browser canary operations

Current operator decision, 2026-10-26: the user explicitly chose to leave recurring
monitoring disabled. `PRODUCTION_CANARY_ENABLED` is confirmed `false`. The
approved source/origin/ruleset/null-migration variables are prepared, but that is
not activation. No scheduled coverage, failure notification receipt or uptime SLA
is claimed. Bounded one-off release checks are recorded separately in
`docs/release-c-technical-checklist.md`. Do not enable the schedule without a new
explicit owner decision.

The repository owns `.github/workflows/production-canary.yml` and the
`scripts/canary-*` runner/config/reporter. Implementation is not activation.
The original implementation lane did not change repository variables,
notification destinations, schedule dispatch, provider settings or production
artifacts. The later scoped shipment prepared expected-version variables and
explicitly left activation false, as recorded above.

## Activation and exact deployed identity

Root/operator must first review the exact candidate, pass CI, and configure these
non-secret repository variables through an authorized operational surface:

| Variable                             | Required value                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| PRODUCTION_CANARY_ENABLED            | Literal `true` to run; absent/other disables the job, never means healthy                                   |
| PRODUCTION_CANARY_ORIGIN             | Exactly `https://aifactorysimulation.com` or `https://ai-factory-mithorizon.replit.app`                     |
| PRODUCTION_CANARY_BUILD_SHA          | Full 40-character approved deployed commit, not the latest default-branch SHA                               |
| PRODUCTION_CANARY_RULESET_VERSION    | Explicit expected ruleset, currently accepted B `release-b.1`; change only with verified publication        |
| PRODUCTION_CANARY_MIGRATION_VERSION  | Explicit expected migration marker, literal `null` when none applies; never infer returned value            |
| PRODUCTION_CANARY_MIGRATION_CHECKSUM | Required 64-character reviewed SQL checksum when expected migration is non-null; absent for accepted B/null |

Do not pre-set a C expected SHA before C publication. Pause monitoring during an
approved change window or coordinate expected-marker update with deployment;
document the resulting blind interval. The runner verifies health/readiness and
full API/build-metadata identity before gameplay and rechecks identity afterward,
so a deployment switch during the run fails rather than mixing artifacts.

For the new migration-attestation API, `verified` must match both the independently
configured version and checksum; an actual `mismatch` fails core identity even
when telemetry is degraded. Cold-start database outage may leave attestation
`unverified` with core readiness healthy and telemetry degraded: continue the
synthetic core tests, warn about unknown migration proof, and do not roll back
independently or close migration/release sign-off. `not_configured` with a
non-null expected migration is also unknown, not proven mismatch. Old accepted
B/compat APIs without attestation retain exact legacy migrationVersion matching,
but only expected/returned `null` is verified without checksum attestation. A
matching non-null legacy marker remains `migration_unverified`, with no C
migration/release sign-off: matching a version string cannot prove the SQL
checksum. A different reported legacy marker still fails identity matching.
Only the allowlisted attestation state and verification boolean are reported,
never remote attestation version/checksum or error contents.

The workflow runs on the default branch every ten minutes at minutes
7, 17, 27, 37, 47 and 57 UTC and supports manual
dispatch. GitHub schedules may be delayed or dropped; public inactive repos can
have schedules disabled after 60 days. This is best effort, not an SLA or a
substitute for an external uptime monitor. Assign an operator to inspect last
successful start/finish, disabled/skipped jobs, queue delays and notification
delivery. Missing/stale runs are **unknown coverage**, not healthy production.
See [GitHub schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## What it does, without backdoors

Each invocation uses fresh anonymous synthetic Chromium contexts. GPC is true
and `Sec-GPC:1` is sent; synthetic contexts never opt in to analytics or study
collection. Startup/new run, acknowledged local save, exact reload state/no
catch-up, explicit public resume/pause, and deterministic accelerated completion
with factual scorecard/bests use existing public controls. The full ladder is the
existing reviewed browser test, imported rather than reimplemented. No production
endpoint accepts injected state, cash, progress or a test command. Local-only
IndexedDB reads inspect this synthetic context, never another player's data.

The new lifecycle case plus reused full-completion case must both pass. Zero
tests, skips, cancellation, reporter loss or a changed collection count cannot
become healthy. Gameplay uses the reviewed clock acceleration, not 30 minutes of
human behavior. It proves technical canary behavior, not participant pacing.

Run manually from a reviewed frozen install:

```sh
BASE_URL=https://aifactorysimulation.com \
EXPECTED_BUILD_SHA=<full-approved-deployed-sha> \
EXPECTED_RULESET_VERSION=release-b.1 \
EXPECTED_MIGRATION_VERSION=null \
node scripts/canary-production.mjs
```

Use literal approved values in place of the placeholder. When expecting a
non-null migration, additionally set
`EXPECTED_MIGRATION_CHECKSUM` from the reviewed migration dry-run/source, not the
served API response. An unavailable migration cannot be relabeled as verified.
Node/npm follow the repository pins; `npm ci --ignore-scripts` uses the reviewed lockfile. The
workflow installs only the locked Chromium runtime in runner-local temporary
storage. Local test servers require explicit `CANARY_ALLOW_LOOPBACK=1`, an HTTP
loopback origin and an operator-selected unused port; production workflow never
sets that escape hatch. No credentials or arbitrary remote URL are accepted.

## Reporting and failure actions

Only allowlisted operational fields are emitted to stdout, the job summary and
local ignored `output/canary/report.json`: expected public version marker,
origin, timestamps, bounded pass/fail counts and status. The child gets a small
allowlist of environment keys, no GitHub token, database key or study credential.
Raw child stdout/stderr, assertion bodies, console logs and URLs are suppressed.
Trace, video and screenshots are off; no Actions artifact upload exists. Do not
add unredacted failure evidence uploads. A human may reproduce privately with
synthetic data and review/redact evidence before any separate publication.

| Report                           | Exit           | Operator action                                                                                                                                         |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| healthy                          | 0              | Record observed completion; do not infer health between samples.                                                                                        |
| telemetry_degraded               | 0 plus warning | Investigate analytics/readiness telemetry status; core remains independent. Never roll back solely because `/api/v1/events` is unavailable or slow.     |
| migration_unverified             | 0 plus warning | Synthetic core can pass while database attestation remains unknown; no independent rollback and no migration/release gate acceptance.                   |
| core_failed                      | 1              | Confirm exact served identity and reproduce the failed core boundary. Follow the core rollback runbook; no automatic rollback or provider write occurs. |
| inconclusive/configuration_error | 2              | Fix runner/config/browser availability and record unknown coverage. A missing browser/report is not proof the app is broken or healthy.                 |

Installation/setup/Actions failures may occur before a report; triage them as
monitoring-infrastructure failures until an independent core check establishes
otherwise. Native Actions notifications are only as reliable as actual account
settings/watchers; an alert recipient and receipt test remain activation gates.
The job has read-only repository permissions and does not open issues, dispatch
deployments, create resources, send mail or change provider state.

Core rollback signals: core readiness failure; core-route 5xx above 2% for 5 minutes;
core-route p95 above 1 second for 10 minutes; save/resume/completion failure; served
SHA or migration mismatch. This synthetic sample does not measure aggregate 5xx
or p95 thresholds; those require separate actual metrics. Events-route errors and
latency are excluded from every core rollback calculation. A telemetry warning
does not imply a hidden core failure.

Observe actual canary results for 30 minutes before C release sign-off and record
sampling gaps; the scheduled interval alone does not close that gate. External
staging/backup/log/role gaps remain in [capability discovery](provider-capability-gaps.md).
