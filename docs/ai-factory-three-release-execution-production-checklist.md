# AI Factory Three-Release Execution Checklist

Source of truth checklist for a large/intense task.

## Metadata

- Created: 2026-07-10T01:22:38
- Last Updated: 2026-07-10T11:30:00-06:00
- Workspace: /Users/davedixon/Documents/GitHub/AIFactorySimulatorMH
- Checklist Doc: /Users/davedixon/Documents/GitHub/AIFactorySimulatorMH/docs/ai-factory-three-release-execution-production-checklist.md

## Scope

- [x] Q-000 [status:verified] Implement the frozen three-release plan without crossing a release stop gate prematurely.
  - Evidence: Release A must prove anonymous deterministic GNT-2→GNT-7 completion, correct pause timing, complete close/resume, safe reset, factual scorecard, unsafe API shutdown, enforced CSP, CI/security gates, deployed SHA, and independent verification. Release B owns game redesign and calibrated scoring. Release C owns accessibility, telemetry/research separation, pilot validation, performance, and monitoring.

## Sign-off Gate

- [ ] G-001 [status:open] All queued work, findings, fixes, and validations are complete.
- [ ] G-002 [status:open] All findings are resolved or marked `accepted_risk` with rationale and owner.
- [ ] G-003 [status:open] Required validation suite has been rerun on the final code state.
- [ ] G-004 [status:open] Residual risks and follow-ups are documented.

## Rerun Matrix

- [ ] G-010 [status:open] If code changes after any checked `V-*`, reset affected validation items to unchecked.
- [ ] G-011 [status:open] Final sign-off only after a full validation pass completed after the last code edit.

## Audit Queue

- [x] Q-001 [status:verified] Create checklist and baseline scope.
- [x] Q-002 [status:verified] Complete Release A discovery and capture fresh baselines.
  - Evidence: Integration lead and three bounded read-only audits mapped engine/timing, persistence/session, and security/release surfaces against `c372658ea89b1e2c8a640cce345b0d2a1d9f3317`; baseline check/build/tutorial/E2E/audits recorded below.
- [ ] Q-010 [status:in_progress] A1: contain unsafe APIs/logging/security behavior and add characterization coverage.
- [x] Q-020 [status:verified] A2: extract the deterministic typed-command engine and fresh-state factory.
  - Evidence: Integrated isolated commit `c46d0d5372408e88f3010bcdad150f66a0c41fd0`; 89 unit tests pass on the integrated branch, including property/replay fixtures and three public-command strategy seeds completing GNT-2→GNT-7 deterministically at tick 570. Development and production Chromium suites both pass 7/7 after root lifecycle integration.
- [ ] Q-030 [status:open] A3: implement IndexedDB snapshots, canonical checksums, writer leases, migration, recovery, and safe reset.
- [ ] Q-040 [status:in_progress] A4: implement factual completed-run summaries and per-metric personal bests.
  - Evidence: Strict runtime-validated V1 summary/personal-best schemas and 21 invariant/normalization cases are committed in the active worktree. Engine accumulator writes, atomic completion persistence, factual UI, and E2E remain blocked on A2/A3.
- [ ] Q-050 [status:in_progress] A5: finish CI, dependency/security hardening, CSP enforcement, truthful docs, version endpoints, and regression floors.
- [ ] Q-060 [status:open] Deploy and independently verify Release A before starting Release B.
- [ ] Q-100 [status:blocked] Release B: implement strategic era design, simulator-backed balance, onboarding/Journey redesign, claim governance, and evidence-calibrated scoring/profiles.
  - Blocked by: Q-060 Release A deployment and independent verification.
- [ ] Q-200 [status:blocked] Release C: complete WCAG/performance work, telemetry/research separation, formative pilot, monitoring, and release evidence.
  - Blocked by: verified Release B deployment.
- [ ] Q-900 [status:open] Run final code-quality pass, checklist validation, and three-release sign-off review.

## Findings Log

