# Current State

Releases A and B are delivered. As of 2026-10-23T10:14Z, both
https://aifactorysimulation.com and https://ai-factory-mithorizon.replit.app serve
the independently verified C compatibility/focus checkpoint
`edd714075eec03c41d9e52185fe8b3841abce5aa` on Node22.23.4, ruleset `release-b.1`.
It enforces nonce-only styles, supports exact additive browser-schema2 rollback,
and restores Reset trigger focus after Cancel/Escape. It does not activate
telemetry, research or the full Release C technical gate.
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
- Releases A and B report factual outcomes. Subjective 0–100 scores and strategy profiles require simulator calibration and real learner-comprehension evidence; that unmet human gate means B omits them and reports null independent algorithm/classifier versions.
- GNT-5 through GNT-7 are speculative learning scenarios and must be labeled as such.

## Release sequence

1. **Release A — Trustworthy Core:** deterministic simulation, safe local persistence/recovery, factual scorecard, security/CI, and deployed proof.
2. **Release B — Better Game:** strategic era dilemmas, balance simulator, onboarding/Journey redesign, factual debrief and claim governance. Normative scoring/profiles remain gated and omitted.
3. **Release C — Validated Pilot:** accessibility completion, privacy-separated telemetry/research, formative playtests, performance, monitoring, and deployment evidence.

Release A and B external stop gates passed, including fresh-context production
verification. Release C technical readiness is in progress. Only the separate
compatibility and focus checkpoints are deployed; the integrated pilot candidate
is still under verification, not released or human-validated. Its source starts
from tag `release-b-2026-10-23`.
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
