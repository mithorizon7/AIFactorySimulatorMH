import { Era, getNextEra } from "./domain/era";
import { getTrainingRequirementDetails } from "./domain/gameState";
import { getServiceDemand, inspectCommand } from "./engine";
import { getRuleset, governanceGap } from "./rulesets";
import type { GameCommandIntent } from "./schemas/commands";
import type { GameStateV2 } from "./schemas/state";

export type { GameCommandIntent } from "./schemas/commands";
export type GuidanceTab = "resources" | "economy" | "training" | "journey";
export interface GuidanceAction {
  id: string;
  label: string;
  command: GameCommandIntent | null;
  tab?: GuidanceTab;
  enabled: boolean;
  cost: number | null;
  reason: string | null;
}
export interface RunGuidance {
  goal: string;
  blocker: string | null;
  reason: string;
  actions: GuidanceAction[];
  training: {
    targetEra: Era | null;
    ready: boolean;
    cost: number | null;
    computeRequired: number | null;
    blockers: string[];
  };
}

const requirementActions: Record<
  string,
  { id: string; label: string; type: GameCommandIntent["type"] }
> = {
  "compute-level": {
    id: "invest-compute",
    label: "Invest in compute",
    type: "INVEST_COMPUTE",
  },
  "data-quality": {
    id: "invest-data-quality",
    label: "Improve data quality",
    type: "INVEST_DATA_QUALITY",
  },
  "data-quantity": {
    id: "invest-data-quantity",
    label: "Expand data quantity",
    type: "INVEST_DATA_QUANTITY",
  },
  "data-formats": {
    id: "invest-data-formats",
    label: "Add data formats",
    type: "INVEST_DATA_FORMATS",
  },
  "algorithm-architectures": {
    id: "invest-algorithm",
    label: "Improve architecture",
    type: "INVEST_ALGORITHM_ARCHITECTURE",
  },
  electricity: {
    id: "invest-electricity",
    label: "Improve power infrastructure",
    type: "INVEST_ELECTRICITY",
  },
  hardware: {
    id: "invest-hardware",
    label: "Upgrade hardware",
    type: "INVEST_HARDWARE",
  },
  regulation: {
    id: "invest-regulation",
    label: "Invest in governance",
    type: "INVEST_REGULATION",
  },
};