- [ ] F-001 [status:open] [P0] [confidence:0.99] Existing global game-state read/write behavior is not user-scoped and the client never restores it.
  - Evidence: `server/routes.ts`, `server/storage.ts`, `shared/schema.ts`, and `client/src/pages/AIFactory.tsx`; prior live repro returned the globally latest partial save.
  - Owner: Release A containment/persistence lane
  - Linked Fix: P-001
- [ ] F-002 [status:open] [P0] [confidence:0.99] Autosave interval is recreated on every one-second state update, so durable saves may never fire.
  - Evidence: save effect dependencies in `client/src/pages/AIFactory.tsx` include the full changing game state.
  - Owner: Release A persistence lane
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P1] [confidence:0.99] Pause/resume paths call start behavior that resets the victory timer.
  - Evidence: `client/src/hooks/useGameEngine.ts` and educational pause/resume call sites.
  - Owner: Release A engine lane
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P0] [confidence:0.99] Leaderboard submissions trusted client-supplied score/time/breakthrough/era values.
  - Evidence: `POST /api/leaderboard` in `server/routes.ts`; a fabricated 999999 capability score was accepted during the planning audit.
  - Owner: Release A containment lane
  - Linked Fix: P-004
- [x] F-005 [status:verified] [P1] [confidence:0.98] Invalid Zod input is converted to HTTP 500 and request logging records raw bodies.
  - Evidence: `server/errorHandler.ts`, `server/routes.ts`, and `server/logger.ts`; invalid payload repro returned 500 during planning audit.
  - Owner: Release A security lane
  - Linked Fix: P-005
- [x] F-006 [status:verified] [P1] [confidence:0.98] The baseline dependency tree contained production high-severity advisories and a full-tree critical advisory.
  - Evidence: fresh `npm ci` audit on 2026-07-10 reproduced 8 production advisories (5 moderate, 3 high) and 15 full-tree advisories (1 low, 9 moderate, 4 high, 1 critical).
  - Owner: Release A dependency lane
  - Linked Fix: P-006
- [x] F-007 [status:verified] [P1] [confidence:0.97] Core simulation logic mixes wall time, random behavior, nested mutation, UI effects, and rules inside a 2600+ line hook.
  - Evidence: `client/src/hooks/useGameEngine.ts` and `client/src/lib/gameState.ts` planning audit.
  - Owner: Release A engine lane
  - Linked Fix: P-007
- [x] F-008 [status:verified] [P2] [confidence:0.99] The baseline repo lacked root setup/current-state documentation, committed CI, version endpoints, unit/property/persistence coverage, and an execution-grade release truth path.
  - Evidence: fresh `rg --files` inventory on 2026-07-10.
  - Owner: Release A QA/release lane
  - Linked Fix: P-008

## Fix Log

- [ ] P-001 [status:open] Retire legacy global game-state routes and replace persistence with complete local versioned snapshots.
  - Addresses: F-001
- [ ] P-002 [status:open] Implement command-driven debounced durability plus dirty periodic and best-effort lifecycle saves.
  - Addresses: F-002
- [x] P-003 [status:verified] Separate idempotent start, pause, and resume in the deterministic engine.
  - Addresses: F-003
  - Evidence: `shared/game/engine.ts` uses a persisted integer `clock.activeTick`, strict `START_RUN`/`PAUSE_RUN`/`RESUME_RUN` commands, and no wall-clock simulation input. Integrated keyboard and engine tests cover pausing at tick zero, no paused ticks, and resume.
- [x] P-004 [status:verified] Remove the global leaderboard surface and return `410 Gone` from all legacy leaderboard/ranking routes.
  - Addresses: F-004
  - Evidence: `server/routes.ts`, `client/src/pages/AIFactory.tsx`, `client/src/components/factory/GameHeader.tsx`, `client/src/components/victory/VictoryScreen.tsx`, and `tests/e2e/retired-api.spec.ts`; focused Playwright pass at 2026-07-10 01:31 MDT.
- [ ] P-005 [status:in_progress] Correct validation/status handling, stable request IDs, safe logging, limits, Helmet, and enforced CSP.
  - Addresses: F-005
  - Evidence: `server/app.ts`, `server/errorHandler.ts`, `server/logger.ts`, and `tests/api/security.test.ts`; the expanded socket-enabled API suite passes 15/15. Exact Vite development CSP hashing passes, production CSP remains enforced without eval/inline-script exceptions, and the focused production Chromium axe/CSP gate passes. Final integrated-engine reruns remain required.
