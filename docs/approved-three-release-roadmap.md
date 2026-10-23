# AI Factory Frozen Three-Release Execution Plan

## Summary

Deliver three independently deployable releases with a hard stop after each:

1. **Release A — Trustworthy Core:** deterministic behavior, durable local persistence, factual scorecard, unsafe-API shutdown, security, CI, documentation, and deployment proof.
2. **Release B — Better Game:** strategic era design, balance simulation, onboarding, educational framing, and empirically calibrated scoring/profiles.
3. **Release C — Validated Pilot:** accessibility, performance, privacy-safe telemetry, consented research, formative playtesting, monitoring, and release evidence.

The next release cannot begin until the previous release is deployed, usable, and independently verified.

Release A’s defining outcome is:

> An anonymous player can complete GNT-2→GNT-7 deterministically, pause without corrupting time, close and resume without losing state, reset safely, and receive a factual personal scorecard, while global-save and forged-score paths are disabled.

## Shared Contracts and Decisions

### Product defaults

- Audience: learners age 14 through adult.
- Target run: 20–30 minutes.
- Anonymous play with IndexedDB persistence.
- No closed-window progression.
- No global leaderboard.
- Player-facing `Intelligence` becomes `Model Capability`.
- GNT-5 through GNT-7 are explicitly speculative.
- Keep the current React/Vite/Express stack and overall visual identity.
- Accounts, cloud saves, verified competition, multiplayer, LMS integration, native apps, and an LLM-powered Spark remain deferred.

### State and command contracts

- `GameStateV2`: canonical simulation state.
- `ExperienceStateV1`: durable tutorial, coaching, message, and debrief state.
- `GameSnapshot`: state, versions, run lifecycle metadata, writer lease, and checksum.
- `EngineEffect`: presentation effects returned by the engine.
- Independently version:
  - `snapshotVersion`
  - `rulesetVersion`
  - `commandSchemaVersion`
  - `scoreAlgorithmVersion`
  - `profileClassifierVersion`

`GameCommand` is a strict Zod discriminated union. Every variant contains a UUID, nonnegative integer tick, command-schema version, literal type, and command-specific strict payload.

Initial variants cover run start/pause/resume, all compute/data/algorithm investments, engineer hiring, platform construction, service toggles, pricing, product upgrades, marketing, and training.

Reset is not an engine command:

> The engine exposes a pure fresh-state factory. The session layer abandons the old run, creates a new run ID, and initializes it with a completely fresh object graph.

Tutorial and message actions use a separate typed `ExperienceCommand` union. Unknown commands, fields, versions, duplicate replay IDs, and illegal values fail closed.

### Numeric determinism

Continue using JavaScript numbers with normalization after every command and tick:

- Time, ticks, levels, counters, customers, and displayed scores: integers.
- Money, costs, and revenue: two decimals.
- Resources, capacity, inputs, and training progress: three decimals.
- Rates, bonuses, and multipliers: six decimals.
- Reject non-finite values.
- Persist only normalized state.

The engine cannot access React, the DOM, network, wall clock, or `Math.random()`.

## Release A — Trustworthy Core

### Execution-base preflight

Treat `c372658` only as the planning snapshot.

At execution:

- Fetch the remote again.
- Record local and remote HEAD, dirty state, remote URL, and ahead/behind counts.
- Fast-forward clean `main` to the newly confirmed `origin/main`.
- If upstream moved, repeat baseline inspection before branching.
- Create `codex/ai-factory-trustworthy-core`.
- Capture install, typecheck, build, E2E, dependency, accessibility, bundle, LCP, and console-error baselines.
- Record deployment URL and served SHA, or explicitly record their absence.

### Milestone A1 — Containment and characterization

