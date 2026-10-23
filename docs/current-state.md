# Current State

Release A is deployed and independently verified as of 2026-10-23. Both
https://aifactorysimulation.com and https://ai-factory-mithorizon.replit.app serve
`8902ed9062b71afc9dc47cdc8b7207bb64aa6496` on Node 22.23.4, ruleset `release-a.1`.
The preserved execution record distinguishes historical source snapshots,
subsequent non-runtime Git maintenance, provider builds and served revisions.

## Delivery security status — 2026-10-23

- The historical `c372658` security audit is retained as earlier-state evidence,
  not current remote or production truth.
- The production artifact passed exact serving-SHA, retired-endpoint, enforced
  CSP/HSTS, keyboard/axe and browser startup/save/resume/completion checks.
- No credential compromise was established by the repository audit. Historical
  host exposure, provider trust stores/kernel, log retention and backup policy
  remain evidence gaps, not a declaration of safety.

See [the security audit and local remediation record](security-audit-2026-10-22.md).

## Product contract

- One anonymous player can complete one reliable GNT-2 to GNT-7 run.
- The simulation is learning-first, not a verified competition product.
- Persistence is local-first. No account system is planned in the three-release program.
- Release A reports factual outcomes only. Subjective 0–100 scores and strategy profiles belong to simulator-calibrated Release B and have their own `scoreAlgorithmVersion`.
- GNT-5 through GNT-7 are speculative learning scenarios and must be labeled as such.

## Release sequence

1. **Release A — Trustworthy Core:** deterministic simulation, safe local persistence/recovery, factual scorecard, security/CI, and deployed proof.
2. **Release B — Better Game:** strategic era dilemmas, balance simulator, onboarding/Journey redesign, debrief, claim governance, and calibrated scoring/profiles.
3. **Release C — Validated Pilot:** accessibility completion, privacy-separated telemetry/research, formative playtests, performance, monitoring, and deployment evidence.

Release A's external stop gate passed. Release B is now in progress; Release C
remains blocked until B meets the same independently verified production gate.
Existing A runs retain A rules; B will not silently reinterpret their saves.
Unvalidated normative scores and named strategy profiles remain omitted, with
independent algorithm/classifier versions explicitly null.

## Containment already established

- `/api/game-state`, `/api/leaderboard`, and `/api/ranking/:intelligence` return `410 Gone`.
- Leaderboard controls, submissions, and subjective strategy labels have been removed from the client.
- `/api/healthz`, `/api/readyz`, and `/api/version` expose bounded operational and version truth.
- Production uses enforced CSP and does not permit inline/eval scripts.
- The unused database/auth/query/chart stack was removed; application persistence
  uses IndexedDB with canonical snapshots, epoch-fenced writers, immutable
  completed summaries, and recovery/export. Production verification passed.

See [current delivery evidence and rollback](end-to-end-delivery.md) and the
[immutable Release A release](https://github.com/mithorizon7/AIFactorySimulatorMH/releases/tag/release-a-2026-10-23).

The living execution record is [the three-release production checklist](ai-factory-three-release-execution-production-checklist.md).
