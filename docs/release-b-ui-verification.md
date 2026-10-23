# Release B UI lane verification

## Verdict and evidence boundary

The UI lane is locally verified for the changed navigation, learning surfaces,
keyboard controls, responsive presentation, and retained session workflows.
This is not the final frontend release gate or a deployed-production verdict.
No participant research, calibrated score/profile, or learner-comprehension
result is claimed.

Primary UI source: `881ff1e5fce0c62ce7c8ae9f1718561e2e507a95`, branch
`codex/release-b-experience`, built on the root-approved balance/content checkpoint
`7cd53e2`. That checkpoint still defaults fresh runs to the Release A ruleset.
The initial checks exercise the new B presentation using that default. A later
local B-default check is recorded below; final integrated compatibility and the
deployed artifact remain root-owned gates.

The review follow-up in this report merged accepted root checkpoint `74bc118`
(B default, including `7484501` effective `training.durationTicks`). It guards price drafts with
the canonical payload schema before command inspection, preserves boosted saved
prices, and makes queued prerequisite/customer-loss notices causally accurate.
It removes the inactive callback bridge and duplicate Journey era prefix.

## Source and interaction observations

- One dismissible welcome replaces the forced spotlight tour. GNT-2 practice
  completes from actual era advancement, not a navigation click. Existing played
  saves do not receive a new welcome over ongoing play.
- The persistent objective uses `getRunGuidance`; purchase availability/cost uses
  `inspectCommand`. Three usable choices are visible initially, further choices
  remain discoverable, and ready training stays prominent. UI does not compute
  its own progression blockers or governance penalties.
- Journey replaces the two legacy navigation surfaces. Legacy saved tab aliases
  remain readable. Sourced lessons expose claim type, uncertainty, review date,
  linked mechanics and source links; speculative eras are labeled.
- Engine messages use one durable inline Spark queue. It neither pauses the lab
  nor installs a pointer/keyboard interception layer. Legacy breakthrough,
  advisor and narrative overlays are not mounted by the game page.
- The debrief reports versioned ledger facts and decision-grounded replay
  questions without a normative score or profile. Its dialog supports focus
  containment and returns focus to the summary-review control.
- New-run success/failure toasts are separate session-lifecycle feedback, not a
  second simulation narrative channel. The redundant final-era training toast
  is removed in the follow-up.
- Training duration and progress use the canonical effective duration, including
  the engine-captured governance delay. No UI penalty is independently derived.
- Price drafts are validated before rendering command inspection. Empty and
  out-of-range drafts show an inline error, decimals remain supported, and a
  boosted current price is displayed separately from an explicitly proposed
  legal draft. Only the user's Apply action changes the current price.
- Legacy FactorySection, BreakthroughSection/Modal, EraProgressionPanel and
  InvestmentMilestones educational prose have no active game-page rendering
  path. Persisted A catalog strings and mechanics were not rewritten.

## Initial-source local checks (`881ff1e`)

Environment: Node 22.23.4, macOS, headless Chromium, local Express server in
`NODE_ENV=production`. Browser checks required the normal approved local-listen
permission; sandbox `listen EPERM` was an environment restriction, not a game
failure. The lane build intentionally has no release SHA metadata.

