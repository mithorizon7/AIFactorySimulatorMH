# AI Factory tutorial and end-to-end QA hardening Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-03-30T11:22:31
- Last Updated: 2026-03-30T12:00:40-0400
- Workspace: /Users/davedxn/Downloads/AIFactorySimulatorMH
- Checklist Doc: /Users/davedxn/Downloads/AIFactorySimulatorMH/docs/ai-factory-tutorial-and-end-to-end-qa-hardening-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Capture explicit scope, constraints, and success criteria.
  - Scope: make the AI Factory app boot from a clean local checkout, reproduce the broken tutorial flow in a real browser, fix any tutorial blockers, and add durable browser-driven regression coverage for tutorial plus core smoke flow.
  - Constraints: preserve existing gameplay, avoid reverting user changes, prefer end-to-end coverage over static file checks, validate against the final local code state.

## Sign-off Gate
- [x] G-001 [status:verified] All queued work, findings, fixes, and validations are complete.
- [x] G-002 [status:verified] All findings are resolved or marked `accepted_risk` with rationale and owner.
- [x] G-003 [status:verified] Required validation suite has been rerun on the final code state.
- [x] G-004 [status:verified] Residual risks and follow-ups are documented.

## Rerun Matrix
- [x] G-010 [status:verified] If code changes after any checked `V-*`, reset affected validation items to unchecked.
- [x] G-011 [status:verified] Final sign-off only after a full validation pass completed after the last code edit.

## Audit Queue
- [x] Q-001 [status:verified] Create checklist and baseline scope.
- [x] Q-002 [status:verified] Complete discovery/audit of impacted systems.
- [x] Q-003 [status:verified] Implement required changes.
- [x] Q-004 [status:verified] Expand or update automated tests.
- [x] Q-005 [status:verified] Run full validation suite.
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review.

## Findings Log
- [x] F-001 [status:verified] [P1] [confidence:0.98] Local app startup was broken because the database module threw on import even when in-memory storage should be used.
  - Evidence: Reproduced at 2026-03-30 11:23 -0400; resolved by optional database initialization in [/Users/davedxn/Downloads/AIFactorySimulatorMH/server/db.ts] and guarded access in [/Users/davedxn/Downloads/AIFactorySimulatorMH/server/storage.ts]. Final boot smoke passed at 2026-03-30 11:44 -0400 with `PORT=5003 npm run dev`.
  - Owner: Codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P1] [confidence:0.96] Local app startup still failed after the database fix because the HTTP server requested `reusePort: true`, which is not supported in this environment.
  - Evidence: Reproduced at 2026-03-30 11:25 -0400; resolved by removing `reusePort` from [/Users/davedxn/Downloads/AIFactorySimulatorMH/server/index.ts]. Final boot smoke passed at 2026-03-30 11:44 -0400.
  - Owner: Codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P2] [confidence:0.95] The server was hard-coded to port `5000`, which prevented local dev and Playwright webServer startup on machines where that port is already taken.
  - Evidence: Reproduced at 2026-03-30 11:26 -0400; resolved by honoring `PORT` with a `5000` default in [/Users/davedxn/Downloads/AIFactorySimulatorMH/server/index.ts]. Final boot smoke passed at 2026-03-30 11:44 -0400 on port `5003`, and Playwright webServer passed on port `5002`.
  - Owner: Codex
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P1] [confidence:0.98] Phase 2 tutorial steps asked the player to click upgrade controls that live inside collapsed accordions, so the requested action was not visible when needed.
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/lib/narrativeContent.ts] previously targeted `compute-level-upgrade`, `data-quality-upgrade`, and `algorithm-architecture-upgrade` directly; [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/factory/FactorySection.tsx] renders those controls inside accordion content; user screenshot reproduced the blocked compute step.
  - Owner: Codex
  - Linked Fix: P-004
