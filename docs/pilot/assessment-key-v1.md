# Facilitator key — pilot-v1

Matches [participant questions](assessment-v1.md) exactly. Freeze before a cohort;
never change the key after seeing results. Do not give answer feedback between
pre and post. A version change starts a separately reported instrument group.

| Question | Correct choice | Intended construct and rationale                                                                 |
| -------- | -------------- | ------------------------------------------------------------------------------------------------ |
| Q1       | B              | Use the canonical blocker and opportunity cost, not a universal investment recipe.               |
| Q2       | C              | Service demand can compete for finite capacity; actual shortfall matters, not utilization alone. |
| Q3       | A              | Local durable saves preserve the run; no closed-window active progression and explicit resume.   |
| Q4       | D              | GNT-5–7 are fictional/speculative; no real AGI, IQ or forecast claim follows.                    |
| Q5       | B              | Historical research supports bounded claims, not invented game prices, timing or returns.        |

For a complete assessment, award 1 point per exact correct choice and 0 for an
incorrect choice; total 0–5. A participant may always skip or stop. Incomplete
assessments are not submitted to the strict five-letter study payload and do not
emit `assessment_completed` or an aggregate correctness event. Record only that
the assessment was incomplete/skipped in the separately consented rubric; never
invent a selected letter or convert missingness into a zero score. No partial
credit, free-text inference, changed denominator or retroactive recoding. Never
send selected letters or question text to general telemetry.

For paired results, compare only participants with both pre and post scores.
An improvement is post total strictly greater than pre total; a tie is not an
improvement. Report the count with both the paired denominator and all-consented
denominator. Report withdrawals and missing post-assessments separately. A
post total of 4 or 5 meets the frozen four-correct threshold. Same-question recall,
practice, facilitator influence and selection bias limit interpretation; no
causal learning effect is established by this instrument.

Mechanic/content basis: [frozen roadmap](../approved-three-release-roadmap.md),
`shared/game/guidance.ts`, local-session contracts, and the bounded
`client/src/lib/learningContent.ts` curriculum. These source links establish
alignment to the game, not psychometric validation or learner comprehension.