- Remove global save and leaderboard UI.
- Return `410 Gone` from all current game-state and leaderboard routes.
- Archive legacy row counts/checksums without migrating partial saves.
- Prevent use of any plaintext credential table.
- Return `400` for Zod validation failures.
- Use one request ID per request.
- Remove request bodies, snapshots, cookies, names, secrets, and commands from logs.
- Disable `x-powered-by`; add body limits, throttling, safe errors, and Helmet.
- Introduce CSP in report-only mode, resolve violations, then enforce it before Release A production deployment.
- Any temporary CSP exception requires an owner, justification, and expiry.
- Capture characterization fixtures for every action family, training rule, era transition, breakthrough, event, service, victory, timer, and reset behavior.

Gate: unsafe interfaces are disabled and current behavior is reproducibly characterized.

### Milestone A2 — Deterministic engine

- Introduce pure `applyCommand` and `advanceToTick`.
- Inject clock and seeded RNG.
- Centralize requirements, progression, training, revenue, events, breakthroughs, timing, and victory.
- Return narrative/tutorial triggers as `EngineEffect` data.
- Replace direct nested mutations and exposed setters with typed dispatch.
- Make start idempotent.
- Ensure pause/resume preserves run identity and accumulated active time.
- Prevent educational content and visibility changes from resetting time.
- Expose the pure fresh-state factory used by the session layer.
- Prevent UI components from independently recalculating blockers or progression.
- Normalize and validate every transition.

Gate: the same seed and commands produce byte-identical canonical state, with every characterization fixture passing or carrying an explicitly approved correction.

### Milestone A3 — Persistence and recovery

Use IndexedDB database `ai-factory`, version `1`.

Stores:

- `runs`, keyed by `runId`; indexes on `status`, `savedAt`, and `rulesetVersion`.
- `meta`, keyed by `key`; contains `activeRunId` and migration metadata.
- `personalBests`, keyed by `rulesetVersion`.
- `recoveryBackups`, keyed by `backupId`; indexes on `runId` and `createdAt`.

Each run contains:

- Run and schema versions.
- Revision.
- `writerId`, `writerEpoch`, and `leaseExpiresAt`.
- Creation/save/abandonment timestamps.
- Lifecycle status.
- Simulation and experience state.
- SHA-256 checksum.

#### Exact checksum payload

Hash the stable canonical serialization of:

```text
{
  runId,
  revision,
  status,
  snapshotVersion,
  rulesetVersion,
  commandSchemaVersion,
  simulationState,
  experienceState
}
```

Exclude:

- `writerId`
- `writerEpoch`
- `leaseExpiresAt`
- `createdAt`
- `savedAt`
- `abandonedAt`
- Recovery metadata

Canonical serialization:

1. Normalize numeric fields.
2. Reject unsupported values and non-finite numbers.
3. Recursively sort object keys lexicographically.
4. Preserve array order.
5. Represent dates only as ISO-8601 strings.
6. Encode stable JSON as UTF-8.
7. Hash those bytes with SHA-256.

The checksum detects corruption; it is not an anti-tamper mechanism.

#### Writer lease

- Generate a new tab-level `writerId` with `crypto.randomUUID()`.
- Acquire/update leases transactionally.
- Visible-tab heartbeat: every five seconds.
- Lease expiry: 60 seconds after the last successful heartbeat.
- Send an immediate heartbeat on focus or visibility restoration.
- Verify writer ID, epoch, lease validity, and expected revision on every save.
- Use `BroadcastChannel("ai-factory")` for lease, save, conflict, and takeover notifications.
- A second tab is read-only while a valid writer exists.
- Explicit takeover atomically increments `writerEpoch`, installs the new writer, and invalidates the old writer.
- An old writer observing a higher epoch stops immediately.
- On startup and every 15 minutes while open, clear expired lease ownership and prune expired backups/abandoned runs.
- Background throttling or device sleep never grants ownership merely because heartbeats were delayed; a competing tab must explicitly take over when a valid lease exists.

#### Durability and migration

- Command-driven saves use a 500 ms debounce.
- Save every 15 seconds only while dirty.
- Visibility-loss and `pagehide` saves are best effort, not the primary durability path.
- Update the run and `activeRunId` atomically.
- Increment revision on each successful write.
- Back up before migration.
- Use pure sequential migrations.
- Validate, normalize, and checksum after every migration step.
- Keep at most three recovery backups per run for 30 days.
- Never overwrite a source record after migration failure.
- Preserve unknown newer snapshots as read-only and exportable.
- Never silently reset after checksum or quota failure.

