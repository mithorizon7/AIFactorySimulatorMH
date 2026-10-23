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

- run ID and revision;
- ruleset, snapshot, and command-schema versions;
- complete simulation state;
- complete experience state.

Lease fields and save timestamps are excluded. Visible writers heartbeat every five seconds; leases expire after 60 seconds. Focus/visibility restoration heartbeats immediately. A takeover increments `writerEpoch` and is announced through `BroadcastChannel`; stale epochs cannot overwrite current data. `pagehide` is best effort—debounced command saves are the durability mechanism.

Starting a new run abandons the active run after confirmation and preserves its recovery record according to retention policy. Completed runs are immutable summaries. Personal bests use the composite key `[rulesetVersion, metric]`.

`clock.activeTick` is the only active-time authority. Factual spend must reconcile to six exhaustive categories: compute, data, algorithms, commercial, regulation/resilience, and training. Completed summaries are rejected rather than saved when their time, cash, spend, capacity, or completion invariants do not reconcile.

## Version truth

`rulesetVersion`, `snapshotVersion`, `commandSchemaVersion`, and the later `scoreAlgorithmVersion` evolve independently. `/api/version` accepts only explicitly injected build identity. `migrationVersion` is `null` when no production database schema applies.
