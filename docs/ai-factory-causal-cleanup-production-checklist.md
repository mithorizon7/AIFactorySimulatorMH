# AI Factory causal cleanup Checklist

Source of truth checklist for a large/intense task.

## Metadata
- Created: 2026-03-30T01:24:41
- Last Updated: 2026-03-30T09:13:24 EDT
- Workspace: /Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH
- Checklist Doc: /Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/docs/ai-factory-causal-cleanup-production-checklist.md

## Scope
- [x] Q-000 [status:verified] Capture explicit scope, constraints, and success criteria.
  - Evidence: User brief requires one coherent progression model, truthful UI/engine alignment, visible training blockers, trustworthy reset behavior, and smoother tutorial guidance without hidden gating.

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
  - Evidence: Reviewed [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts), [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts), [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx), [TrainingTab.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx), [DashboardContent.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/DashboardContent.tsx), [useNarrativeTriggers.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useNarrativeTriggers.ts), [MainGameTabs.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/MainGameTabs.tsx), and [UnifiedTutorialSystem.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/tutorial/UnifiedTutorialSystem.tsx).
- [x] Q-003 [status:verified] Implement coherent progression, state-reset, UI-truthfulness, and tutorial fixes.
  - Evidence: Updated [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts), [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts), [TrainingTab.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx), [DashboardContent.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/DashboardContent.tsx), [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx), [useNarrativeTriggers.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useNarrativeTriggers.ts), and tutorial/narrative surfaces.
- [x] Q-004 [status:verified] Expand or update automated tests or smoke validation coverage for progression/tutorial regressions.
  - Evidence: Reused project smoke coverage via `node test_tutorial_functional.js` and `node test_complete_system.js` after the final code edits.
- [x] Q-005 [status:verified] Run full validation suite.
  - Evidence: `npm run check`, `npm run build`, `node test_tutorial_functional.js`, `node test_complete_system.js`
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review.
  - Evidence: Reviewed modified files, reran validation after final edits, and documented remaining follow-up work in `R-001`.
- [x] Q-007 [status:verified] Complete the second-pass implementation for the remaining highest-priority audit gaps.
  - Evidence: Added breakthrough era gating and capped training discounts in [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts) and [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts); aligned active UI truthfulness and onboarding/message flow in [FactorySection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/FactorySection.tsx), [DashboardContent.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/DashboardContent.tsx), [EconomicSection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/EconomicSection.tsx), [SynergyDashboard.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/SynergyDashboard.tsx), [BreakthroughSection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/BreakthroughSection.tsx), and [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx).

## Findings Log
- [x] F-001 [status:verified] [P1] [confidence:0.95] Era progression can bypass training because breakthroughs trigger automatic era milestone checks.
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) `checkBreakthroughs` calls `checkEraMilestones`, and `checkEraMilestones` advances eras from intelligence/resource thresholds rather than completed training runs.
  - Owner: Codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P1] [confidence:0.95] Victory and several UI surfaces treat AGI as pure intelligence threshold rather than requiring final training completion.
  - Evidence: [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx) checks only `intelligence >= agiThreshold`; [TrainingTab.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx) marks AGI complete at `intelligence >= 1000`.
  - Owner: Codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P1] [confidence:0.97] Service availability is unlocked through multiple contradictory systems: breakthroughs, investment milestones, and era checks.
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) unlocks API/chatbot in `applyBreakthroughEffects`, `checkInvestmentMilestones`, and `calculateRevenue`.
  - Owner: Codex
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P1] [confidence:0.96] Initial/reset state is derived from shallow copies of a mutable nested object, risking cross-run leakage.
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) initializes and resets with `{ ...initialGameState }` and mutates nested objects like `tutorial`.
  - Owner: Codex
  - Linked Fix: P-004
- [x] F-005 [status:verified] [P1] [confidence:0.93] Dashboard guidance uses invented burn/runway and AGI ETA formulas that do not match the engine.
  - Evidence: [DashboardContent.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/DashboardContent.tsx) derives `netCashFlow`, `cashRunwayDays`, and `calculateTimeToAGI` from synthetic operating-cost and per-second formulas absent from the simulation.
  - Owner: Codex
  - Linked Fix: P-005
- [x] F-006 [status:verified] [P1] [confidence:0.95] Training UI omits real engine-gated prerequisites and can claim readiness while hardware/electricity/regulation still block training.
  - Evidence: [TrainingTab.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx) checklist omits compute-input requirements present in [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts) and enforced by [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts).
  - Owner: Codex
  - Linked Fix: P-006
