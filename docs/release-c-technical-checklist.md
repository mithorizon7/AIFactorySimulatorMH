# Release C technical execution record

## Scope

The user authorized finishing PR21 and deploying with telemetry and research
collection disabled. This shipment does not activate a pilot, apply production
DDL, change existing database records, or claim the full C research program is
complete. The full-program gates below remain distinct from this release.

## Sign-off Gate

- [x] G-001 [status:verified] Complete the authorized collection-disabled shipment and its bounded production verification, without claiming the full pilot is finished. Full-program owner/provider/human gates remain explicit below.
- [x] G-002 [status:verified] Original PR21 gates passed on 37ca312 and merged at exact-tree fe2e8c9. CI-only PR22 passed every gate in run 40362491898 and merged at exact-tree 6e26a4b without bypassing checks. Preserve the separate release record without altering the served application revision.
- [x] G-003 [status:verified] Deploy the clean application merge and independently verify both served origins, browser behavior and disabled collection. Later CI/documentation-only commits do not require or imply another application deployment.
- [x] G-004 [status:verified] Six healthy one-off core startup/save/resume/completion samples across both origins span 38.42 minutes; private release/rollback evidence is retained. Recurring monitoring remains disabled by the explicit owner decision, not claimed active.

## Rerun Matrix

Application, schema or runtime edits invalidate affected type, behavior, security,
build and browser checks. Configuration changes require the clean frozen builder
and disabled-collection checks. Documentation does not alter the accepted runtime
tree; its separate delivery must not silently change the served revision.

## Audit Queue

- [x] Q-101 [status:verified] Correct the lazy-player filename assertion without weakening SVG, reduced-motion, no-eval or initial-load checks. The same locally reproduced failing test now passes.
- [x] Q-102 [status:verified] Upgrade Zod to patched 4.6.7 and verify persisted snapshots, closed telemetry contracts and strict API rejection.
- [x] Q-103 [status:verified] Close publication and bounded observation evidence; document external pilot prerequisites and the explicit decision to leave recurring monitoring disabled.
- [x] Q-104 [status:verified] Qualify and merge the deterministic browser-image CI repair after the post-merge apt-download cancellation. PR22 passed all checks and merged at 6e26a4b.

## Findings Log

- [x] F-101 [status:verified] [P2] Vite optimization escapes the development player filename as lottie___light rather than lottie_light. confidence:high.
      Evidence: locally reproduced PR21 failure and network trace; corrected filename assertion passes without weakening rendered SVG, reduced-motion, lazy-load or no-eval checks.
      Owner: Codex.
- [x] F-102 [status:verified] [P1] Zod below 4.6.6 is affected by GHSA-mrhx-c7xc-m3w5. confidence:high.
      Evidence: [reviewed advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), patched 4.6.7 frozen install/full audit zero, and oversized-invalid-batch regression.
      Owner: Codex.
- [x] F-103 [status:verified] [P2] Zod4's default JIT probe triggers the enforced no-eval CSP even when it falls back. confidence:high.
      Evidence: original production keyboard test caught the violation. The shared pre-schema jitless bootstrap and import guard now pass that same listener plus 27 three-engine cases; CSP was not weakened.
      Owner: Codex.
- [x] F-104 [status:verified] [P2] The post-merge main CI was canceled at the 30-minute limit during slow Ubuntu browser-dependency downloads, before its browser suites ran. confidence:high.
      Evidence: run 40356043026, job 121688660465; log shows 119 MB of apt archives downloading from 16:20 until cancellation at 16:37:48, without an application-test failure. Repaired CI run 40362491898 completes every gate in the immutable browser image; PR22 merged at 6e26a4b. The original cancellation is retained, not relabeled a pass.
      Owner: Codex for deterministic CI tooling.

## Fix Log

- [x] P-101 [status:verified] Repair lazy-player recognition, patch validation, initialize all application schemas without JIT, pin formatting and review collection-off provider configuration in source.
      Addresses: F-101, F-102, F-103.
      Evidence: PR21 head 37ca312, passing CI40352982776, exact-tree merge fe2e8c9, clean local/Replit frozen builders and zero dependency findings.
