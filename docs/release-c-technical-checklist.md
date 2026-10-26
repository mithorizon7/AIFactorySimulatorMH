# Release C technical execution record

## Authorized collection-disabled shipment, 2026-10-26

The user authorized finishing PR21 and deploying with telemetry and research
collection disabled. This shipment does not activate a pilot, apply production
DDL, change existing database records, or claim the full C research program is
complete. The full-program gates below remain distinct from this release.

- [x] G-001 [status:verified] Fix the browser gate and newly reported validation dependency advisory; pass affected local type, persistence, API, CSP and three-engine regressions. Full final-head CI remains G-002.
- [ ] G-002 [status:open] Pass both PR release gates and merge the exact reviewed head without bypass.
- [ ] G-003 [status:open] Deploy the clean merge to the existing Replit application; independently verify both served origins and collection-disabled behavior.
- [ ] G-004 [status:open] Observe core startup/save/resume/completion canaries for 30 minutes and retain private release/rollback evidence.
- [x] Q-101 [status:verified] Correct the lazy-player filename assertion without weakening SVG, reduced-motion, no-eval or initial-load checks. The same locally reproduced failing test now passes.
- [x] Q-102 [status:verified] Upgrade Zod to patched 4.6.7 and verify persisted snapshots, closed telemetry contracts and strict API rejection.
- [ ] Q-103 [status:open] Close commit/CI/merge/publication and document remaining external pilot-activation prerequisites with owners.
- [x] F-101 [status:verified] [P2] Vite development optimization escapes the player filename as lottie___light, causing the old lottie_light assertion to fail despite rendered SVG. Evidence: locally reproduced PR21 browser failure and its network trace; corrected assertion passes.
- [x] F-102 [status:verified] [P1] Fresh npm audit reports GHSA-mrhx-c7xc-m3w5 for Zod below 4.6.6. Patched 4.6.7 reports zero findings and passes the oversized-invalid-batch regression; final full CI remains G-002.
- [x] F-103 [status:verified] [P2] Zod4's default JIT probe triggers the enforced no-eval CSP even though parsing falls back. All application schemas now use the shared jitless bootstrap before schema creation. Both affected browser checks pass with unchanged CSP and the violation listener retained.

Evidence is retained privately in ignored task-owned output. Existing provider
data stays untouched; the now-retired ownership migration must not be applied.

Local checkpoint: patched Zod 4.6.7 passes typecheck, 460 behavioral tests,
74 persistence tests and 83 targeted server/API/telemetry checks, including a
regression proving oversized invalid batches produce one cardinality issue
instead of per-event issue accumulation. Build and initial-graph budget pass;
fresh full-tree npm audit reports zero findings. Full browser and final CI
verification remain pending. A repository-local Prettier configuration now pins
the existing CI format rather than inheriting an unrelated parent-directory
configuration; format and lint pass without reformatting unrelated sources.

The first broader browser rerun exposed the Zod JIT/CSP incompatibility rather
than a broken keyboard control. A separate development animation failure was a
504 stale optimizer response while the CSP inspection helper and development
browser suite shared Vite's cache; reruns must not overlap those two operations.
Neither failed run is release acceptance. Final browser and CI checks must pass
after the no-JIT bootstrap change, including the existing violation listener.

Replit preparation synchronized bcd2832 and preserved the previous published
checkpoint. Its non-secret environment setter wrote explicit collection-off
flags into tracked `.replit`, so the strict builder correctly refused the dirty
tree before installation. Automatic provider checkpoint db28af7 retains that
change. The same development/production flags are now reviewed in this PR,
with a configuration regression, instead of bypassing clean-source checks.
No database queries, migrations, exports or credential changes were performed.

- [x] V-101 [status:verified] Final no-JIT application source bcd2832 passes the two affected development browser checks and all 27 strict-CSP accessibility/privacy cases across Chromium, Firefox and WebKit, with zero skips/retries. Typecheck and 106 targeted validation/persistence/API cases pass after the bootstrap. Both collection-off configuration cases and validation bootstrap/size guards pass (11 targeted cases). Final full release gates rerun on the reviewed configuration follow-up.

## Full program gates

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
