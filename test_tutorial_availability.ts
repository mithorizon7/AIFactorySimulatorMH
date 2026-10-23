#!/usr/bin/env tsx

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFreshGameState } from "./shared/game/factory";
import { getRunGuidance } from "./shared/game/guidance";
import { applyGameCommand } from "./shared/game/engine";
import { gameCommandSchema } from "./shared/game/schemas/commands";
import {
  applyExperienceCommand,
  createFreshExperienceState,
} from "./shared/experience/schemas";
import {
  COMMAND_SCHEMA_VERSION,
  SUPPORTED_RULESET_VERSIONS,
} from "./shared/version";

// The old 14-target spotlight tour is inactive. Audit the actual contextual
// contracts instead of falsely treating strings in dead UI files as rendered.
let commandsChecked = 0;
for (const ruleset of SUPPORTED_RULESET_VERSIONS) {
  const state = createFreshGameState({ ruleset, seed: 42 });
  const before = JSON.stringify(state);
  const guidance = getRunGuidance(state);
  assert.ok(guidance.goal && guidance.blocker && guidance.reason);
  assert.ok(guidance.actions.some((action) => action.id === "invest-compute"));
  assert.ok(guidance.actions.some((action) => action.id === "start"));
  for (const action of guidance.actions) {
    if (!action.command) continue;
    const command = gameCommandSchema.parse({
      ...action.command,
      id: "00000000-0000-4000-8000-000000000001",
      tick: state.clock.activeTick,
      commandSchemaVersion: COMMAND_SCHEMA_VERSION,
    });
    const result = applyGameCommand(state, command);
    assert.equal(Boolean(result.acceptedCommandId), action.enabled, action.id);
    commandsChecked++;
  }
  assert.equal(
    JSON.stringify(state),
    before,
    "guidance/inspection must be pure",
  );
}

const fresh = createFreshExperienceState();
const dismissed = applyExperienceCommand(fresh, {
  experienceSchemaVersion: 1,
  type: "DISMISS_WELCOME",
  payload: {},
});
assert.equal(dismissed.tutorial.hasShownWelcome, true);
assert.equal(dismissed.onboardingStatus, "active");
assert.equal(fresh.tutorial.hasShownWelcome, false);
const skipped = applyExperienceCommand(fresh, {
  experienceSchemaVersion: 1,
  type: "SKIP_TUTORIAL",
  payload: {},
});
assert.equal(skipped.onboardingStatus, "skipped");

const wiring: Array<[string, string[]]> = [
  [
    "client/src/components/factory/RunGoal.tsx",
    [
      "getRunGuidance",
      'data-testid="run-goal"',
      'data-testid="run-blocker"',
      "goal-action-${action.id}",
    ],
  ],
  [
    "client/src/components/factory/TrainingTab.tsx",
    [
      "getRunGuidance",
      'data-testid="start-training-button"',
      "guidance.training.durationTicks",
    ],
  ],
  [
    "client/src/components/tutorial/UnifiedTutorialSystem.tsx",
    ["onDismissWelcome", "onSkipTutorial", "Open my lab"],
  ],
  [
    "client/src/components/factory/MainGameTabs.tsx",
    [
      "JourneyPanel",
      'savedTab === "breakthroughs"',
      'savedTab === "progression"',
    ],
  ],
];
for (const [file, required] of wiring) {
  const source = readFileSync(file, "utf8");
  for (const token of required)
    assert.ok(source.includes(token), `${file}: missing ${token}`);
}
console.log(
  JSON.stringify({
    status: "contextual_onboarding_contracts_verified",
    supportedRulesets: SUPPORTED_RULESET_VERSIONS,
    commandsChecked,
    staticWiringFiles: wiring.length,
    boundary:
      "Rendered interaction, keyboard and pacing are verified separately by Playwright, not this static wiring audit.",
  }),
);
