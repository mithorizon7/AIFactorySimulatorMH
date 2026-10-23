# Pilot and release evidence — blank template

Status: NOT COLLECTED. This is not a cohort, healthy-monitor claim or release
acceptance. Leave unknown fields blank and label them unknown. Do not replace
missing participant evidence with synthetic runs or zero counts. Store completed
restricted records outside the repository; publish only owner-reviewed aggregates.

## Cohort identity and dispositions

Study/cohort ID: ____; owner/custodian: ____; dates: ____.
Consent revision: ____; assessment/key revision: ____; tasks/rubric: ____.
Exact served SHA and ruleset/snapshot/command/migration versions: ____.
Approved collection/role/retention evidence reference: ____.
Accommodations and broad browser/device mix (no precise user agent): ____.

| Population                            | Count | Notes/denominator                              |
| ------------------------------------- | ----- | ---------------------------------------------- |
| Invited                               |       |                                                |
| Eligible and affirmatively consented  |       | Target cohort 15; actual denominator mandatory |
| Declined before consent               |       | No study answers retained                      |
| Withdrew after consent                |       | Deletion status in restricted custody only     |
| Gameplay attempted / completed        |       | Both counts required                           |
| Pre assessed / post assessed / paired |       | All three counts required                      |
| Missing/skip/early-stop records       |       | Explain without identity/free text             |

## Frozen formative counts

| Measure                                     | Target for 15 consented sessions | Observed numerator / all-consented | Relevant paired/attempted denominator | Outcome/limitations |
| ------------------------------------------- | -------------------------------- | ---------------------------------- | ------------------------------------- | ------------------- |
| Independent start within 90 seconds         | 13/15                            |                                    |                                       |                     |
| First training complete                     | 12/15                            |                                    |                                       |                     |
| Full completion in 20–35 wall-clock minutes | 9/15                             |                                    |                                       |                     |
| No valid action for over 2 minutes          | At most 1/15                     |                                    |                                       |                     |
| Strict paired assessment improvement        | 10/15                            |                                    |                                       |                     |
| At least 4 post answers correct             | 12/15                            |                                    |                                       |                     |
| Enjoyment 4 or 5                            | 12/15                            |                                    |                                       |                     |
| Voluntary replay or spontaneous request     | 5/15                             |                                    |                                       |                     |
| Corrupted acknowledged saves                | 0                                |                                    |                                       |                     |
| Unrecoverable soft locks                    | 0                                |                                    |                                       |                     |

If actual consented n is not 15, show n explicitly and mark the 15-person gate
unevaluated; do not rescale it to pass. Also show paired n and attrition for the
assessment rather than only completers. Include each task's I/P/F/A/N counts,
facilitator intervention count, accommodations, serious/repeated findings and
fix/retest evidence. Keep participant-level notes and raw selected answers out of
this aggregate document. Two cohorts/at least 30 participants reproducing targets
remain descriptive formative evidence, not a randomized causal learning study.

## Technical release and 30-minute canary observation

Exact local/pushed/CI/build/deployment/served SHA and version tuple: ____.
Independent verifier: ____; immutable rollback and rehearsal reference: ____.
Staging, byte identity, backup/PITR, logging and restricted-role proofs: ____.
Core readiness/static/save/resume/completion/accessibility/performance: ____.
Telemetry status separately: ____; no telemetry-only rollback: ____.

| Actual UTC start/end | Expected/served SHA | Startup/save/resume/full completion | Core failure or infrastructure gap | Telemetry separate | Private sanitized evidence reference |
| -------------------- | ------------------- | ----------------------------------- | ---------------------------------- | ------------------ | ------------------------------------ |
|                      |                     |                                     |                                    |                    |                                      |

Record observed runs spanning at least 30 minutes and every gap/error, with a named
operator watching results and checking stale/missing samples. Scheduled dispatch
or elapsed wall time alone is not 30 minutes of observed canary health. GitHub's
best-effort 30-minute schedule is not sufficient by itself for continuous release
observation; use a supervised bounded sequence and record its actual cadence.
Core rollback thresholds are in [operations](canary-operations.md); raw hosting
metrics are unavailable unless separately evidenced.

## Custodian closeout

Retention job evidence/date: ____; withdrawal rehearsals: ____; actual requests
resolved/open counts: ____; primary/export deletion verification: ____; backup
expiry/deletion replay: ____; named-access revocation: ____.
Known limitations and unresolved required gates: ____.
Owner decision and date (not prefilled acceptance): ____.
