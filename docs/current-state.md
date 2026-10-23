# Current State

Verified execution base: `f5d65d7` from freshly fetched `origin/main` on 2026-10-22. The audited deterministic-engine candidate was restored into `codex/three-release-execution-20261022`, preserving the newer upstream Node bootstrap, Tailwind 4 security migration, and historical security evidence.

## Delivery security status — 2026-10-22

- `origin/main` has advanced to `f5d65d7`. The historical `c372658` security audit
  is retained as evidence of the earlier state, rather than current remote truth.
- The currently served artifact is being verified independently by the integration
  owner. Local security tests do not establish the deployed revision.
- Treat deployment as blocked until the contained revision is pushed, built on
  patched Node 22.23.4+, and independently verified with `/api/version`, the
  retired-endpoint probes, and the synthetic browser canary.

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

Release B remains blocked until Release A is deployed and independently verified. Release C remains blocked until Release B meets the same stop gate.

## Containment already established

- `/api/game-state`, `/api/leaderboard`, and `/api/ranking/:intelligence` return `410 Gone`.
- Leaderboard controls, submissions, and subjective strategy labels have been removed from the client.
- `/api/healthz`, `/api/readyz`, and `/api/version` expose bounded operational and version truth.
- Production uses enforced CSP and does not permit inline/eval scripts.
- The unused database/auth/query/chart stack was removed; application persistence will use IndexedDB.

The living execution record is [the three-release production checklist](ai-factory-three-release-execution-production-checklist.md).