| Check                                                                                                           | Actual result                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`, `npm run lint`, `npm run build`                                                                | Passed for the UI source.                                                                                                                                                                                                                         |
| Presentation-contract Vitest file                                                                               | 5/5 passed.                                                                                                                                                                                                                                       |
| Final focused browser pass: navigation, A keyboard/axe regression, responsive B surfaces, real first investment | 7/7 passed.                                                                                                                                                                                                                                       |
| Retained session suite before the final three-choice presentation refinement                                    | 5/5 passed: reload/no catch-up/reset, takeover fencing, mobile navigation clearance, pending-storage reset, full public-control ladder and durable factual summary/bests.                                                                         |
| Serious/critical axe across Dashboard, Training, Resources, Economy and Journey at 390 and 1440 px              | Zero after fixing existing Reset accessible name and Synergy progressbar names/contrast.                                                                                                                                                          |
| Narrow view                                                                                                     | Header/objective produced no page overflow at 320 px.                                                                                                                                                                                             |
| Console/CSP                                                                                                     | No unexpected errors in the exercised browser paths.                                                                                                                                                                                              |
| Initial local build JS                                                                                          | 1,259,469 bytes; build gzip 293.36 kB. Recorded A comparison: 1,511,077 bytes; decrease about 16.65%.                                                                                                                                             |
| Local cold LCP, existing `measure-lcp.mjs`, five new browser contexts                                           | Samples 116, 116, 116, 124, 124 ms; median 116 ms. This only clears the lane's local regression check against the supplied 656 ms A baseline. It is not a measured real-production improvement; deployed conditions require separate measurement. |

The durable-queue canary waits for the exact pending message ID to appear in
IndexedDB before reloading. Advancing a fake debounce clock alone did not prove
the asynchronous transaction had committed; that test race was repaired without
weakening the reload assertion.

### Review-follow-up refresh

- `npm run check`, `npm run lint`, `npm run build`: passed after `7484501` and
  the review fixes.
- `npm exec -- vitest run tests/unit/contracts/experience-presentation.test.ts`:
  7/7 passed, including missing-funding/stale milestone and cause-free customer
  loss copy guards.
- Local production-mode Playwright: 8/8 passed across `economy-pricing.spec.ts`,
  `navigation-smoke.spec.ts`, `release-a-regression.spec.ts`, and
  `release-b-experience.spec.ts`. The pricing tests use checksummed synthetic A
  records in disposable browser contexts; they prove hydration/rendering and
  editing, not a real playthrough producing that boosted price.
- Actual browser command used `--config output/experience.playwright.config.ts`
  on port 5011; the lane-local helper selects the committed tests against
  `npm start` with `NODE_ENV=production`.
- After merging `74bc118`, a further 7/7 local B-default browser pass covered
  both pricing regressions, all five surfaces at 390/1440 px, 320 px overflow,
  welcome/real investment, and first training through public goal choices.
  First investment was within 90 active ticks and first training completed
  within 360–480 active ticks. This is scripted local evidence, not learner data.
- B-default follow-up build JS: 1,261,639 bytes, gzip 294.23 kB. LCP was **not** remeasured
  after this follow-up; the 116 ms result above belongs to the earlier local
  source and must not be relabeled as final integrated/deployed evidence.

## Screenshot observations and locations

Lane-local artifacts (not committed) are under
`/private/tmp/aifactory-b-experience-20261023/output/playwright/experience-responsive-final/`.
Folders beginning `release-b-experience-B-lab-` contain `welcome-390.png`,
`welcome-1440.png` and `dashboard`, `training`, `resources`, `economy`, `journey`
screenshots suffixed with their viewport width.

The rendered desktop and phone screenshots retain the navy background, amber
objectives, teal actions and existing font. Mobile metrics wrap within their
cards, main navigation uses two columns, and the goal offers three direct choices
before disclosure. The single message slot stays in document flow. Reduced-motion
preference was enabled for these responsive checks. Screenshot inspection is
visual evidence, not participant usability evidence or full screen-reader QA.

## Remaining gate and known issue

Root must rerun the full integrated suite after B default promotion, including
the committed public-control first-training test (investment within 90 active
seconds and first completion at 360–480 active seconds), actual A save fixtures,
summary/focus behavior, final bundle/LCP and deployed served-SHA checks.

The existing Synergy inner four-tab layout can clip the long **Model Capability**
label at 390 px. This C follow-up remains open; the approved B edit there changed
accessible names and contrast only, not that layout. The lane does not claim
complete WCAG 2.2 AA, all-browser support, zoom coverage, or Release C performance
qualification.