Starting a new run or resetting:

1. Marks the prior run abandoned.
2. Sets `abandonedAt`.
3. Creates a new run ID.
4. Initializes it through the engine’s fresh-state factory.
5. Acquires a new writer epoch/lease.
6. Updates `activeRunId`.

Keep up to five abandoned full snapshots for 30 days. Keep completed full snapshots for 30 days, while retaining summaries and personal-best references.

Gate: close/reopen, migration, corruption, quota failure, multi-tab conflict, delayed heartbeat, explicit takeover, reset, and recovery preserve the last valid state.

### Milestone A4 — Factual scorecard

Release A contains no 0–100 rating, aggregate score, or named strategy profile.

Completed-run facts:

- Active time.
- Total spend and earned revenue.
- External/emergency funding.
- Peak money and customers.
- Capacity-pressure duration.
- Mean and peak capacity shortfall.
- Emergency funding/capacity interventions.
- Allocation across compute, data, algorithm, commercial, and regulation/resilience categories.
- Breakthroughs and eras completed.
- Final model capability.

One `personalBests` record per ruleset contains:

- Independent factual best references for fastest active time, lowest spend, highest earned revenue, lowest mean shortfall, and fewest emergency interventions.
- `scoredBests`, initially empty and later keyed by `scoreAlgorithmVersion:metricId`.
- The 20 most recent completed-run summaries.

Every best reference stores run ID, value, direction, and completion date. There is no composite or global comparison.

Gate: identical completed state always produces identical facts and independent per-metric bests.

### Milestone A5 — CI, security, deployment, and verification

- Pin Node and npm.
- Add format/lint, typecheck, unit, property, replay, persistence, API, build, audit, and Chromium E2E checks.
- Upgrade or remove vulnerable runtime dependencies.
- Require zero critical/high production advisories.
- Add:
  - `GET /api/healthz`
  - `GET /api/readyz`
  - `GET /api/version`
- `/api/version` returns build SHA, ruleset version, snapshot version, command-schema version, and `migrationVersion: string | null`.
- Use `null` when no production database migration applies; never manufacture a migration version.
- Add truthful root documentation, environment example, architecture, recovery, testing, and release runbooks.
- Deploy and verify the exact served SHA.

Reachability uses scripted prerequisite-minimal, revenue-first, capacity-first, low-cash, capacity-stress, and pause/save/resume scenarios. Property testing supplements reachability by checking invariants across generated valid commands.

Every named transition, rejection, invariant, migration, conflict, and recovery path must be tested. Core and persistence coverage must remain at least 80% as a backstop.

#### Release A regression floor

- No new serious/critical axe findings.
- Existing keyboard-critical flows remain usable.
- No unexplained initial-JS increase above 10%.
- No material LCP regression from baseline.
- No new unexpected console errors.

#### Release A external gate

- Anonymous GNT-2→GNT-7 completion succeeds.
- Timing survives pause, content, visibility changes, and reload.
- Durable state survives close/resume.
- Lease/takeover behavior prevents save ping-pong.
- Reset safely preserves the abandoned run and personal bests.
- Factual summaries are deterministic.
- Unsafe APIs return `410`.
- CSP is enforced.
- CI and dependency gates pass.
- Documentation reproduces setup and recovery.
- The deployed artifact serves the expected SHA and passes live completion/save smoke.

Do not begin Release B until a fresh-context verifier confirms this gate.

## Release B — Better Game

Create `codex/ai-factory-better-game` from the verified Release A tag.

### Strategic design and balance

Give each era a distinct tension:

- GNT-2: seed capital across infrastructure, data, and research.
- GNT-3: monetization versus training capacity.
- GNT-4: growth versus overload and churn.
- GNT-5: efficiency/quality versus brute-force scale.
- GNT-6: speed versus governance, redundancy, and resilience.

Move tunable values into versioned ruleset configuration. Make important recovery events visible, named, and explainable.