- [ ] P-006 [status:in_progress] Remove unused/vulnerable packages and upgrade dependencies until the Release A audit gate passes.
  - Addresses: F-006
  - Evidence: Removed the unused database/auth/query/chart/Replit-plugin stack; migrated to Vite 8.1.4, React plugin 6.0.3, esbuild 0.28.1, and Vitest/coverage 4.1.10; aligned accessibility-related Radix primitives. Both full and production-only audits report zero vulnerabilities after a clean 687-package lockfile install. Final integrated-state audit rerun remains required.
- [x] P-007 [status:verified] Extract a pure typed-command deterministic engine with injected clock/RNG and normalized state.
  - Addresses: F-007
  - Evidence: `shared/game/{engine,factory,ledger,normalize,random}.ts`; strict discriminated commands, persisted xorshift32 state, canonical numeric boundaries, immutable transition tests, committed replay digest, and scripted public-command reachability agents are integrated.
- [ ] P-008 [status:in_progress] Add CI, test layers, version/health endpoints, root docs, release evidence, and regression baselines.
  - Addresses: F-008
  - Evidence: Added root/current-state/architecture/runbook documentation, Node/npm pins, CI, ESLint/Prettier, production Playwright configuration, CSP/console/keyboard/axe harness, artifact-generated build metadata, and an enforced initial-JS floor. Engine/persistence tests, five-run LCP baseline, committed production-browser pass, and deployed evidence remain open.

## Validation Log

- [x] V-001 [status:verified] `npm ci`
  - Evidence: 2026-07-10 11:30 MDT pass; 687 packages installed from the Vite 8/Radix-aligned lockfile. CI and `.nvmrc` both pin Node 22.14.0.
- [ ] V-002 [status:in_progress] `npm run check`
  - Evidence: integrated A2 state passed at 2026-07-10 12:29 MDT; final persistence-state rerun pending.
- [ ] V-003 [status:in_progress] `npm run build`
  - Evidence: integrated A2 Vite 8 build passed at 2026-07-10 12:30 MDT; client JS 1,459.38 kB minified and remains below the 1,473.99 kB baseline. Lottie eval and large-chunk warnings remain constrained by enforced production CSP/browser gates. Final persistence-state rerun pending.
- [ ] V-004 [status:in_progress] `npm run test:tutorial`
  - Evidence: baseline and 2026-07-10 02:59 MDT states passed; 11 interactive steps and 14 targets verified. Script now uses `node --import tsx` and no longer requires the `tsx` CLI IPC socket. Final-state rerun pending.
- [ ] V-005 [status:open] `npm run test:e2e`
  - Evidence: integrated A2 development Chromium suite passed 7/7 at 2026-07-10 12:31 MDT. Final persistence-state rerun pending.
- [ ] V-006 [status:in_progress] `npm audit --omit=dev` and full `npm audit`
  - Evidence: baseline failed at 2026-07-10 01:24 MDT with 3 high production advisories and 1 critical/4 high full-tree advisories. Both explicit audits passed with zero vulnerabilities after the Vite 8 migration at 2026-07-10 11:17 MDT. Final integrated-state rerun required.
- [ ] V-007 [status:open] Release A unit/property/replay/persistence/API suite.
  - Evidence: integrated A2 unit/API state passes 89 unit tests plus 15 API tests. Engine coverage is 90.82% statements/lines, 86.49% branches, and 100% functions in its scoped suite; persistence remains open in A3.
- [ ] V-008 [status:in_progress] Browser screenshot, text-state, keyboard, axe, console, bundle, and LCP regression audit.
  - Evidence: both development and production Chromium suites pass 7/7 at the integrated A2 state, including keyboard, fresh-game axe, console/CSP, retired APIs, tutorial completion, and truthful factory readiness. Five-run cold LCP and final persistence-state rerun remain pending.
- [ ] V-009 [status:open] Live served-SHA, save/resume/completion, CSP/header, and rollback smoke.
  - Evidence: pending Release A deployment.
