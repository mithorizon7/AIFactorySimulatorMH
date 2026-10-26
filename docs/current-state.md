# Current State

The collection-disabled Release C infrastructure is deployed as of 2026-10-26.
Both https://aifactorysimulation.com and https://ai-factory-mithorizon.replit.app
independently serve `fe2e8c98eace7baf440d9bc276ef099366116caf` on Node22.23.4,
ruleset `release-b.1`, with browser persistence schema2. All five served JS/CSS
assets on each origin match the exact clean local merge build byte for byte.
Tag `release-c-disabled-2026-10-26` retains that application source. Later
CI-only and documentation commits are not new deployed application revisions.

Optional product telemetry and all research collection remain disabled. The
version API reports `telemetry: not_configured`, migration null and no configured
database attestation. Both origins pass all23 live browser acceptance cases.
Bounded observation is recorded in [the C shipment checklist](release-c-technical-checklist.md).
This is a shipped application increment, not full C pilot acceptance.

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
verification. Release C's collection-disabled infrastructure is shipped, but
overall technical pilot readiness and human validation remain open. Its source
starts from the verified B tag; shipping it does not authorize recruitment or
data collection. See the [owner-dependent activation prerequisites](pilot/provider-capability-gaps.md).
Existing A runs retain A rules; B will not silently reinterpret their saves.
Unvalidated normative scores and named strategy profiles remain omitted, with
independent algorithm/classifier versions explicitly null.

## Containment already established

- `/api/game-state`, `/api/leaderboard`, and `/api/ranking/:intelligence` return `410 Gone`.
- Leaderboard controls, submissions, and subjective strategy labels have been removed from the client.
- `/api/healthz`, `/api/readyz`, and `/api/version` expose bounded operational and version truth.
- Production uses enforced CSP and does not permit inline/eval scripts.
- Legacy database/auth/query/chart features were removed from core gameplay;
  persistence uses IndexedDB with canonical snapshots, epoch-fenced writers,
  immutable summaries and recovery/export. Optional C PostgreSQL storage remains
  inactive behind the disabled sink. Production core verification passed.

See [current delivery evidence and rollback](end-to-end-delivery.md) and the
[immutable Release A release](https://github.com/mithorizon7/AIFactorySimulatorMH/releases/tag/release-a-2026-10-23).

The living execution record is [the three-release production checklist](ai-factory-three-release-execution-production-checklist.md).