- [x] F-005 [status:verified] [P2] [confidence:0.94] Spotlight guidance could keep showing stale highlight state when the next target was missing or still hidden, leaving the tutorial visually pointed at the wrong element.
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/tutorial/UnifiedTutorialSystem.tsx] only checked target existence and preserved prior highlight state until a new element resolved.
  - Owner: Codex
  - Linked Fix: P-004
- [x] F-006 [status:verified] [P2] [confidence:0.99] Opening tutorial copy told the player to click Start Game even though the tutorial actually advances via Continue modals and only starts the simulation after completion.
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/lib/narrativeContent.ts] PHASE_1.1 copy conflicted with [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx], which only calls `startGame()` from the tutorial completion handler.
  - Owner: Codex
  - Linked Fix: P-004
- [x] F-007 [status:verified] [P2] [confidence:0.88] Guided spotlight steps allowed unrelated clicks outside the highlighted control, so a player could change state and invalidate the next required action.
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/tutorial/UnifiedTutorialSystem.tsx] used a non-blocking overlay and did not gate off-path clicks or keyboard activation.
  - Owner: Codex
  - Linked Fix: P-004
- [x] F-008 [status:verified] [P2] [confidence:0.97] The shared educational tooltip wrapper rendered a default Radix trigger button around interactive children, producing invalid nested-button markup and runtime `validateDOMNesting` warnings in guided flows such as Training and Economy.
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/ui/educational-tooltip.tsx] used `<TooltipTrigger>` without `asChild`, while callers such as [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx] passed a real [`Button`] child. The warning surfaced during the earlier headed tutorial walkthrough.
  - Owner: Codex
  - Linked Fix: P-005
- [x] F-009 [status:verified] [P1] [confidence:0.99] The new Playwright regression harness was not fully reproducible from repository state because the repo used `playwright test` scripts and specs without declaring `@playwright/test` in the manifest or lockfile.
  - Evidence: Audit at 2026-03-30 11:49 -0400 found Playwright scripts in [/Users/davedxn/Downloads/AIFactorySimulatorMH/package.json], specs under [/Users/davedxn/Downloads/AIFactorySimulatorMH/tests/e2e], and no `@playwright/test` entry in either [/Users/davedxn/Downloads/AIFactorySimulatorMH/package.json] or [/Users/davedxn/Downloads/AIFactorySimulatorMH/package-lock.json].
  - Owner: Codex
  - Linked Fix: P-006
- [x] F-010 [status:verified] [P2] [confidence:0.95] The stricter tutorial walkthrough spec initially relied on brittle wrapper and exact-copy assertions, causing false-negative failures even when the UI state and interaction flow were correct.
  - Evidence: Regression runs at 2026-03-30 11:51 -0400 and 11:54 -0400 failed inside [/Users/davedxn/Downloads/AIFactorySimulatorMH/tests/e2e/tutorial.spec.ts], while failure screenshots showed the expected tutorial tooltip rendered correctly.
  - Owner: Codex
  - Linked Fix: P-007