- [ ] V-010 [status:in_progress] `npx playwright test tests/e2e/retired-api.spec.ts`
  - Evidence: 2026-07-10 01:31 MDT passed on the containment state; later security/version changes require a rerun before verification.

## Residual Risks

- [ ] R-001 [status:open] Release B and Release C remain deliberately blocked until preceding deployed gates are proven.
  - Rationale: Prevents an unvalidated rewrite cliff and preserves separately usable releases.
  - Owner: Integration lead
  - Follow-up trigger/date: Unblock only with independent deployed evidence for the preceding release.
- [x] R-002 [status:accepted_risk] Release A CSP temporarily permits inline CSS, never arbitrary inline scripts or eval.
  - Rationale: Radix dialog scroll locking uses `react-style-singleton` to inject a runtime style element. Theme/plugin inline styles were removed. Production script policy remains `script-src 'self'`; development adds only the exact current Vite React-refresh preamble hash and localhost HMR origins.
  - Owner: Release C accessibility/security lane
  - Follow-up trigger/date: Replace or nonce the scroll-lock style injection and remove `style-src 'unsafe-inline'` before Release C sign-off.

## Change Log

- 2026-07-10T01:22:38: Checklist initialized.
- 2026-07-10T01:25:35-06:00: Recorded frozen scope, release stop gates, known P0/P1 findings, fixes, validation matrix, and fresh baseline outcomes after upstream synchronization.
- 2026-07-10T01:32:00-06:00: Retired global save/leaderboard/ranking APIs, removed leaderboard client behavior, stabilized request IDs/log envelopes, added nullable version identity, and passed focused containment E2E.
- 2026-07-10T02:16:25-06:00: Removed the unused database/auth/query/chart/Replit-plugin stack, reached zero production dependency advisories, added enforced Helmet/CSP and API characterization coverage, froze typed versioned command/state/experience contracts, verified the production browser with no console errors, and pinned the Vite development preamble by exact CSP hash after trace-backed diagnosis.
- 2026-07-10T02:40:00-06:00: Added CI/tooling/docs, artifact-generated build metadata, honest pre-engine readiness, explicit environment CSP with local-only HMR, production browser regression coverage, bundle floors, and safer client/server error logging. Independent audit correctly downgraded A1 verification until expanded API and production-browser suites rerun.
- 2026-07-10T02:51:00-06:00: Moved era primitives into shared domain code; froze strict factual completed-run and per-metric best schemas with reconciliation invariants; corrected the A2 ledger contract to use sole-source active ticks, ratio-explicit capacity fields, other cash adjustments, and a distinct training-spend category; added 24 passing unit contract tests plus deployed HTTP truth and LCP measurement scripts.
- 2026-07-10T02:56:00-06:00: Removed 19 unreachable UI template wrappers and 22 supporting direct packages after import-graph confirmation; removed Zod from the zero-runtime era primitive after the bundle gate caught the leak; final build is 3.71% below the original JS baseline and CSS is 12.2% smaller than the containment build.
- 2026-07-10T02:58:00-06:00: Added built-artifact cache-policy integration coverage and pure error-handler cases for null/string/undefined throws and headers-sent delegation; reordered CI so artifact tests consume the exact SHA-injected build.
- 2026-07-10T03:00:00-06:00: Replaced the tutorial audit's `tsx` CLI execution with Node's `--import tsx` path; the full 11-step/14-target audit now passes without a privileged IPC socket.
- 2026-07-10T11:30:00-06:00: Completed the bounded Vite 8 migration with exact Node/CI parity, lazy barrel traversal, deterministic console forwarding, an executable development-CSP hash gate, zero full/production advisories, and a clean lockfile install. Production Chromium found and verified fixes for Radix focus-proxy semantics, toast naming/list semantics, and four contrast failures; remaining browser failures are isolated to A2 lifecycle integration.
- 2026-07-10T12:32:00-06:00: Merged the independently reviewed deterministic engine, fixed root completion/header wiring, made production readiness validate the real factory, repaired reset-dialog DOM semantics, and passed integrated development and production Chromium suites 7/7. A3 session persistence is now unblocked.
