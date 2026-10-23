import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { Era } from "../../../shared/game/domain/era";
import { getTrainingRequirementDetails } from "../../../shared/game/domain/gameState";
import {
  advanceGameTicks,
  applyGameCommand,
  getServiceDemand,
  inspectCommand,
} from "../../../shared/game/engine";
import { createFreshGameState } from "../../../shared/game/factory";
import { getRunGuidance } from "../../../shared/game/guidance";
import { getRuleset, governanceGap } from "../../../shared/game/rulesets";
import type { GameCommandIntent } from "../../../shared/game/schemas/commands";
import { COMMAND_SCHEMA_VERSION } from "../../../shared/version";
import {
  CALIBRATION_SEEDS,
  RELEASE_B_POLICIES,
  dominates,
  releaseBStrategy,
  simulatePolicy,
  type SimulationRow,
} from "./release-b-policies";
import type { GameStateV2 } from "../../../shared/game/schemas/state";
import { expectCoreInvariants } from "./helpers";

let serial = 10000;
function issue(state: GameStateV2, intent: GameCommandIntent) {
  const command = {
    ...intent,
    id: `00000000-0000-4000-8000-${(++serial).toString(16).padStart(12, "0")}`,
    tick: state.clock.activeTick,
    commandSchemaVersion: COMMAND_SCHEMA_VERSION,
  };
  const result = applyGameCommand(state, command);
  expect(
    result.acceptedCommandId,
    JSON.stringify(result.effects),
  ).toBeDefined();
  return result.state;
}
function checkpoint(
  era: Era,
  policy: "revenue-first" | "prerequisite-minimal" = "revenue-first",
) {
  const agent = releaseBStrategy(42, policy);
  while (
    agent.state().currentEra !== era &&
    agent.state().clock.activeTick < 2000
  )
    agent.step();
  expect(agent.state().currentEra).toBe(era);
  return agent.state();
}

const calibrationReport = JSON.parse(
  readFileSync(
    new URL("../../../docs/release-b-balance-report.json", import.meta.url),
    "utf8",
  ),
) as { rows: SimulationRow[] };

// Keep all 224 real simulations, but bound each independently. A monolithic
// matrix test exceeded its wall-clock timeout under instrumented two-core CI.
// Exact row/digest comparison connects the freshly executed corpus to the
// aggregate checks below without shared mutable state or test-order dependence.
it.each(
  CALIBRATION_SEEDS.flatMap((seed) =>
    RELEASE_B_POLICIES.map((policy) => ({ seed, policy })),
  ),
)(
  "replays calibrated seed $seed / $policy through completion",
  ({ seed, policy }) => {
    const row = simulatePolicy(seed, policy);
    const expectedRows = calibrationReport.rows.filter(
      (candidate) => candidate.seed === seed && candidate.policy === policy,
    );
    expect(expectedRows).toHaveLength(1);
    expect(row).toEqual(expectedRows[0]);
    expect(row.completed).toBe(true);
    expect(row.activeTicks).toBeGreaterThanOrEqual(1200);
    expect(row.activeTicks).toBeLessThanOrEqual(1800);
    expect(row.firstTrainingTick).not.toBeNull();
    expect(row.firstTrainingTick).toBeGreaterThanOrEqual(360);
    expect(row.firstTrainingTick).toBeLessThanOrEqual(480);
  },
);

it("qualifies the fully replayed frozen corpus without pairwise dominance", () => {
  const rows = calibrationReport.rows;
  expect(rows).toHaveLength(224);
  expect(new Set(rows.map((row) => `${row.seed}:${row.policy}`)).size).toBe(
    224,
  );
  expect([...new Set(rows.map((row) => row.seed))]).toEqual(CALIBRATION_SEEDS);
  expect([...new Set(rows.map((row) => row.policy))]).toEqual(
    RELEASE_B_POLICIES,
  );
  expect(
    rows.every(
      (row) =>
        row.completed && row.activeTicks >= 1200 && row.activeTicks <= 1800,
    ),
  ).toBe(true);
  expect(
    rows.every(
      (row) =>
        row.firstTrainingTick !== null &&
        row.firstTrainingTick >= 360 &&
        row.firstTrainingTick <= 480,
    ),
  ).toBe(true);
  for (const policy of RELEASE_B_POLICIES)
    for (const other of RELEASE_B_POLICIES) {
      if (policy === other) continue;
      const dominatedSeeds = CALIBRATION_SEEDS.filter((seed) =>
        dominates(
          rows.find((row) => row.seed === seed && row.policy === policy)!,
          rows.find((row) => row.seed === seed && row.policy === other)!,
        ),
      );
      expect(
        dominatedSeeds.length / CALIBRATION_SEEDS.length,
        `${policy} dominates ${other}`,
      ).toBeLessThanOrEqual(0.7);
    }
  // RNG coverage is distinct from policy-outcome diversity: fixed recovery
  // thresholds may make aggregate endpoints identical within a policy.
  expect(
    new Set(
      rows
        .filter((row) => row.policy === "adaptive")
        .map((row) => row.rngState),
    ).size,
  ).toBe(32);
  const seedRows = rows.filter((row) => row.seed === 42);
  expect(
    new Set(
      seedRows.map((row) =>
        JSON.stringify([
          row.activeTicks,
          row.firstTrainingTick,
          row.finalCapability,
          row.spend,
          row.revenue,
          row.meanShortfall,
          row.interventions,
        ]),
      ),
    ).size,
  ).toBe(7);
  expect(
    seedRows.find((row) => row.policy === "commercial-heavy")!.meanShortfall,
  ).toBeGreaterThan(0);
  expect(
    seedRows.find((row) => row.policy === "commercial-heavy")!.revenue,
  ).toBeGreaterThan(
    seedRows.find((row) => row.policy === "revenue-first")!.revenue * 10,
  );
});

