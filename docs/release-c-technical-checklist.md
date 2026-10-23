# Release C technical execution record

Base: accepted B tag `release-b-2026-10-23`, source
`fadcea8391a31163c004682d83ea76035404b115`. This checklist executes the frozen
roadmap; it does not broaden the product or claim participant validation.

- [ ] Establish typed telemetry/outbox/database contracts and migration/rollback safety.
- [ ] Complete keyboard/focus, motion, reflow/zoom, target sizes and responsive fixes.
- [ ] Qualify Chromium plus critical Firefox/WebKit flows and actual rendered states.
- [ ] Measure complete initial JS graph, LCP/CLS, steady-state tasks and heap behavior.
- [ ] Remove or close the expiring inline-style CSP exception without weakening scripts.
- [ ] Implement strict optional telemetry, GPC/opt-out, bounded durable outbox and isolated failure.
- [ ] Apply additive database schema through reviewed operations, verify restricted roles/credentials.
- [ ] Keep raw consented study data outside telemetry and outside analytics runtime access.
- [ ] Verify retention/withdrawal operations; do not activate participant collection prematurely.
- [ ] Deploy repository-owned browser canaries and separate core/telemetry alert/rollback signals.
- [ ] Confirm staging, prior immutable rollback, provider backup/PITR and actual log policy where accessible.
- [ ] Prepare frozen consent/assessment/task rubric and truthful count-based pilot evidence package.
- [ ] Complete CI, independent review, merge and exact-SHA deployment/production qualification.
- [ ] Observe the actual production canary for30 minutes, not merely elapsed wall time.

The integration owner owns schemas, package/lock changes, session migrations,
Git delivery, provider changes and final truth. Bounded isolated lanes own
accessibility/performance, telemetry/privacy implementation and research/release
operations after their shared contracts are committed. C cannot claim full
technical readiness while a mandatory technical gate is unverified. External
participant/custodian consent and inaccessible provider capabilities are explicit
gaps, never simulated results.

## Local foundation evidence — not Release C closure

- `a0106dd` defines closed event/payload unions, bounded outbox records, and
  exact inspected PostgreSQL/Drizzle dependencies. Installation ignored
  lifecycle scripts; no existing package version/integrity changed; audit0.
- `1e461dc` is the separately deliverable compatibility checkpoint in
  [PR19](https://github.com/mithorizon7/AIFactorySimulatorMH/pull/19). It still
  creates browser schema1 but recognizes only the exact known additive schema2.
  Unknown/malformed future layouts remain untouched and exportable. Its strict
  style CSP uses192-bit request nonces rather than an inline-style exception.
- Additive SQL and explicit operator commands are implemented, not applied to
  production. Four actual disposable PostgreSQL16.15 tests passed: migration
  checksum/idempotency, analytics isolation, closed/insert-only study access,
  active-study readers, retention dry runs/confirmation and withdrawal.
  All rows were synthetic, in a new private socket-only test cluster.
- Pilot materials, count-based evidence templates and the privacy-safe canary
  are implemented. Local canary startup/save/reload/resume/full completion2/2
  passed; policy tests22/22 passed. The deployed schedule and notification path
  are not yet activated or verified.
- Migration attestation distinguishes an actual mismatch from a cold-start
  database outage. Degraded telemetry keeps core readiness200; unknown schema
  evidence cannot close initial technical qualification.

Accessibility/performance and telemetry implementation lanes remain isolated
until their exact source and evidence are integrated and independently checked.
Production remains accepted B until a later checkpoint is explicitly merged,
deployed and verified. No participant collection is authorized or enabled.
