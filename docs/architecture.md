# Architecture

## Trust boundaries

- **Simulation engine:** pure, deterministic transitions over versioned state and strict typed commands. It owns no run IDs, browser APIs, React state, toasts, or reset lifecycle.
- **Experience reducer:** tutorial, navigation, queued messages, acknowledgements, and debrief presentation state.
- **Session layer:** run lifecycle, command dispatch, debounced durability, writer ownership, migration/recovery, abandonment, completion, and creation of new run IDs.
- **IndexedDB repository:** canonical snapshots, recovery backups, metadata/lease records, a separate immutable `completedRuns` summary store, and per-metric personal bests.
- **React UI:** renders selectors and effects, dispatches commands, and never mutates the simulation object directly.
- **Server:** serves static assets plus health/readiness/version contracts. Legacy shared-state and ranking APIs remain retired.

## Determinism contract

- Active time is an integer `activeTick`; one active tick retains the current one-game-day/one-active-second cadence for Release A.
- Pause and hidden/closed time never create catch-up ticks.
- Random events use persisted `xorshift32-v1` state and committed seeds for fixtures.
- Commands are strict discriminated unions with `commandSchemaVersion`.
- Numeric state is normalized at explicit canonical boundaries after each command cascade and each individual tick.
- The engine exposes a pure fresh-state factory. Reset belongs to the session layer, which abandons the old run, creates a new run ID, and initializes a completely fresh object graph.

## Persistence contract

Snapshot checksums use SHA-256 over canonical recursively key-sorted JSON containing:

- run ID, revision, and lifecycle status;
- ruleset, snapshot, and command-schema versions;
- complete simulation state;
- complete experience state.

Lease fields and save timestamps are excluded. Visible writers heartbeat every five seconds; leases expire after 60 seconds. Focus/visibility restoration heartbeats immediately. A takeover increments `writerEpoch` and is announced through `BroadcastChannel`; stale epochs cannot overwrite current data. `pagehide` is best effort—debounced command saves are the durability mechanism.

Starting a new run abandons the active run after confirmation and preserves its recovery record according to retention policy. Completed runs are immutable summaries. Personal bests use the composite key `[rulesetVersion, metric]`.

Database `ai-factory`, version 1, contains `runs` (indexes `status`, `savedAt`,
`rulesetVersion`), `meta`, `recoveryBackups`, `completedSnapshots`,
`completedRuns`, and `personalBests`. `meta.activeRunId` is updated atomically
with the run. Canonical checksum keys are `runId`, `revision`, `status`,
`snapshotVersion`, `rulesetVersion`, `commandSchemaVersion`, `simulationState`,
and `experienceState`. ISO creation/save/abandonment timestamps, writer identity,
epoch and lease expiry are metadata outside the hash.

Commands debounce saves for 500 ms; dirty sessions flush every 15 seconds.
Maintenance every 15 minutes retains three backups per run and at most five
abandoned runs for 30 days. Completed full snapshots expire after 30 days;
immutable summaries and independent best references remain. Corrupt or newer
records remain byte-for-byte exportable rather than being rewritten with
abandonment metadata. An unsupported database version can be exported through
a read-only connection without downgrading or recreating it. Historical
`ai-factory-local` development data is preserved and included in recovery export.

Reload uses a Web Lock to reserve a tab writer identity. Browsers without Web
Locks use fresh writer identities and explicit takeover. Every acquisition
increments the epoch, preventing late operations from an older document from
overwriting or releasing the reloaded document's lease. BFCache restoration
reacquires and hydrates paused before accepting simulation ticks.

`clock.activeTick` is the only active-time authority. Factual spend must reconcile to six exhaustive categories: compute, data, algorithms, commercial, regulation/resilience, and training. Completed summaries are rejected rather than saved when their time, cash, spend, capacity, or completion invariants do not reconcile.

## Version truth

`rulesetVersion`, `snapshotVersion`, `commandSchemaVersion`, and the later `scoreAlgorithmVersion` evolve independently. `/api/version` accepts only explicitly injected build identity. `migrationVersion` is `null` when no production database schema applies.

Fresh runs use `release-b.1`. Existing `release-a.1` snapshots retain their
mechanics, seeded RNG and canonical checksum format; the snapshot header must
agree with its simulation's ruleset. Ruleset lookup is explicit and rejects
unsupported versions rather than silently falling forward. B does not change
the IndexedDB schema version. Normative score and profile versions remain null.

`getRunGuidance`, `inspectCommand`, `getResearchRate`, `getServiceDemand` and
`getTrainingDuration` are canonical shared selectors. React does not reproduce
their eligibility, cap or timing formulas. B captures effective training duration
when training starts; progress and resume use that duration, not a recalculation
from later investments. Educational provenance is presentation content, not an
additional simulation authority.