it("uses seven genuinely different public-command sequences and factual allocations", () => {
  const agents = RELEASE_B_POLICIES.map((policy) => {
    const agent = releaseBStrategy(42, policy);
    agent.finish();
    return agent;
  });
  expect(
    new Set(
      agents.map((agent) =>
        JSON.stringify(
          agent.accepted.map((command) => [
            command.tick,
            command.type,
            command.payload,
          ]),
        ),
      ),
    ).size,
  ).toBe(7);
  for (const agent of agents) expectCoreInvariants(agent.state());
  expect(agents[0].state().facts.spendByCategory.commercial).toBe(0);
  expect(agents[2].state().facts.spendByCategory.compute).toBeGreaterThan(
    agents[0].state().facts.spendByCategory.compute,
  );
  expect(agents[3].state().facts.spendByCategory.algorithm).toBeGreaterThan(
    agents[0].state().facts.spendByCategory.algorithm,
  );
  expect(
    agents[5].state().facts.spendByCategory.regulationResilience,
  ).toBeGreaterThan(
    agents[0].state().facts.spendByCategory.regulationResilience,
  );
});

it.each([1, 42, 0xffffffff])(
  "recovers a poor but reasonable cash-depleted opening through public actions, seed %i",
  (seed) => {
    const agent = releaseBStrategy(seed, "adaptive", { poorOpening: true });
    const state = agent.finish();
    expect(state.clock.status).toBe("completed");
    expect(agent.evidence().minimumCash).toBeLessThan(100);
    expect(state.facts.emergencyFundingInterventions).toBeGreaterThan(0);
    expect(
      agent.effects.some(
        (effect) => effect.type === "FUNDING_GRANTED" && effect.emergency,
      ),
    ).toBe(true);
    expectCoreInvariants(state);
  },
);

it("provides one bounded, named second chance after wasting the initial continuity grant", () => {
  const agent = releaseBStrategy(42, "adaptive");
  while (agent.state().clock.activeTick < 120) agent.step();
  for (
    let count = 0;
    count < 30 && agent.issue({ type: "INVEST_COMPUTE", payload: {} });
    count++
  );
  const state = agent.finish();
  expect(state.clock.status).toBe("completed");
  expect(
    state.mechanics.appliedRecoveryGrantIds.filter(
      (id) => id === "b_seed_runway_recovery",
    ),
  ).toHaveLength(1);
  expectCoreInvariants(state);
});

it("rejects a B fifth engineer at the actual team bonus limit without changing state", () => {
  let state = createFreshGameState({ ruleset: "release-b.1", seed: 42 });
  state = issue(state, { type: "START_RUN", payload: {} });
  state = advanceGameTicks(state, 120).state;
  for (let count = 0; count < 4; count++)
    state = issue(state, { type: "HIRE_RESEARCH_ENGINEER", payload: {} });
  const inspection = inspectCommand(state, {
    type: "HIRE_RESEARCH_ENGINEER",
    payload: {},
  });
  expect(inspection).toMatchObject({
    enabled: false,
    reason: "research_team_bonus_cap",
  });
  const result = applyGameCommand(state, {
    type: "HIRE_RESEARCH_ENGINEER",
    payload: {},
    id: "00000000-0000-4000-8000-00000000ffff",
    tick: state.clock.activeTick,
    commandSchemaVersion: COMMAND_SCHEMA_VERSION,
  });
  expect(result.state).toBe(state);
  expect(result.effects[0]).toMatchObject({
    type: "COMMAND_REJECTED",
    reasonId: "research_team_bonus_cap",
  });
});