- [x] P-102 [status:verified] Use the official Playwright 1.64.1 Noble image pinned by immutable registry digest, with non-root execution and private shared memory, instead of repeating apt dependency downloads in every validation job.
      Addresses: F-104.
      Evidence: [official container guidance](https://playwright.dev/docs/ci#via-containers), registry manifest digest 47b510dd9230bf0b9bfc9b20102241e577ea7a99334ab4c3ca19f19770e9b8ea and locked-version regression. Node 22.23.4 setup, all test/audit gates and private-only evidence policy remain intact. Full CI 40362491898 passed before PR22 merged; merge tree equals qualified head 2757752.

Evidence is retained privately in ignored task-owned output. Existing provider
data stays untouched; the now-retired ownership migration must not be applied.

Historical pre-CI local checkpoint: patched Zod 4.6.7 passed typecheck, 460 behavioral tests,
74 persistence tests and 83 targeted server/API/telemetry checks, including a
regression proving oversized invalid batches produce one cardinality issue
instead of per-event issue accumulation. Build and initial-graph budget pass;
fresh full-tree npm audit reported zero findings. Full browser and final CI
verification were pending at that checkpoint and later passed in V-102. A repository-local Prettier configuration now pins
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
with a configuration regression in PR21, instead of bypassing clean-source checks.
No database queries, migrations, exports or credential changes were performed.

The temporary Replit smoke server caused the provider to add an extra 5001 port
mapping. Its checkpoint 6e435741b4750f85e85bd65f2e62895ba2f49c9e was preserved on
`safety/pr21-provider-port-checkpoint`. Final preparation restored the exact
reviewed merge with only port5000-to80, then passed the clean-source builder.

## Validation Log

- [x] V-101 [status:verified] Final no-JIT application source bcd2832 passes the two affected development browser checks and all 27 strict-CSP accessibility/privacy cases across Chromium, Firefox and WebKit, with zero skips/retries. Typecheck and 106 targeted validation/persistence/API cases pass after the bootstrap. Both collection-off configuration cases and validation bootstrap/size guards pass (11 targeted cases). Final full release gates rerun on the reviewed configuration follow-up.
      Evidence: 2026-10-26 pass; local Playwright matrix and targeted Vitest results. Exact final candidate also passes all 23 local production-mode browser tests.
- [x] V-102 [status:verified] Final-head PR CI and merge pass.
      Evidence: 2026-10-26 pass; CI40352982776 on 37ca312: 465 unit, 74 persistence, 26 API, 544 coverage and 8 actual PostgreSQL16.15 cases; 23 development, 23 production and 27 three-engine browser cases, no skipped gates. Coverage90.89% statements/87.16% branches. Both dependency audits report zero. Merge fe2e8c9 has the identical accepted tree.
- [x] V-103 [status:verified] Verify actual public release identity, exact served asset bytes, disabled collection and full browser acceptance on both domains.
      Evidence: 2026-10-26 pass; exact fe2e8c9 and all five byte-identical JS/CSS assets on each origin. Full live browser suites23/23 per origin, zero failed/flaky/skipped cases. Actual synthetic event POSTs receive503, GPC receives204 before parsing, and research ingestion is404 on both. Independent visible investment changes cash1000-to860 and compute1-to2, then presents the next Data Quality choice.
- [x] V-104 [status:verified] Actual core canary samples across both origins pass over more than 30 minutes; recurring monitoring remains disabled by owner choice.
      Evidence: 2026-10-26 pass; six healthy samples, 12 browser cases, from 16:18:33.676 to 16:56:58.766 UTC, span 38.42 minutes. One additional network-restricted local attempt returned ENOTFOUND before browser startup; the identical Node requests return 200 outside the sandbox. Its failed report is retained and excluded, never called healthy. Final both-origin HTTP/security/retired-route, exact asset-byte and synthetic collection-off probes pass. PRODUCTION_CANARY_ENABLED remains false after the explicit user decision. Bounded samples have gaps and do not imply continuous coverage or an SLA.
- [x] V-105 [status:verified] Actual public cold-load measurement and complete initial-graph budget pass.
      Evidence: 2026-10-26 pass; five cold LCP samples500/544/548/668/708ms, median548ms against the recorded B848ms baseline, using the same measurement procedure. Initial JS604853bytes/174842gzip bytes is under the307200-byte gzip gate. These are measurements on this test setup, not physical-device qualification or a causal performance claim.
- [x] V-106 [status:verified] Qualify the exact pinned browser-image CI follow-up while preserving all release checks.
      Evidence: 2026-10-26 pass; [CI 40362491898](https://github.com/mithorizon7/AIFactorySimulatorMH/actions/runs/40362491898) on 2757752 completed at 17:09:26 UTC. All 466 unit, 74 persistence, 26 API, 545 coverage and 8 real disposable PostgreSQL cases pass; 23 development, 23 production and 27 three-engine browser cases pass, no failures/skips/flaky cases. Coverage 90.89% statements/87.16% branches; both audits zero. PR22 merged at 6e26a4b with the identical qualified tree. No application runtime files changed; exact fe2e8c9 remains live. Original canceled main run 40356043026 remains recorded as an infrastructure failure, not an application/browser pass.

## Residual Risks

- [x] R-101 [status:accepted_risk] The user authorized shipment with collection disabled, not full C pilot activation. Provider backup/PITR, log retention/access, isolated exact-artifact staging, restricted production credentials, named research custody/consent, native assistive-technology acceptance and real participant evidence remain unverified prerequisites, not closed security findings.
      Owner: User/project operator and provider administrator; research owner/custodian for participant work.
      Follow-up: close the account-specific controls and human evidence before any collection/pilot activation. Keep telemetry/research off meanwhile. Read-only provider discovery was refreshed 2026-10-26 without records, logs or credentials.
- [x] R-102 [status:accepted_risk] The user explicitly chose "Leave recurring monitoring disabled" on 2026-10-26 after the separate activation question. The activation flag is confirmed false. Bounded release QA is not persistent monitoring or an uptime SLA; outages after this session are not automatically covered by this canary.
      Owner: User/project operator for the deliberate monitoring decision and future reauthorization.
      Follow-up: do not enable the schedule or claim coverage/alert delivery. If the owner later opts in, verify actual scheduled starts/results and an alert recipient/receipt before claiming ongoing operational coverage.

## Change Log

- 2026-10-26: User approved finishing PR21 and deploying with optional collection disabled. Repaired the reproduced browser gate, patched the fresh Zod advisory, resolved JIT/CSP compatibility and reviewed explicit provider flags in Git.
- 2026-10-26: All final PR21 gates passed; merged and published exact fe2e8c9. Both origins pass independent release/asset, disabled-collection and 23-case browser acceptance. Six healthy bounded samples span 38.42 minutes; the sandbox-only DNS failure is retained separately. Recurring monitoring remains off by user choice; no full pilot or continuous coverage claim.
- 2026-10-26: CI-only PR22 removes nondeterministic per-run browser OS dependency downloads. Full CI 40362491898 passes every unchanged gate; merged at 6e26a4b. Release evidence and owner boundaries are documented separately; no runtime redeployment or collection activation follows from this maintenance.

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
