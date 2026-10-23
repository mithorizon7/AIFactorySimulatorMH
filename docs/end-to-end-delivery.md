# Three-release delivery record

## Authority and sequence

The user authorized scoped implementation, subagents, commits, pushes, PRs,
merges after checks, routine provider configuration, and deployment to the
existing Replit app. Unexpected spend, irreversible deletion, inaccessible
accounts/MFA, uncovered material design decisions, and participant recruitment
or research collection require user involvement.

Release A must be deployed and independently verified before Release B starts.
Release B must be deployed and verified before Release C technical readiness.
Participant evidence is a separate gate and cannot be synthesized.

## Discovery inventory (historical)

- GitHub main at discovery: `f5d65d75c9a344163a93ea2a82c2b862d86a139d`.
- Prior audited local roadmap candidate: `f2904ab4403e054bcbd9db0f51cffec45c4106ea`.
- Original checkout has macOS dataless files with stalled reads. It is preserved.
- Integration checkout: `/private/tmp/aifactory-execution-20261022`.
- Replit app: `8be7f233-2556-442c-ae8c-40eccc810e27`.
- Workspace branch reported by Replit: `release/merged-security-20261022` at
  `8d3c13008d09f86fc9df53877cb3c9449e5fa311`, clean at inspection.
- Existing production: https://aifactorysimulation.com and
  https://ai-factory-mithorizon.replit.app (Autoscale).
- Baseline provider deployment ID: `f565364a-8563-4847-bcde-337e4cb5c120`.
  Preserve its metadata as historical evidence. It has not proven the retired
  API contract, so it is not a safe automatic rollback target for Release A.
- Baseline public health route returned HTML, no serving revision. Edge HSTS
  observed: `max-age=63072000; includeSubDomains`; Express header still present.
- Five cold production navigations measured LCP at 628, 988, 1028, 1040 and
  1076 ms; median 1028 ms. Regressions require both >250 ms and >20% increase.
- Existing provider data must remain preserved; no destructive migration is
  needed for the planned browser-local persistence architecture.

## Delivery gates

- [x] A1 Containment and characterization integrated with current upstream.
- [x] A2 Deterministic engine and scripted completion verified.
- [x] A3 IndexedDB ownership, recovery, durability, hydration, reset verified.
- [x] A4 Factual scorecard and independent per-metric bests verified.
- [x] A5 CI, audits, CSP, keyboard/axe, bundle/LCP floors verified.
- [x] A6 PR merged, Replit deployed, exact serving SHA and browser canary verified.
- [x] B1 Strategic dilemmas and scripted simulator calibration implemented locally.
- [x] B2 Onboarding/Journey/debrief and educational claim labels implemented locally.
- [x] B3 Simulator-backed factual debrief implemented locally; normative scores/profiles
      remain omitted until calibration and actual learner-comprehension evidence pass.
- [ ] B4 Release regression gates passed, merged, deployed and verified.
- [ ] C1 Accessibility and performance completion verified.
- [ ] C2 Optional telemetry isolated from core readiness; separate consented study boundary.
- [ ] C3 Synthetic startup/save/resume/completion monitoring and rollback verified.
- [ ] C4 Pilot operations, retention, consent, evidence package prepared.
- [ ] C5 Technical readiness merged/deployed/verified; real pilot evidence external.

## Evidence policy

Record implementation commit, PR/check/merge, provider deployment identity,
serving SHA, HTTP evidence, browser scenarios, and rollback target separately.
Do not treat provider-agent claims as independently observed HTTP/browser proof.
Store only redacted operational evidence; no cookies, secrets or raw study answers.

## Release A closure — 2026-10-23

Production on both existing origins independently serves
`8902ed9062b71afc9dc47cdc8b7207bb64aa6496`, ruleset `release-a.1`, Node
`22.23.4`. Replit immutable successful build:
`5e850f10-d17d-4799-99ca-29bc7e14465c`, completed `2026-10-23T04:49:32Z`.
The stable deployment ID is not an immutable build identity.

- PRs [4](https://github.com/mithorizon7/AIFactorySimulatorMH/pull/4),
  [15](https://github.com/mithorizon7/AIFactorySimulatorMH/pull/15), and
  [16](https://github.com/mithorizon7/AIFactorySimulatorMH/pull/16) merged after
  passing required checks. Main CI run `39902092731` passed for the served SHA.
- Both origins passed exact-SHA HTTP verification, retired-route probes,
  enforced CSP and HSTS. Independent browser review passed keyboard, zero
  serious/critical axe findings, console/CSP, two-tab fencing, reset, and actual
  browser-shutdown/restart persistence followed by playable resume.
- Server-free public-origin browser suite: 12/12 passed, no skips or retries.
  A public-control run completed with its factual scorecard durably persisted.
- Initial JS: 1,511,077 bytes, +2.52% against baseline. Five cold LCP samples:
  620, 644, 656, 756, 1100 ms; median 656 ms versus baseline 1028 ms.
- Legacy database counts and row checksums unchanged; no rows exported or deleted.
- Two failed provider builds were contained before compilation and did not replace
  production. The tracked npm no-save policy prevented automatic install drift;
  final frozen install/build succeeded. No TLS or lockfile safeguards were disabled.
- [Verified release and rollback artifacts](https://github.com/mithorizon7/AIFactorySimulatorMH/releases/tag/release-a-2026-10-23)
  retain the exact source archive, checksum and redacted independent evidence.
  Source archive SHA-256:
  `8dc29d75b58cf66b1805f1ea942efcf437f5b9a75a1cbe9211869df03c676884`.
- PR [17](https://github.com/mithorizon7/AIFactorySimulatorMH/pull/17) subsequently
  merged a test-harness-only correction at `a37d0fab31b08766dc7a945fff84f9a7b1ebdf17`.
  It is committed/pushed/merged, not a new deployed application revision.

Release B is integrated and locally verified at `e2e9172b6707aae85fb37d949239c7169d23fa27`:
227 behavioral tests, 19 development and 19 production-mode browser tests passed.
See [the integrated B evidence](release-b-verification.md). Its merge, deployment
and independent public-origin verification remain pending. The integration owner
alone owns shared contracts, delivery and production.
Release C remains gated on independently verified Release B production evidence.
Provider host/kernel/trust-store attestation, historical log coverage and actual
backup/PITR policy remain unverified; local application tests do not close them.

## Rollback procedure

After Release A passes production verification, record its deployment ID and
immutable Git SHA as the first known-good rollback. Before B/C deployment,
retain that release and its artifact. If core health/version/static serving or
the browser save/resume/completion canary fails, republish the last known-good
release from a clean checkout of its recorded SHA using the same provider
runtime/build wrapper. Recheck version, retired routes, headers, and canary.
Keep browser snapshots/backups and any retained provider database intact;
never downgrade or erase local records to force a rollback to load them.
Telemetry degradation alone raises an alert and does not trigger core rollback.