it("GNT-3 counterfactual: monetization earns revenue but consumes research capacity", () => {
  let base = checkpoint(Era.GNT3, "prerequisite-minimal");
  base = issue(base, { type: "BUILD_API_PLATFORM", payload: {} });
  const selling = issue(base, { type: "TOGGLE_API_SERVICE", payload: {} });
  const off = advanceGameTicks(base, 60).state;
  const on = advanceGameTicks(selling, 60).state;
  expect(on.facts.earnedRevenue).toBeGreaterThan(off.facts.earnedRevenue);
  expect(on.training.algorithmResearchProgress).toBeLessThan(
    off.training.algorithmResearchProgress,
  );
  expect(on.random).toEqual(off.random);
});

it("GNT-4 counterfactual: marketing grows demand, overload loses customers, capacity expansion recovers", () => {
  let base = checkpoint(Era.GNT4);
  base = issue(base, { type: "BUILD_CHATBOT_PLATFORM", payload: {} });
  base = issue(base, { type: "TOGGLE_CHATBOT_SERVICE", payload: {} });
  const campaign = issue(base, { type: "RUN_MARKETING_CAMPAIGN", payload: {} });
  expect(campaign.revenue.subscribers).toBeGreaterThan(
    base.revenue.subscribers,
  );
  const overload = advanceGameTicks(campaign, 30);
  const organic = advanceGameTicks(base, 30);
  expect(overload.state.facts.capacityShortfallRatioSum).toBeGreaterThan(
    organic.state.facts.capacityShortfallRatioSum,
  );
  expect(
    overload.effects.some((effect) => effect.type === "CUSTOMERS_LOST"),
  ).toBe(true);
  let expanded = campaign;
  for (
    let count = 0;
    count < 8 &&
    getServiceDemand(expanded).total > expanded.computeCapacity.maxCapacity;
    count++
  )
    expanded = issue(expanded, { type: "INVEST_COMPUTE", payload: {} });
  const recovered = advanceGameTicks(expanded, 30).state;
  expect(recovered.facts.capacityShortfallRatioSum).toBeLessThan(
    overload.state.facts.capacityShortfallRatioSum,
  );
  expect(recovered.facts.earnedRevenue).toBeGreaterThan(
    overload.state.facts.earnedRevenue,
  );
});

it("GNT-5 counterfactual: quality lowers demand without increasing installed capacity", () => {
  const base = checkpoint(Era.GNT5);
  const quality = issue(base, { type: "INVEST_DATA_QUALITY", payload: {} });
  expect(quality.computeCapacity.maxCapacity).toBe(
    base.computeCapacity.maxCapacity,
  );
  expect(getServiceDemand(quality).total).toBeLessThan(
    getServiceDemand(base).total,
  );
  expect(quality.facts.spendByCategory.data).toBeGreaterThan(
    base.facts.spendByCategory.data,
  );
});

it("GNT-6 counterfactual: governance/redundancy spends money to reduce final training delay and demand risk", () => {
  const agent = releaseBStrategy(42, "prerequisite-minimal");
  while (
    agent.state().currentEra !== Era.GNT6 ||
    !inspectCommand(agent.state(), {
      type: "START_TRAINING",
      payload: { targetEra: Era.GNT7 },
    }).enabled
  ) {
    // Stop before the next scripted action can start the ready training run.
    if (agent.state().training.active && agent.state().currentEra === Era.GNT6)
      throw new Error("missed ready checkpoint");
    agent.step();
    if (agent.state().clock.activeTick > 1800)
      throw new Error("unreachable checkpoint");
  }
  const base = agent.state();
  let resilient = base;
  const rule = getRuleset(base.rulesetVersion).governance;
  while (resilient.computeInputs.regulation < rule.targetRegulation)
    resilient = issue(resilient, { type: "INVEST_REGULATION", payload: {} });
  while (resilient.computeInputs.hardware < rule.targetHardware)
    resilient = issue(resilient, { type: "INVEST_HARDWARE", payload: {} });
  expect(governanceGap(resilient)).toBe(0);
  const fastChoice = issue(base, {
    type: "START_TRAINING",
    payload: { targetEra: Era.GNT7 },
  });
  const prepared = issue(resilient, {
    type: "START_TRAINING",
    payload: { targetEra: Era.GNT7 },
  });
  expect(prepared.training.daysRemaining).toBeLessThan(
    fastChoice.training.daysRemaining,
  );
  expect(getRunGuidance(base).training.durationTicks).toBe(
    fastChoice.training.daysRemaining,
  );
  expect(fastChoice.training.runs[Era.GNT7].daysRequired).toBe(
    fastChoice.training.daysRemaining,
  );
  const duration = fastChoice.training.daysRemaining;
  let running = issue(fastChoice, { type: "INVEST_REGULATION", payload: {} });
  expect(getRunGuidance(running).training.durationTicks).toBe(duration);
  const expected = advanceGameTicks(running, duration).state;
  for (let tick = 0; tick < duration; tick++) {
    const run = running.training.runs[Era.GNT7];
    const progress =
      ((run.daysRequired - run.daysRemaining) / run.daysRequired) * 100;
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
    running = advanceGameTicks(running, 1).state;
    if (tick === Math.floor(duration / 2))
      running = JSON.parse(JSON.stringify(running));
    if (tick < duration - 1) expect(running.training.active).toBe(true);
  }
  expect(running).toEqual(expected);
  expect(running.clock.activeTick - fastChoice.clock.activeTick).toBe(duration);
  expect(running.training.runs[Era.GNT7].status).toBe("complete");
  expect(running.training.runs[Era.GNT7].daysRemaining).toBe(0);
  expect(getRunGuidance(prepared).training.durationTicks).toBe(
    prepared.training.daysRemaining,
  );
  expect(prepared.facts.spendByCategory.regulationResilience).toBeGreaterThan(
    fastChoice.facts.spendByCategory.regulationResilience,
  );
});