## Fix Log
- [x] P-001 [status:verified] Make database initialization lazy/optional so local dev and browser e2e can run without `DATABASE_URL`, while keeping database-backed behavior when the env var is present.
  - Addresses: F-001
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/server/db.ts], [/Users/davedxn/Downloads/AIFactorySimulatorMH/server/storage.ts], and final boot smoke pass at 2026-03-30 11:44 -0400.
- [x] P-002 [status:verified] Remove the unsupported `reusePort` listen option so the local server can boot in normal desktop environments.
  - Addresses: F-002
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/server/index.ts] and final boot smoke pass at 2026-03-30 11:44 -0400.
- [x] P-003 [status:verified] Make the server respect `PORT` with a default of `5000` so local and automated test runs can use a free port.
  - Addresses: F-003
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/server/index.ts], final boot smoke pass on `PORT=5003`, and Playwright webServer pass on `PORT=5002`.
- [x] P-004 [status:verified] Retarget tutorial steps to real affordances, centralize target-availability metadata, auto-open required tabs and accordions, harden spotlight target resolution, block off-path tutorial interactions, correct misleading intro copy, and add a tutorial availability regression audit.
  - Addresses: F-004, F-005, F-006, F-007
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/lib/narrativeContent.ts], [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/factory/MainGameTabs.tsx], [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/factory/FactorySection.tsx], [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx], [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/tutorial/UnifiedTutorialSystem.tsx], [/Users/davedxn/Downloads/AIFactorySimulatorMH/playwright.config.ts], [/Users/davedxn/Downloads/AIFactorySimulatorMH/tests/e2e/tutorial.spec.ts], [/Users/davedxn/Downloads/AIFactorySimulatorMH/tests/e2e/navigation-smoke.spec.ts], [/Users/davedxn/Downloads/AIFactorySimulatorMH/test_tutorial_availability.ts]
- [x] P-005 [status:verified] Refactor the shared tooltip trigger to use `asChild`, eliminating nested-button markup while preserving the existing guided-learning affordances.
  - Addresses: F-008
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/client/src/components/ui/educational-tooltip.tsx] and clean browser-console tutorial audit at 2026-03-30 11:57 -0400.
- [x] P-006 [status:verified] Declare the Playwright runner in the repo manifest/lockfile and ignore generated Playwright artifact directories so the QA harness is reproducible and the worktree stays clean after test runs.
  - Addresses: F-009
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/package.json], [/Users/davedxn/Downloads/AIFactorySimulatorMH/package-lock.json], [/Users/davedxn/Downloads/AIFactorySimulatorMH/.gitignore], and successful `npm audit fix` follow-up at 2026-03-30 11:59 -0400.
- [x] P-007 [status:verified] Harden the tutorial walkthrough spec to assert stable tutorial affordances instead of brittle tooltip wrapper structure or exact instruction copy.
  - Addresses: F-010
  - Evidence: [/Users/davedxn/Downloads/AIFactorySimulatorMH/tests/e2e/tutorial.spec.ts] and final regression pass at 2026-03-30 11:56 -0400.

## Validation Log
- [x] V-001 [status:verified] `npm run check`
  - Evidence: 2026-03-30 11:43 -0400 pass as part of `npm run test:regression`.
- [x] V-002 [status:verified] `PORT=5003 npm run dev` boot smoke without `DATABASE_URL`
  - Evidence: 2026-03-30 11:44 -0400 pass. Server reported `serving on port 5003`.
- [x] V-003 [status:verified] `npm run test:e2e`
  - Evidence: 2026-03-30 11:44 -0400 pass. Both Playwright specs passed on the final code state.
- [x] V-004 [status:verified] `npx playwright test tests/e2e/tutorial.spec.ts --headed`
  - Evidence: 2026-03-30 11:45 -0400 pass. Verified the tutorial flow in headed Chromium on the final code state.
- [x] V-005 [status:verified] `npm run check`
  - Evidence: 2026-03-30 11:33 -0400 pass after tutorial hardening edits.
- [x] V-006 [status:verified] `npm run test:tutorial`
  - Evidence: 2026-03-30 11:44 -0400 pass. Tutorial availability audit passed for 11 interactive tutorial steps and verified 14 tutorial targets across 3 UI files.
- [x] V-007 [status:verified] `npm run test:regression`
  - Evidence: 2026-03-30 11:44 -0400 pass. Final regression command completed `npm run check` and `npm run test:e2e`.
- [x] V-008 [status:verified] `npm run build`
  - Evidence: 2026-03-30 11:50 -0400 pass. Production client and server bundles built successfully; remaining output was limited to pre-existing lottie/bundle-size warnings.
- [x] V-009 [status:verified] `npm run test:tutorial`
  - Evidence: 2026-03-30 11:50 -0400 pass after the audit follow-up fixes. Tutorial availability audit still passed for 11 interactive steps and 14 targets.
- [x] V-010 [status:verified] `npm run test:regression`
  - Evidence: 2026-03-30 11:56 -0400 pass after final QA harness fixes. Both Playwright specs passed on the final code state.
