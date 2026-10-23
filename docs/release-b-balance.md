# Release B balance evidence

This lane supplies version-selected mechanics and canonical action guidance. The default ruleset remains Release A until the integration lead promotes Release B. Nothing here is human playtest, learning-efficacy, scoring-calibration, publication, or deployment evidence.

## Reproduction

Use the repository's frozen Node/npm runtime and installed lockfile graph, then run:

```sh
npm run check
npx --no-install vitest run tests/unit/game
node --import tsx scripts/simulate-release-b.ts --output docs/release-b-balance-report.json
```

The simulator uses 32 committed seeds and seven distinct policies defined in `tests/unit/game/release-b-policies.ts`. All changes use existing typed public commands; policies never inject cash, levels, customers, training progress, or completed eras. The report is deterministic and contains one row per seed/policy, with seed/RNG history reported separately from outcome metrics.

## Mechanical distinctions

| Era   | Choice and observable consequence                                                                                                                                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GNT-2 | Starting capital can buy infrastructure, data, architecture, or optional engineers. More capacity/research investment can bring the first training forward, while retaining cash preserves options.                                                        |
| GNT-3 | API revenue uses service compute; the paired service-on/off comparison earns more revenue but advances research more slowly on the same seed and starting checkpoint.                                                                                      |
| GNT-4 | Marketing immediately adds customers. Demand above service capacity reduces fulfilled revenue and causes proportional churn. Added compute reduces the measured shortfall and recovers earned revenue.                                                     |
| GNT-5 | Data quality and architecture reduce service demand, down to a configured efficiency floor; extra quality can reduce demand without expanding installed capacity.                                                                                          |
| GNT-6 | The next run can start at its ordinary prerequisites. Missing governance or hardware redundancy margins add a disclosed training delay and service-demand risk. Spending on those margins reduces the delay; each target stops being recommended when met. |

Rules live in `shared/game/rulesets.ts`. Research and service effects use current state, never wall time or ambient randomness. The existing persisted regulation/hardware levels represent governance/redundancy; no additional persistence shape or command version is required.

One active tick is one visible, unpaused second. Release B's longer training uses the existing `daysRequired`/`daysRemaining` persistence fields, retaining their historical field names but presenting active seconds.

Funding assistance is explicitly named and recorded as external/emergency funding, not earned revenue. Each era has one continuity runway and at most one delayed second chance. The second chance is bounded, automatic, and explained in guidance. Release A has no invented second-chance action.

Research-team benefit caps at four engineers in B; a fifth hire is rejected before spending. Current total-rate saturation is an advisory, not a permanent prohibition, because later capacity changes can make another engineer useful. Guidance recommends at most one optional introductory hire and explicitly presents waiting for active research as viable.

## Frozen gates

`docs/release-b-balance-report.json` records the full 224-run matrix. Gates require every policy to complete in 1,200–1,800 active ticks, first training in 360–480 ticks, and no pairwise Pareto dominance over more than 70% of seeds.

Final mechanics source: `6d7327504759baad6f65a20b1f03d6996ec89eef`. All 224 runs passed all four report gates; maximum pairwise dominance was 0/32 seeds. Each report row includes a SHA-256 digest of its complete final canonical state.

| Scripted policy      | First training | Full run | Earned revenue | Mean actual shortfall |
| -------------------- | -------------- | -------- | -------------- | --------------------- |
| Prerequisite-minimal | 6:50           | 25:50    | 0              | 0%                    |
| Revenue-first        | 6:50           | 25:50    | 5,798,647      | 0%                    |
| Capacity-first       | 6:30           | 25:20    | 0              | 0%                    |
| Research-heavy       | 6:20           | 25:40    | 0              | 0%                    |
| Commercial-heavy     | 6:50           | 26:00    | 521,661,332    | 0.9231%               |
| Resilience-heavy     | 6:50           | 24:30    | 0              | 0%                    |
| Adaptive             | 6:30           | 25:40    | 5,793,232      | 0%                    |

Times are active minutes:seconds, and revenue uses simulation currency. They are scripted results, not expected human completion times or real-world business forecasts.

The predeclared factual outcome directions are: lower full-run time, lower first-training time, higher final capability, lower spend, higher earned revenue, lower mean actual capacity shortfall, and fewer emergency funding interventions. A policy dominates only if it is no worse on **all** of these and strictly better on at least one. Utilization alone is not a penalty. The tests additionally require different command histories/allocations and material commercial demand/revenue consequences, so a vacuous all-ties comparison does not pass as strategy diversity.

The policies are prerequisite-minimal, revenue-first, capacity-first, research-heavy, commercial-heavy, resilience-heavy, and adaptive. They are test policies, not labels applied to human players.

Important limitation: fixed recovery thresholds currently make the reported aggregate outcomes identical across seeds within a policy. RNG states and event histories are separately covered; this corpus demonstrates deterministic seeded coverage, not meaningful stochastic outcome variation or robustness to arbitrary economic shocks. Policy differences and paired interventions provide the strategic evidence.

Additional executable evidence covers a depleted opening, wasting a continuity grant and receiving its one bounded second chance, complete commercial-run replay, JSON-prefix resume, and 100 fixed-seed property cases across actual B-era/recovery checkpoints. Those properties check immutable inputs, valid schemas, cash/capacity conservation, pause behavior, inspection/application agreement, rejection, and replay.

Training duration is captured into both persisted duration/countdown fields at launch. The final-penalty regression verifies 0–100% progress throughout, exact completion timing, JSON save/resume equivalence, and unchanged captured duration after a mid-run governance investment. Guidance supplies the canonical predicted duration before launch; UI code need not recalculate penalties.

Trusted execution evidence: typecheck, scoped ESLint/Prettier/diff checks, 25 post-duration targeted tests (nine A canonical traces, two B property/replay tests, fourteen B counterfactual/recovery/guidance tests), and the corrected 224-run simulator all passed. The broader 95-test game suite passed immediately before the final duration-metadata correction; its affected paths were rerun in the 25-test set and matrix. The integration lead owns the final whole-tree release gate.

## Compatibility and evidence boundaries

Nine complete canonical Release A trace hashes were captured before B mechanics changed. Legacy helpers explicitly request `release-a.1`; new B tests explicitly request `release-b.1`. Snapshot shape and command schema remain unchanged. Old runs retain their ruleset rather than silently adopting new tuning.

Harness correction: an early lane-local symlink initially reused the original checkout's Vitest 4.1.10. Execution was stopped, and the integration lead replaced only that task-created symlink with the verified Release A installation reporting Vitest 4.1.12. Earlier old-harness results are superseded by the corrected runs; this mismatch is not evidence of a product failure or compromise. The original dependency directory was not modified.

No score dimension, aggregate rating, named classifier, or calibrated strategy profile ships here. Required human-comprehension evidence does not exist. Score/classifier versions stay null, and the debrief remains factual. Independent integrated CI, browser acceptance, served-SHA checks, and deployment are the integration lead's separate gates.
