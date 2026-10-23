# Validated Pilot operations

This is an operations template, not participant evidence. Technical readiness
does not establish usability or learning effectiveness. Recruitment, consent,
and collection require the research owner's authorization.

## Before recruitment

- Name a study owner, facilitator, and restricted research-data custodian.
- Record deployed SHA, rulesetVersion, scoreAlgorithmVersion, browser/device,
  consent revision, tasks, assessment revision, and observation rubric.
- Confirm accessibility options, optional telemetry, withdrawal/export/deletion
  process, retention, and an accessible contact channel.
- Rehearse with synthetic records only and verify deletion and access boundaries.
- Obtain consent before observing or collecting any participant response.
- Explain that hosting/access logs can contain IP addresses even when the
  application event database intentionally stores no IP addresses.

## Formative cohort

Use 15 consented sessions for formative usability findings. Record counts with
denominators and qualitative observations; do not present small-sample
percentages as product proof. Use at least two independent cohorts and at least
30 participants before treating quantitative thresholds as stronger product
evidence. These remain descriptive observations, not causal learning claims.

Tasks: anonymously start, explain compute/data/algorithm constraints, make an
investment, identify training blockers, pause, close/reload/resume, complete a
run, interpret factual debrief, and reset safely. Include keyboard-only and
assistive-technology sessions with the participants' normal accommodations.

Record a task as independent, prompted, failed, or inaccessible. Record elapsed
time from the task's stated start. Do not invent observations from telemetry.

Proposed formative gates (15-session cohort):

- At least 13/15 start within 90 seconds without facilitator instructions.
- At least 12/15 complete their first training.
- At least 9/15 finish in 20–35 minutes.
- At most 1/15 is stuck without a valid action for more than two minutes.
- At least 10/15 improve on the five-question assessment.
- At least 12/15 answer four or more post-run questions correctly.
- At least 12/15 rate enjoyment four or five out of five.
- At least 5/15 voluntarily replay or request replay.
- Zero corrupted saves or unrecoverable soft locks.
- All serious accessibility failures receive a fix and affected retest.

Treat these gates as investigation triggers and report every observed failure,
facilitator intervention, participant count, and accommodation. Do not hide a
failed gate behind an aggregate completion rate.

## Assessment and data boundaries

Use matched pre/post questions on systems tradeoffs, uncertainty, and simulated
versus historical claims. Freeze answer keys and revision before the cohort.
Report paired changes with individual counts and uncertainty; a small pilot
cannot establish causality or general population impact.

Normal product telemetry receives assessment completion and aggregate
correctness only, never questions, answer text, consent records, names, email,
or recordings. Treat server-received time as authoritative. Sanity-bound client
occurredAt to the documented collection window; reject future/out-of-window
timestamps rather than trusting the client clock.

Raw answers belong to a separate consented study dataset with a distinct access
role and pseudonymous study ID. Keep consent/contact mapping separately from
responses. Never write either to general telemetry events or application logs.
Raw responses expire after 180 days as specified in the frozen roadmap, then
require verified deletion; retain only approved deidentified aggregates. The
consent notice must state this limit. Keep raw responses in a separate research
schema with separate study-submission and researcher access boundaries.

## Evidence packet and closeout

Retain the consent version and counts, recruited/completed/withdrawn counts,
task rubric, redacted observations, issue/fix/retest links, assessment revision,
paired aggregate results, accessibility findings, deployment evidence, and
limitations. The custodian records raw-data deletion date and verification.

Close the pilot gate only after real consented sessions and review. Until then,
label the release "Validated Pilot technical readiness; participant evidence
pending." Telemetry uptime is not evidence of participant understanding.
