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

## Integrated checkpoint —2026-10-23

The lanes are integrated, including independent review of consent revocation,
asynchronous cancellation and exact schema2 preservation. The actual disposable
PostgreSQL qualification passes8tests, including the real restricted-pool writer,
role/ACL drift, idempotence and retention. Two catalog/driver defects discovered
by those tests were corrected without broadening permissions.

Clean integrated candidate `a147b7c` passes23production-mode browser tests and
12strict-CSP Chromium/Firefox/WebKit checks. Behavioral coverage passes536tests
at90.75% statements/87.06% branches; a later added retry-race regression also
passes and will be included in final CI. Initial graph573811raw/162945gzip bytes.
Local cold LCPmedian124ms, CLS0, no steady long tasks;30-minute accelerated GNT2
heap drift+354424bytes with flattening final increment. These are local
diagnostics, not production/device or leak-certification claims. Native zoom and
assistive-technology acceptance remain unmeasured. Final served qualification
and CI remain open, as do the mandatory provider/monitoring gates above.

Production now serves `edd714075eec03c41d9e52185fe8b3841abce5aa` (PR20 after
CI39934768639). Both origins independently pass exact identity/asset hashes,
Cancel/Escape focus restoration and save/reload/resume/reset. The earlier C1
Reset-Cancel focus P2 is preserved historically and closed by observed repair.
Dedicated C1/A/B rollback references remain retained.

Chrome's existing profile reaches a Replit login screen. Account-specific
credential binding/exclusion, backup/PITR, log policy, isolated staging and
research IAM remain unverified. No production DDL, telemetry or participant
collection is enabled. Detailed evidence bundles/screenshots/reports/SBOM stay
private by explicit user choice. The C technical gate is not claimed complete.