Run prerequisite-minimal, revenue-first, capacity-first, research-heavy, commercial-heavy, resilience-heavy, and adaptive agents across a committed seed corpus.

Require:

- Every reasonable strategy can finish.
- Poor but reasonable play remains recoverable.
- Controlled counterfactuals isolate important choices.
- No strategy dominates every important outcome across more than 70% of seeds.
- Property tests remain green alongside scripted reachability.

### Calibrated scoring and profiles

Introduce `scoreAlgorithmVersion` independently from `rulesetVersion`.

A score dimension ships only when it:

- Responds monotonically to its intended counterfactual.
- Does not penalize high utilization without demonstrated shortfall, lost demand, fragility, or failed recovery.
- Has at least a 40-point 10th-to-90th-percentile spread.
- Has absolute correlation below `0.85` with every other displayed score.
- Explains its result through concrete player actions.
- Remains stable across the seed corpus.
- Passes design and learner-comprehension review.

Failed candidates are omitted rather than forced into the release.

Do not use preselected strategy centroids. Candidate profiles use simulated behavior features such as allocations, service timing, reserve margin, shortfall, sequencing, and interventions.

A named classifier must:

- Assign at least 10% of the calibration corpus to each profile.
- Retain labels for at least 85% of runs across bootstrap resamples.
- Be interpreted correctly by at least four of five comprehension testers.

If those gates fail, show descriptive behavior tags rather than named profiles. Classifier changes increment `profileClassifierVersion` and never reinterpret historical runs silently.

### Onboarding and educational truth

- Use at most two welcome screens.
- Make GNT-2 the contextual tutorial.
- Target first investment within 90 seconds and first training completion within 6–8 minutes.
- Keep next goal, blocker, reason, and viable choices visible.
- Make Spark contextual and non-blocking.
- Consolidate Breakthroughs and Progression into Journey.
- Replace stacked overlays with one prioritized message queue.
- Add end-of-era reflections and a decision-grounded debrief.
- Store content source, review date, claim type, uncertainty label, and linked mechanics.
- Label GNT-5–GNT-7 as speculative.
- State that the simulation is simplified and not a forecast.

#### Release B regression floor and gate

- All Release A gates remain green.
- No new serious/critical axe findings.
- Keyboard-critical flows remain usable.
- No unexplained initial-JS increase above 10%.
- No material LCP or console-error regression.
- Every scripted reasonable strategy completes.
- No strategy universally dominates.
- First training requires no arbitrary tab discovery.
- Historical/current claims have sources and speculative claims are labeled.
- Displayed scores/profiles pass calibration and versioning gates.
- Deployed Release B serves the reviewed SHA and passes full-run, migration, save/resume, and summary smoke tests.

Do not begin Release C until independently verified.

## Release C — Validated Pilot

Create `codex/ai-factory-validated-pilot` from the verified Release B tag.

### Accessibility and performance

Meet WCAG 2.2 AA with keyboard-only completion, focus restoration, correct screen-reader behavior, reduced motion, 200%/400% zoom, 44 px targets, no 320 px overflow, and no serious/critical axe findings.

Run full Chromium and critical Firefox/WebKit flows across phone, tablet, 1440 px, and 1920 px layouts.

Performance gates:

- Initial JS at most 300 KB gzip.
- LCP at most 2.5 seconds.
- CLS at most 0.1.
- No recurring steady-state long task above 50 ms.
- No persistent heap growth during an accelerated 30-minute run.

### Product telemetry

Use PostgreSQL/Neon through Drizzle with an additive migration.

General telemetry contains only allowlisted product events, anonymous run ID, build/ruleset/schema versions, server-received time, bounded client-occurrence time, and strict primitive properties.

Server-received time is authoritative. Accept client time only between 24 hours before and five minutes after receipt.

General telemetry may store assessment completion and aggregate correctness, but never raw answers, free text, names, emails, snapshots, commands, or precise user-agent data.

Retention: 90 days.

Add an IndexedDB telemetry outbox in database version `2`:

- Maximum 100 events.
- Maximum age 24 hours.
- Exponential retry.
- Oldest dropped first.
- Analytics failure never interrupts gameplay.

Telemetry failure leaves `/api/readyz` at `200` with `telemetry: "degraded"` and creates an alert.

### Consented study data

Store raw pre/post responses in a separate PostgreSQL `research` schema with separate roles and credentials:

- Runtime analytics role cannot read research data.
- Study submission role can insert but not query.
- Named researcher role can read the active study.
- Raw responses expire after 180 days.
- Deidentified aggregates may remain.
- Participants receive a withdrawal code.

Document that hosting/proxy logs may contain IP addresses. Configure the shortest supported retention, target seven days, and publish the actual provider policy.

### Formative pilot

For a 15-person cohort, target:

- 13/15 begin within 90 seconds.
- 12/15 complete first training.
- 9/15 finish in 20–35 minutes.
- At most 1/15 is stuck without a valid action for over two minutes.
- 10/15 improve on the five-question assessment.
- 12/15 answer at least four post-run questions correctly.
- 12/15 rate enjoyment four or five.
- 5/15 voluntarily replay or request replay.
- Zero corrupted saves or unrecoverable soft locks.

Treat this as formative evidence. Do not claim quantitative product proof until at least 30 participants across two or more cohorts reproduce the thresholds.

### Core versus telemetry release signals

Core rollback signals apply only to static serving, startup, health/version, and essential game behavior:

- Core readiness failure.
- Core-route 5xx above 2% for five minutes.
- Core-route p95 latency above one second for ten minutes.
- Save/resume/completion canary failure.
- Served-SHA or migration-version mismatch.

`POST /api/v1/events` failures and latency are excluded from those rollback calculations. They produce telemetry-degraded alerts but do not independently trigger rollback.

Run a synthetic browser canary continuously against:

- Application startup.
- New anonymous run.
- Local save.
- Reload and resume.
- Deterministic accelerated completion.
- Version/SHA identity.

When telemetry is unavailable, synthetic save/resume/completion evidence remains the authoritative release-safety signal.

### Release C gate

- Staging serves the reviewed SHA.
- Core readiness, migrations, save/resume, completion, accessibility, responsive behavior, headers, and performance pass.
- Database backup/PITR and prior immutable deployment are confirmed.
- Production canary is monitored for 30 minutes.
- Local commit, pushed commit, artifact, deployment, served SHA, and all schema/algorithm versions agree.
- Pilot count gates and qualitative review are reported honestly.
- Critical and repeated high-severity pilot findings are resolved or explicitly accepted.

## Subagent Execution Model

Use one integration lead and at most three concurrent subagents in isolated worktrees. The lead alone owns shared contracts, schemas, package manifests, lockfiles, merge order, tags, deployment, and final truth claims.

### Release A

Implement as five separately mergeable milestones with rollback points:

1. Containment and characterization.
2. Deterministic engine.
3. Persistence and recovery.
4. Factual scorecard.
5. CI, security, deployment, and verification.

Use bounded engine, persistence, QA/security, and release agents as each milestone becomes unblocked. No agent builds against an unmerged contract from another worktree.

### Release B

- Balance/scoring-calibration agent.
- UX/onboarding agent.
- Content-verification agent.

Merge accepted ruleset/calibration work first, content second, and UI integration last.

### Release C

- Accessibility/performance agent.
- Telemetry/privacy agent.
- Research/release-evidence agent.

At the end of every release, a fresh-context, report-first verifier checks both a clean checkout and the deployed artifact.

Every handoff includes branch and commit SHA, changed paths, tests and exact results, evidence locations, assumptions, known risks, and unresolved findings.

## Explicitly Deferred

Do not build accounts, cloud saves, verified competition, teacher administration, LMS integration, multiplayer, difficulty modes, endless progression, an LLM-powered Spark, a native app, or a 3D factory rewrite.

Server replay and identity receive a separate plan only after the Validated Pilot shows that the anonymous core is reliable, educationally useful, strategically meaningful, and worth replaying.