/** The sole presentation selector for next-goal and viable-choice mechanics. */
export function getRunGuidance(state: GameStateV2): RunGuidance {
  const targetEra = getNextEra(state.currentEra);
  const run = targetEra
    ? state.training.runs[targetEra as keyof typeof state.training.runs]
    : null;
  const actions: GuidanceAction[] = [];
  const add = (
    id: string,
    label: string,
    command: GameCommandIntent,
    tab: GuidanceTab,
  ) => {
    if (actions.some((action) => action.id === id)) return;
    const inspection = inspectCommand(state, command);
    actions.push({
      id,
      label,
      command,
      tab,
      enabled: inspection.enabled,
      cost: inspection.cost,
      reason: inspection.reason,
    });
  };
  const details = getTrainingRequirementDetails(state as never, targetEra);
  const unmet = details.filter((detail) => !detail.met);
  const inspection = targetEra
    ? inspectCommand(state, { type: "START_TRAINING", payload: { targetEra } })
    : null;
  let goal = targetEra
    ? `Prepare ${targetEra} training`
    : "Review your completed journey";
  let blocker: string | null = unmet[0]?.label ?? null;
  let reason =
    "Choose how to divide limited funding between infrastructure, data, and research. This is a simplified simulation, not a forecast.";

  if (state.clock.status === "completed") {
    return {
      goal,
      blocker: null,
      reason:
        "Your run is complete. The debrief reports actions and outcomes, not a validated score or strategy rating.",
      actions: [
        {
          id: "review-journey",
          label: "Review journey",
          command: null,
          tab: "journey",
          enabled: true,
          cost: null,
          reason: null,
        },
      ],
      training: {
        targetEra: null,
        ready: false,
        cost: null,
        computeRequired: null,
        blockers: [],
      },
    };
  }
  if (state.clock.status === "not_started")
    add("start", "Start run", { type: "START_RUN", payload: {} }, "resources");
  if (state.clock.status === "paused") {
    goal = "Resume when you are ready";
    reason = "Active time and research do not advance while paused.";
    add(
      "resume",
      "Resume run",
      { type: "RESUME_RUN", payload: {} },
      "resources",
    );
  }
  if (state.training.active) {
    goal = `Complete ${targetEra} training`;
    blocker = null;
    reason = `${state.training.daysRemaining} active seconds remain. Training reserves ${state.training.computeReserved.toLocaleString("en-US")} compute; services share the remaining capacity.`;
  } else {
    for (const detail of unmet) {
      const action = requirementActions[detail.key];
      if (action)
        add(
          action.id,
          action.label,
          { type: action.type, payload: {} } as GameCommandIntent,
          "resources",
        );
    }
    if (unmet.some((detail) => detail.key === "research-progress")) {
      add(
        "hire-engineer",
        "Hire research engineer",
        { type: "HIRE_RESEARCH_ENGINEER", payload: {} },
        "resources",
      );
      reason =
        "Research advances on active ticks using free compute, architecture, and engineers. Selling service capacity can slow research.";
    }
    if (targetEra)
      add(
        "train",
        `Start ${targetEra} training`,
        { type: "START_TRAINING", payload: { targetEra } },
        "training",
      );
    if (inspection?.enabled) {
      blocker = null;
      reason =
        "Training is ready. You can train now, or invest further before reserving compute.";
    }
  }
  if (state.revenue.apiAvailable) {
    if (!state.revenue.apiPlatformBuilt)
      add(
        "build-api",
        "Build API platform",
        { type: "BUILD_API_PLATFORM", payload: {} },
        "economy",
      );
    else
      add(
        state.revenue.apiEnabled ? "pause-api" : "enable-api",
        state.revenue.apiEnabled ? "Pause API service" : "Enable API service",
        { type: "TOGGLE_API_SERVICE", payload: {} },
        "economy",
      );
  }
  if (state.revenue.chatbotAvailable) {
    if (!state.revenue.chatbotPlatformBuilt)
      add(
        "build-chatbot",
        "Build chatbot platform",
        { type: "BUILD_CHATBOT_PLATFORM", payload: {} },
        "economy",
      );
    else
      add(
        state.revenue.chatbotEnabled ? "pause-chatbot" : "enable-chatbot",
        state.revenue.chatbotEnabled
          ? "Pause chatbot service"
          : "Enable chatbot service",
        { type: "TOGGLE_CHATBOT_SERVICE", payload: {} },
        "economy",
      );
  }
  const nonCustomerUsage = Math.max(
    0,
    state.computeCapacity.used - state.computeCapacity.customerUsage,
  );
  const shortfall =
    getServiceDemand(state).total >
    Math.max(0, state.computeCapacity.maxCapacity - nonCustomerUsage);
  if (shortfall || unmet.some((detail) => detail.key === "training-compute")) {
    add(
      "expand-capacity",
      "Expand compute capacity",
      { type: "INVEST_COMPUTE", payload: {} },
      "resources",
    );
    if (shortfall) {
      blocker = "Service capacity shortfall";
      reason =
        "Demand exceeds available service capacity. Add capacity, improve efficiency, or pause a service; sustained shortfall causes lost customers.";
    }
  }
  if (governanceGap(state) > 0 && !state.training.active) {
    add(
      "invest-regulation",
      "Invest in governance",
      { type: "INVEST_REGULATION", payload: {} },
      "resources",
    );
    add(
      "invest-hardware",
      "Add hardware redundancy",
      { type: "INVEST_HARDWARE", payload: {} },
      "resources",
    );
    reason += ` The final run adds ${governanceGap(state) * getRuleset(state.rulesetVersion).governance.missingLevelTrainingTicks} active seconds at current governance/redundancy levels; these investments reduce that delay.`;
  }
  if (unmet.some((detail) => detail.key === "training-funds")) {
    const recovery = getRuleset(state.rulesetVersion).recovery[
      state.currentEra
    ];
    if (recovery) {
      const alreadyUsed = state.mechanics.appliedRecoveryGrantIds.includes(
        recovery.id,
      );
      const recoveryId = alreadyUsed ? `${recovery.id}_recovery` : recovery.id;
      const tick = recovery.earliestTick + (alreadyUsed ? 180 : 0);
      if (!state.mechanics.appliedRecoveryGrantIds.includes(recoveryId)) {
        actions.push({
          id: "recover",
          label: `Continuity funding: ${recoveryId.replaceAll("_", " ")}`,
          command: null,
          tab: "economy",
          enabled: true,
          cost: null,
          reason: `Automatic, one-time funding when eligible at active tick ${tick}; it is recorded as external emergency funding, not earned revenue.`,
        });
      }
    }
  }
  return {
    goal,
    blocker,
    reason,
    actions,
    training: {
      targetEra,
      ready: inspection?.enabled ?? false,
      cost: run?.moneyCost ?? null,
      computeRequired: run?.computeRequired ?? null,
      blockers: state.training.active
        ? ["Training already active"]
        : unmet.map((detail) => detail.label),
    },
  };
}