- [x] F-007 [status:verified] [P2] [confidence:0.92] Compute-capacity feedback is delayed and early scaling is too generous.
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) recalculates `maxCapacity` only every 10 ticks using a formula that jumps the starting state to ~16k capacity.
  - Owner: Codex
  - Linked Fix: P-007
- [x] F-008 [status:verified] [P1] [confidence:0.96] Breakthrough modal and narrative triggers detect unlocks incorrectly.
  - Evidence: [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx) keys modal display off `currentGoal.id`; [useNarrativeTriggers.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useNarrativeTriggers.ts) checks `breakthroughs.length` growth and constructs mismatched era keys from raw era values.
  - Owner: Codex
  - Linked Fix: P-008
- [x] F-009 [status:verified] [P2] [confidence:0.90] Secondary prerequisite upgrades remain flat-cost chores rather than meaningful preparation decisions.
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) uses flat costs for hardware, regulation, data quantity, and data formats while primary upgrades scale by era and level.
  - Owner: Codex
  - Linked Fix: P-007
- [x] F-010 [status:verified] [P2] [confidence:0.91] Tutorial progression is mostly manual and the training target wiring is broken.
  - Evidence: [UnifiedTutorialSystem.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/tutorial/UnifiedTutorialSystem.tsx) advances via buttons instead of validated actions, and [narrativeContent.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/narrativeContent.ts) references `training-panel` without a matching `data-tutorial-id`.
  - Owner: Codex
  - Linked Fix: P-009
- [x] F-011 [status:verified] [P1] [confidence:0.94] Future-era breakthroughs can still unlock before their training leap is completed.
  - Evidence: Breakthrough definitions in [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts) already carry era metadata, but the unlock loop in [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) only checked top-level resource thresholds.
  - Owner: Codex
  - Linked Fix: P-010
- [x] F-012 [status:verified] [P1] [confidence:0.95] The active Resources tab still renders stale flat prices for scaled prerequisite upgrades.
  - Evidence: [FactorySection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/FactorySection.tsx) used hard-coded costs for hardware, regulation, data quantity, and data formats while the engine in [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) charged scaled values.
  - Owner: Codex
  - Linked Fix: P-012
- [x] F-013 [status:verified] [P2] [confidence:0.90] Active AGI/time-unit copy and breakthrough guidance still teach the older rules in several high-traffic surfaces.
  - Evidence: [SynergyDashboard.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/SynergyDashboard.tsx), [DashboardContent.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/DashboardContent.tsx), [EconomicSection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/EconomicSection.tsx), and [BreakthroughSection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/BreakthroughSection.tsx) still mixed intelligence-only AGI framing, legacy `/sec` or `/month` labels, and pre-era-gated breakthrough messaging.
  - Owner: Codex
  - Linked Fix: P-013
- [x] F-014 [status:verified] [P2] [confidence:0.88] The active first-run experience remains noisier than intended because the route still stacks multiple message channels.
  - Evidence: [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx) mounted the welcome intro, tutorial overlays, breakthrough modal, narrative notifications, and advisor toasts simultaneously.
  - Owner: Codex
  - Linked Fix: P-013

## Fix Log
- [x] P-001 [status:verified] Make training completion the sole era-advance path and remove auto-era progression from breakthroughs.
  - Addresses: F-001
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) no longer calls auto-era milestone checks from breakthroughs; era advancement happens on training completion only.
- [x] P-002 [status:verified] Require final GNT-7 training completion plus intelligence threshold for AGI victory and align core UI.
  - Addresses: F-002
  - Evidence: [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts), [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx), [VictoryScreen.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/victory/VictoryScreen.tsx), and [TrainingTab.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx) now use the shared AGI helper.
- [x] P-003 [status:verified] Centralize service unlocks on completed training eras and remove milestone/breakthrough/era-check duplicates.
  - Addresses: F-003
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) now unlocks API/chatbot only via completed GNT-3/GNT-4 training in `unlockEraServices`.
- [x] P-004 [status:verified] Replace shallow-copy initialization/reset with factory-created deep state.
  - Addresses: F-004
  - Evidence: [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts) exports `createInitialGameState()`, and [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) uses it for both initialize/reset paths.
- [x] P-005 [status:verified] Remove or replace dashboard metrics/actions that depend on fake economics or fake AGI ETA math.
  - Addresses: F-005
  - Evidence: [DashboardContent.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/DashboardContent.tsx) was rewritten around actual blockers, service state, and training readiness instead of synthetic runway/ETA formulas.
- [x] P-006 [status:verified] Expose all real training prerequisites and a concrete next bottleneck in the training UI.
  - Addresses: F-006
  - Evidence: [TrainingTab.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx) now renders all engine-checked prerequisites plus a single current bottleneck callout.
