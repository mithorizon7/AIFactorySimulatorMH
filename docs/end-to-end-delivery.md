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

## Current inventory

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

- [ ] A1 Containment and characterization integrated with current upstream.
- [ ] A2 Deterministic engine and scripted completion verified.
- [ ] A3 IndexedDB ownership, recovery, durability, hydration, reset verified.
- [ ] A4 Factual scorecard and independent per-metric bests verified.
- [ ] A5 CI, audits, CSP, keyboard/axe, bundle/LCP floors verified.
- [ ] A6 PR merged, Replit deployed, exact serving SHA and browser canary verified.
- [ ] B1 Strategic dilemmas and scripted simulator calibration implemented.
- [ ] B2 Onboarding/Journey/debrief and educational claim labels implemented.
- [ ] B3 Independently versioned calibrated scores/profiles implemented.
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
