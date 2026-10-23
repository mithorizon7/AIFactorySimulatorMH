# Release B integrated verification

## Status and scope

The integrated application at `e2e9172b6707aae85fb37d949239c7169d23fa27`
passes the local Release B acceptance gates. This records implementation and
local verification, not a merge, deployment, served revision, or learner study.
Subsequent documentation-only delivery commits do not change the compiled game.

Release A remains the independently verified production artifact until B is
explicitly published and checked. The integration owner must record the merged
revision, successful provider build, both public-origin identities, browser
canaries, and cold production LCP separately in the delivery record.

## Behavioral evidence

- `npm run test:coverage`: 27 files, 227 tests passed. Statements 94.11%,
  branches 89.56%, functions 91.48%, lines 95.11%. Engine statement coverage
  98.28%, branches 95.20%, functions 100%, lines 99.03%. Percentages are a
  backstop; named transition, recovery, ownership, replay and failure tests are
  the acceptance evidence.
- `npm run test:e2e:production`: 19/19 passed without retries or skips, using
  the SHA-stamped Express production artifact. The public-control strategy
  completes GNT-2 through GNT-7 within 1,800 active ticks, saves its immutable
  factual summary and independent bests, and persists debrief state.
- `npm run test:e2e`: the same 19/19 passed against development serving.
- The actual paused A fixture hydrates without reinterpretation, stays paused
  through two controlled seconds, then resumes from tick 17 to 19 and saves.
  This focused check also passed three consecutive runs. Frozen A canonical
  trajectories remain byte-identical across nine seed/policy fixtures.
- Public controls cover welcome dismissal, genuine investment within 90 active
  ticks, first training at 360–480 active ticks, navigation, pricing validation,
  reload without catch-up, explicit takeover and stale-writer fencing, pending
  storage disabling, reset confirmation, completion and scorecard focus.
- The stored simulator report covers 224 completed runs: seven strategies and
  32 frozen seeds. Paired counterfactual, recovery and property tests complement
  it. Seed-invariant aggregate pacing is disclosed; random runs do not prove
  reachability or stochastic robustness. See [balance evidence](release-b-balance.md).

## Interface and educational evidence

All five main surfaces were captured at 390 and 1,440 px; the 320 px header and
objective have no horizontal page overflow. Automated axe found no serious or
critical findings in those exercised surfaces. Critical keyboard controls,
dialog focus, console/CSP checks and normal-pointer operation passed. The
integration owner inspected the actual mobile Dashboard and desktop Journey
captures. The navy, amber and teal identity is retained.

One non-blocking durable Spark queue replaces competing narrative overlays.
Canonical engine guidance owns blockers, viable actions, prices and effective
training durations. Lessons identify source, date, claim type and uncertainty;
future eras remain speculative. Scores and named profiles are deliberately
omitted: `scoreAlgorithmVersion` and `profileClassifierVersion` are both null.
No learner-comprehension or participant-validation result is invented.

Independent read-only review accepted the engineer/governance cap and captured
training-duration fixes, legal/illegal price drafts and boosted A prices,
historical prerequisite notices and causally neutral customer-loss copy. Its
final pass at `e2e9172` found no open P1/P2 issue within the reviewed B scope.

## Security, quality and performance floors

Typecheck, lint, formatting, contextual onboarding contracts and Vite CSP checks
passed. Current production-filtered and full dependency audits report zero
vulnerabilities. Gitleaks 8.30.1 found no source-history leaks in the B delta.
The broader ignored-artifact scan's 21 hits were all local development-server
HMR tokens in browser traces; no unclassified finding remained. Do not publish
unredacted traces as release evidence.

Initial JavaScript is 1,261,639 bytes, build gzip 294.23 kB: 14.41% below the
original 1,473,993-byte baseline and 16.51% below verified A. The 10% regression
floor passes. This is not yet the complete C performance qualification.

Five cold local production-artifact navigations measured 116, 120, 124, 132
and 136 ms LCP (median 124 ms). This is a local regression check only, not a
claim of improvement over A's public-origin 656 ms median. B must be measured
again on the actual deployed origin.

Full WCAG 2.2 AA, zoom, assistive-technology review, Firefox/WebKit coverage,
steady-state profiling, telemetry/research isolation and participant operations
remain Release C work. The existing inner Synergy tab label fit is a P3 C
follow-up, not an omitted claim of complete accessibility.

## Evidence locations

Local rendered artifacts: `output/playwright/production-results/` and the
production HTML report. Development artifacts: `output/playwright/test-results/`.
Coverage: `coverage/coverage-summary.json`. The formal frontend assessment is
`output/release-b-frontend-qa.md`; its structural validator does not replace
inspection of actual screenshots or runtime results.

The initial full B browser pass exposed three harness assumptions: an A-only
version expectation, an A-length completion horizon, and a wall-clock resume
assertion. The final tests require the explicit current ruleset, retain the
30-minute completion bound, and assert exact controlled pause/resume ticks.
The earlier failures were not suppressed or relabeled as passing evidence.

The first final-candidate CI run (`39909844749`) passed unit/persistence/API and
build, then failed only the monolithic 224-run coverage test's 240-second timeout
(336 seconds of instrumented work on its runner). The harness now executes every
seed/policy as a separately bounded test, comparing its full result and canonical
state digest to the committed report. Aggregate pacing/diversity/dominance
assertions remain, with no shared test-order dependency. No simulation, seed,
assertion, coverage floor or application code was removed to obtain green CI.
The 227-test local result above precedes that test-only decomposition; final CI
must record the new count before delivery is accepted.

The focused instrumented balance rerun passed all 239 cases (including the 224
fresh matrix rows) in 199.49 seconds. Its command still exited nonzero because
running only that file cannot satisfy the unchanged whole-application 80%
coverage floors. Those floors were not disabled; a complete 451-test coverage
run and the new complete CI candidate remain the acceptance checks.