- [x] P-007 [status:verified] Rework compute capacity scaling/recalculation and scale secondary prerequisite upgrade costs.
  - Addresses: F-007, F-009
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) now recalculates compute capacity deterministically every tick and after relevant purchases; secondary upgrade functions now use scaled era/level costs.
- [x] P-008 [status:verified] Fix breakthrough modal, era narrative normalization, chatbot threshold, and real training-blocked advice.
  - Addresses: F-008
  - Evidence: [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx), [useBreakthroughs.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useBreakthroughs.ts), and [useNarrativeTriggers.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useNarrativeTriggers.ts) now detect real unlock diffs, normalize era keys, and use real training blockers.
- [x] P-009 [status:verified] Add actionable tutorial validation and wire the training targets correctly.
  - Addresses: F-010
  - Evidence: [UnifiedTutorialSystem.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/tutorial/UnifiedTutorialSystem.tsx), [MainGameTabs.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/MainGameTabs.tsx), [TrainingTab.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/TrainingTab.tsx), and [narrativeContent.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/narrativeContent.ts) now validate spotlight actions and correctly target the Training tab/panel.
- [x] P-010 [status:verified] Era-gate breakthroughs and expose shared helpers for truthful breakthrough eligibility.
  - Addresses: F-011
  - Evidence: [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts) now exports shared `isBreakthroughEraUnlocked`, `canUnlockBreakthrough`, and `getNextBreakthroughGoal` helpers, and [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) uses them before unlocking breakthroughs.
- [x] P-011 [status:verified] Cap cumulative training discounts so breakthrough stacking cannot collapse late-game scarcity below the intended floor.
  - Addresses: F-011
  - Evidence: [useGameEngine.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/hooks/useGameEngine.ts) now applies discount multipliers against per-era base training runs and clamps money/compute requirements to explicit minimum multipliers.
- [x] P-012 [status:verified] Route all active scaled upgrade prices through one shared cost function so the UI matches the engine.
  - Addresses: F-012
  - Evidence: [gameState.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/gameState.ts) exports `getScaledInvestmentCost`, and [FactorySection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/FactorySection.tsx) now uses it for hardware, regulation, data quantity, and data formats button labels and disabled-state checks.
- [x] P-013 [status:verified] Align active AGI copy, time units, breakthrough guidance, and first-run message stacking with the new progression truth.
  - Addresses: F-013, F-014
  - Evidence: [SynergyDashboard.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/SynergyDashboard.tsx), [DashboardContent.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/DashboardContent.tsx), [EconomicSection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/EconomicSection.tsx), [BreakthroughSection.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/factory/BreakthroughSection.tsx), [LeaderboardModal.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/components/leaderboard/LeaderboardModal.tsx), [AIFactory.tsx](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/pages/AIFactory.tsx), and [narrativeContent.ts](/Users/davedixon/.codex/worktrees/050f/AIFactorySimulatorMH/client/src/lib/narrativeContent.ts) now describe AGI and pacing consistently and suppress overlapping secondary messages during tutorial, breakthrough, and victory-critical moments.

## Validation Log
- [x] V-001 [status:verified] `npm run check`
  - Evidence: 2026-03-30 09:12 EDT + pass
- [x] V-002 [status:verified] `npm run build`
  - Evidence: 2026-03-30 09:12 EDT + pass (non-blocking warnings: `eval` usage in `lottie-web`, Browserslist data age notice, large chunk-size advisory)
- [x] V-003 [status:verified] `node test_tutorial_functional.js`
  - Evidence: 2026-03-30 09:12 EDT + pass
- [x] V-004 [status:verified] `node test_complete_system.js`
  - Evidence: 2026-03-30 09:12 EDT + pass

## Residual Risks
- [x] R-001 [status:accepted_risk] Non-primary legacy surfaces still need a second truthfulness sweep.
  - Rationale: This pass fixed the primary engine, active route truthfulness, and first-run flow. Follow-up work still remains for broader balance tuning and educational depth, especially sub-pillar breakthrough gating, stronger business-model asymmetry, and any non-primary screens that still carry legacy AGI or pacing copy.
  - Owner: future gameplay polish pass
  - Follow-up trigger/date: Next balance/UI consistency pass before wider playtesting

## Change Log
- 2026-03-30T01:24:41: Checklist initialized.
- 2026-03-30T01:41:00: Discovery complete; logged progression, UI-truthfulness, narrative, compute-scaling, and tutorial findings with linked fixes.
- 2026-03-30T01:45:00: Implemented engine/UI/tutorial cleanup, reran validation, and documented residual follow-up scope.
- 2026-03-30T09:13:24 EDT: Implemented second-pass breakthrough gating, capped discount stacking, active UI truthfulness cleanup, onboarding/message simplification, and reran the full validation suite.