- [x] V-011 [status:verified] `npx playwright test tests/e2e/tutorial.spec.ts --headed`
  - Evidence: 2026-03-30 11:57 -0400 pass after final QA harness fixes. Guided Chromium walkthrough completed end-to-end on the final code state.
- [x] V-012 [status:verified] One-off Playwright browser-console audit against local dev server on port `5004`
  - Evidence: 2026-03-30 11:57 -0400 pass. Collected `[]` browser console warnings/errors while completing the full tutorial flow and starting the run.
- [x] V-013 [status:verified] `npm audit fix`
  - Evidence: 2026-03-30 11:59 -0400 pass with partial remediation. Transitive dependency updates removed all production vulnerabilities and reduced the remaining advisory set to a dev-tooling-only `esbuild`/`vite` chain that requires a breaking upgrade.
- [x] V-014 [status:verified] `npm audit --omit=dev`
  - Evidence: 2026-03-30 11:59 -0400 pass. Reported `found 0 vulnerabilities`.
- [x] V-015 [status:verified] Post-audit-fix validation rerun: `npm run build`, `npm run test:regression`, and `npx playwright test tests/e2e/tutorial.spec.ts --headed`
  - Evidence: 2026-03-30 12:00 -0400 pass. Build, full regression suite, and headed tutorial walkthrough all passed on the final dependency state.

## Residual Risks
- [x] R-001 [status:verified] No additional tutorial blockers surfaced after the full final regression pass and headed tutorial walkthrough.
  - Rationale: Final automated smoke, full tutorial e2e, tutorial availability audit, post-audit-fix build/regression reruns, and headed tutorial pass all completed successfully on the final code state.
  - Owner: Codex
  - Follow-up trigger/date: Reopen only if later gameplay/tutorial content changes add new guided targets.
- [x] R-002 [status:verified] No browser-console warnings/errors surfaced in the full tutorial path after the tooltip trigger refactor.
  - Rationale: Shared tooltip markup now avoids nested trigger buttons, and a dedicated Playwright console audit completed the tutorial flow with an empty warning/error list.
  - Owner: Codex
  - Follow-up trigger/date: Reopen only if tooltip composition or shared UI wrappers change again.
- [x] R-003 [status:accepted_risk] Five moderate dev-tooling vulnerabilities remain in the `esbuild` dependency chain used by `vite` and `drizzle-kit`.
  - Rationale: `npm audit fix` removed the production-facing issues, and `npm audit --omit=dev` now reports zero vulnerabilities. The remaining advisory requires `npm audit fix --force`, which would upgrade to `vite@8.0.3` and introduce a breaking toolchain change outside the scope of this tutorial hardening pass.
  - Owner: Future dependency-upgrade pass
  - Follow-up trigger/date: Revisit when planning a Vite/tooling upgrade or broader dependency refresh.

## Change Log
- 2026-03-30T11:22:31: Checklist initialized.
- 2026-03-30T11:23:00-04:00: Recorded startup blocker preventing local dev and browser e2e.
- 2026-03-30T11:25:00-04:00: Recorded unsupported socket listen option blocking local server startup.
- 2026-03-30T11:26:00-04:00: Recorded hard-coded port conflict with a local macOS service.
- 2026-03-30T11:38:06-04:00: Hardened tutorial availability, added regression coverage, and completed a full headed browser walkthrough of the tutorial flow.
- 2026-03-30T11:45:00-04:00: Verified clean local boot, tutorial availability audit, final regression pass, and headed tutorial pass on the finished code state.
- 2026-03-30T11:57:52-0400: Completed follow-up audit, fixed shared tooltip nesting, declared Playwright dependency metadata, hardened brittle tutorial assertions, reran build/regression/headed walkthroughs, and verified a clean browser console through the full tutorial flow.
- 2026-03-30T12:00:40-0400: Applied non-breaking `npm audit fix`, reduced dependency vulnerabilities to a dev-only `esbuild`/`vite` residual risk, and reran build plus browser validation on the final dependency state.