it("canonical guidance and command inspection are pure, truthful, and actionable", () => {
  const state = createFreshGameState({ ruleset: "release-b.1", seed: 42 });
  const before = structuredClone(state);
  const guidance = getRunGuidance(state);
  expect(state).toEqual(before);
  expect(guidance.training.cost).toBe(state.training.runs[Era.GNT3].moneyCost);
  expect(guidance.training.ready).toBe(false);
  expect(
    guidance.actions.find((action) => action.id === "invest-compute")?.enabled,
  ).toBe(true);
  for (const action of guidance.actions)
    if (action.command) {
      const inspection = inspectCommand(state, action.command);
      expect(action.enabled).toBe(inspection.enabled);
      expect(action.cost).toBe(inspection.cost);
      if (action.enabled) issue(state, action.command);
    }
  let hired = issue(state, { type: "HIRE_RESEARCH_ENGINEER", payload: {} });
  expect(
    getRunGuidance(hired).actions.some(
      (action) => action.id === "hire-engineer",
    ),
  ).toBe(false);
  expect(
    getRunGuidance(hired).actions.some(
      (action) => action.id === "research-in-progress",
    ),
  ).toBe(true);
  hired = issue(hired, { type: "START_RUN", payload: {} });
  const paused = issue(hired, { type: "PAUSE_RUN", payload: {} });
  expect(getRunGuidance(paused).reason).toContain(
    "do not advance while paused",
  );
  expect(
    getTrainingRequirementDetails(state)
      .filter((detail) => !detail.met)
      .map((detail) => detail.label),
  ).toEqual(guidance.training.blockers);
});

it("does not advertise nonexistent Release A second-chance funding", () => {
  let state = createFreshGameState({ ruleset: "release-a.1", seed: 1 });
  state = issue(state, { type: "START_RUN", payload: {} });
  state = advanceGameTicks(state, 60).state;
  while (inspectCommand(state, { type: "INVEST_COMPUTE", payload: {} }).enabled)
    state = issue(state, { type: "INVEST_COMPUTE", payload: {} });
  expect(
    getRunGuidance(state).actions.some((action) => action.id === "recover"),
  ).toBe(false);
});

it("stops recommending an individual governance input at its own target", () => {
  let state = checkpoint(Era.GNT6, "prerequisite-minimal");
  while (state.computeInputs.regulation < 8)
    state = issue(state, { type: "INVEST_REGULATION", payload: {} });
  const guidance = getRunGuidance(state);
  expect(
    guidance.actions.some((action) => action.id === "invest-regulation"),
  ).toBe(false);
  expect(
    guidance.actions.some((action) => action.id === "invest-hardware"),
  ).toBe(true);
  const gap = governanceGap(state);
  const hardware = issue(state, { type: "INVEST_HARDWARE", payload: {} });
  expect(governanceGap(hardware)).toBe(gap - 1);
  expect(guidance.reason).toContain("0 governance level(s)");
});

it("preserves uncapped legacy engineer hiring", () => {
  let state = createFreshGameState({ ruleset: "release-a.1", seed: 42 });
  state = issue(state, { type: "START_RUN", payload: {} });
  state = advanceGameTicks(state, 120).state;
  for (let count = 0; count < 5; count++)
    state = issue(state, { type: "HIRE_RESEARCH_ENGINEER", payload: {} });
  expect(state.algorithmInputs.researchEngineers).toBe(5);
});
