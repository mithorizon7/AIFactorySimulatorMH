import {
  CONTENT_REVIEW_DATE,
  learningClaimSchema,
  type LearningClaim,
  type LinkedMechanic,
} from "./learningContent";

// Compatibility targets remain stable while the contextual tutorial replaces
// the legacy tour. All copy in this file describes the simulation, not history.
export type TutorialTabId =
  | "dashboard"
  | "training"
  | "resources"
  | "economy"
  | "breakthroughs"
  | "progression";
export type TutorialAccordionId = "compute" | "data" | "algorithm";
export interface TutorialStepAvailability {
  visibleTab?: TutorialTabId;
  expandedAccordion?: TutorialAccordionId;
}

export const tutorialTargetAvailability = {
  "dashboard-tab": {},
  "progression-tab": {},
  "economy-tab": {},
  "training-tab-trigger": {},
  "training-panel": { visibleTab: "training" as TutorialTabId },
  "compute-advanced-toggle": { visibleTab: "resources" as TutorialTabId },
  "compute-level-upgrade": {
    visibleTab: "resources" as TutorialTabId,
    expandedAccordion: "compute" as TutorialAccordionId,
  },
  "data-advanced-toggle": { visibleTab: "resources" as TutorialTabId },
  "data-quality-upgrade": {
    visibleTab: "resources" as TutorialTabId,
    expandedAccordion: "data" as TutorialAccordionId,
  },
  "algorithm-advanced-toggle": { visibleTab: "resources" as TutorialTabId },
  "algorithm-architecture-upgrade": {
    visibleTab: "resources" as TutorialTabId,
    expandedAccordion: "algorithm" as TutorialAccordionId,
  },
} as const satisfies Record<string, TutorialStepAvailability>;
export type TutorialTargetId = keyof typeof tutorialTargetAvailability;

export interface TutorialStepDefinition {
  title: string;
  content: string;
  context: string;
  action: string;
  targetElement: TutorialTargetId | null;
  modalStyle: boolean;
  icon: string;
  nextTarget?: TutorialTargetId;
  highlightTab?: TutorialTabId;
  speaker?: string;
}

export const tutorialContent: Record<
  string,
  Record<number, TutorialStepDefinition>
> = {
  PHASE_1: {
    1: {
      title: "Welcome to AI Factory",
      content:
        "I'm Spark. Build a fictional model business by balancing compute, data, research, and customers. Your first goal is to prepare a training run.",
      context:
        "This simplified simulation is not a forecast. Model Capability is a game measure, not IQ or proof of general intelligence. GNT-5 through GNT-7 are speculative.",
      action: "Continue",
      targetElement: null,
      modalStyle: true,
      icon: "spark",
    },
    2: {
      title: "Make your first choice",
      content:
        "Your starting cash is limited. Compute expands infrastructure, data supports training, and research unlocks improvements. The next-goal card shows what is missing.",
      context:
        "Game costs and unlocks are invented. There is no single purchase that recreates real AI research.",
      action: "Explore your first investment",
      targetElement: null,
      modalStyle: true,
      icon: "lightbulb",
    },
  },
  PHASE_2: {
    1: {
      title: "Compute capacity",
      content:
        "Compute supports both training and customer services. Open the controls to see available investments.",
      context:
        "In this game, serving demand can compete with the capacity reserved for training.",
      action: "Open Compute controls",
      targetElement: "compute-advanced-toggle",
      modalStyle: false,
      icon: "cpu",
      nextTarget: "compute-level-upgrade",
    },
    2: {
      title: "Invest in compute",
      content:
        "Compare the infrastructure cost with the next training blocker before spending.",
      context:
        "An investment removes a particular game constraint; it does not guarantee a real-world capability gain.",
      action: "Invest in Compute Infrastructure",
      targetElement: "compute-level-upgrade",
      modalStyle: false,
      icon: "cpu",
    },
    3: {
      title: "Training data",
      content:
        "Data investments have separate quality, quantity, and format requirements. Open the controls to inspect them.",
      context:
        "More data alone is not the same choice as better-curated data in this simulation.",
      action: "Open Data controls",
      targetElement: "data-advanced-toggle",
      modalStyle: false,
      icon: "database",
      nextTarget: "data-quality-upgrade",
    },
    4: {
      title: "Improve data quality",
      content:
        "Invest in the data requirement your next run needs. Keep enough cash for its other prerequisites.",
      context:
        "Quality is a simplified game input, not a promise that a model's answers are factual or unbiased.",
      action: "Invest in data quality",
      targetElement: "data-quality-upgrade",
      modalStyle: false,
      icon: "database",
    },
    5: {
      title: "Algorithms and research",
      content:
        "Research supports architecture upgrades and breakthroughs. Open the controls to compare your options.",
      context:
        "Real research includes experiments and failures; the game compresses this into levels and progress.",
      action: "Open Algorithm controls",
      targetElement: "algorithm-advanced-toggle",
      modalStyle: false,
      icon: "cog",
      nextTarget: "algorithm-architecture-upgrade",
    },
    6: {
      title: "Research an improvement",
      content:
        "Choose research that addresses a visible blocker rather than upgrading a stat without a purpose.",
      context:
        "Breakthrough prerequisites are game rules, not recipes for scientific discoveries.",
      action: "Invest in algorithm improvements",
      targetElement: "algorithm-architecture-upgrade",
      modalStyle: false,
      icon: "cog",
    },
  },
  PHASE_3: {
    1: {
      title: "Read the dashboard",
      content:
        "See what changed after your investments and inspect your next goal.",
      context:
        "Model Capability is a synthetic game measure. It is not a test of intelligence or a forecast.",
      action: "Open Dashboard",
      targetElement: "dashboard-tab",
      modalStyle: false,
      icon: "trending-up",
      highlightTab: "dashboard",
    },
    2: {
      title: "Your Journey",
      content:
        "Review era goals and breakthroughs. Later eras ask different strategic questions, not predictions about future products.",
      context:
        "GNT names are fictional. GNT-5 through GNT-7 are explicitly speculative scenarios.",
      action: "Explore Journey",
      targetElement: "progression-tab",
      modalStyle: false,
      icon: "target",
      highlightTab: "progression",
    },
    3: {
      title: "Revenue and capacity",
      content:
        "Platforms and enabled services can earn game revenue, but customers also use compute. Compare both sides before expanding.",
      context:
        "These fictional cash flows are not an account of how any real company financed a model.",
      action: "Inspect Economy",
      targetElement: "economy-tab",
      modalStyle: false,
      icon: "dollar-sign",
      highlightTab: "economy",
    },
  },
  PHASE_4: {
    1: {
      title: "Prepare the next run",
      content:
        "The training card lists current costs, blockers, and capacity requirements. Use those values, not remembered prices from another era.",
      context:
        "Funding and revenue are game resources. Their relative size is not a real-world financial model.",
      action: "Open Training",
      targetElement: "training-tab-trigger",
      modalStyle: false,
      icon: "target",
    },
    2: {
      title: "Commit capacity to training",
      content:
        "Start training when its listed requirements are met. The run reserves compute, so consider current customer demand too.",
      context:
        "Simulation ticks and training prices are invented; they do not estimate real model-training time or cost.",
      action: "Review the training card and blockers",
      targetElement: "training-panel",
      modalStyle: false,
      icon: "zap",
    },
    3: {
      title: "Keep experimenting",
      content:
        "You have seen the basic loop. Compare investments, training, customer demand, and recovery choices as the scenario develops.",
      context:
        "Completing the game is not evidence of mastery of AI development. Use the end-of-era questions to reflect on your decisions.",
      action: "Continue playing",
      targetElement: null,
      modalStyle: true,
      icon: "trophy",
    },
  },
};

export function getTutorialCurrentStep(tutorial: {
  phase: number;
  step: number;
}) {
  return tutorialContent[`PHASE_${tutorial.phase}`]?.[tutorial.step];
}

export function getTutorialStepAvailability(
  step?: Pick<TutorialStepDefinition, "targetElement"> | null,
): TutorialStepAvailability {
  return step?.targetElement
    ? tutorialTargetAvailability[step.targetElement]
    : {};
}

const message = (
  title: string,
  content: string,
  context = "Simulation guidance: compare the visible game requirements and outcomes before your next choice.",
) => ({ title, content, context, speaker: "spark" as const });

export const narrative = {
  BREAKTHROUGH_1: message(
    "Transformer milestone",
    "A research milestone unlocked. Its game benefits do not recreate a scientific discovery.",
  ),
  BREAKTHROUGH_2: message(
    "Pre-training milestone",
    "A data milestone unlocked. Review its game effect in Journey.",
  ),
  BREAKTHROUGH_3: message(
    "Scaling milestone",
    "An infrastructure milestone unlocked. Larger game levels are not real parameter counts.",
  ),
  BREAKTHROUGH_16: message(
    "Reasoning milestone — speculative",
    "This scenario unlock is not proof that generated reasoning is correct or human-like.",
  ),
  BREAKTHROUGH_17: message(
    "Feedback-training milestone",
    "A feedback-related game milestone unlocked; this is not a guarantee of safe or reliable behavior.",
  ),
  BREAKTHROUGH_18: message(
    "Hardware milestone — speculative",
    "A fictional hardware upgrade unlocked. Its efficiency benefits are game rules, not vendor benchmarks.",
  ),
  BREAKTHROUGH_19: message(
    "Generated-data milestone — speculative",
    "This fictional upgrade explores generated data. Generated examples still need careful evaluation.",
  ),
  BREAKTHROUGH_20: message(
    "Coordination milestone — speculative",
    "This fictional upgrade explores teams of systems. More systems do not automatically mean fewer errors.",
  ),
  BREAKTHROUGH_21: message(
    "Compact-model milestone — speculative",
    "This fictional upgrade explores efficiency. Running locally does not by itself guarantee privacy.",
  ),
  ERA_ADVANCE_GNT2: message(
    "GNT-2: limited capital",
    "Choose which infrastructure, data, or research blocker to remove first.",
  ),
  ERA_ADVANCE_GNT3: message(
    "GNT-3: revenue versus capacity",
    "API services become a game option. Build the platform and reserve enough capacity for training.",
  ),
  ERA_ADVANCE_GNT4: message(
    "GNT-4: growth versus overload",
    "Chatbot services become a game option. Customer growth also increases demand on compute.",
  ),
  ERA_ADVANCE_AGI: message(
    "Scenario complete",
    "You completed the fictional scenario, not a real AGI system.",
    "Model Capability is synthetic. GNT-5 through GNT-7 are speculative, not a forecast.",
  ),
  INVESTMENT_MILESTONE_1M: message(
    "Investment milestone",
    "Your recorded game investment crossed a milestone. Review where you allocated it.",
  ),
  INVESTMENT_MILESTONE_10M: message(
    "Investment milestone",
    "A larger investment milestone is recorded. Spending alone does not show which choices were useful.",
  ),
  REVENUE_FIRST_API: message(
    "First API revenue",
    "Your API service has earned its first game revenue. Check the capacity it uses.",
  ),
  REVENUE_FIRST_SUBSCRIPTION: message(
    "First subscription revenue",
    "Your chatbot has earned game revenue. Watch retention as well as growth.",
  ),
  COMPUTE_WARNING_HIGH: message(
    "Review capacity",
    "High utilization alone is not failure. Check whether demand exceeds capacity or blocks the next training run.",
  ),
  MONEY_WARNING_LOW: message(
    "Review your cash",
    "Compare your cash with the next required purchase and any active revenue options.",
  ),
  TRAINING_FIRST_SUCCESS: message(
    "First training complete",
    "Your first run completed. Review its capability gain and the next era's choices.",
  ),
  ADVICE_BALANCE_RESOURCES: message(
    "Compare your bottlenecks",
    "Invest where it removes a current blocker; equal spending is not automatically the best strategy.",
  ),
  ADVICE_REVENUE_FOCUS: message(
    "Consider a revenue option",
    "A service may help fund the next run, while also consuming compute.",
  ),
  API_SERVICE_AVAILABLE: message(
    "API service available",
    "Inspect the platform cost, enablement state, and capacity demand in Economy.",
  ),
  API_AUTO_ENABLE_SUGGESTION: message(
    "Consider enabling API service",
    "You can enable the service in Economy if its platform is ready. Check capacity first; Spark does not make this choice for you.",
  ),
  CHATBOT_SERVICE_AVAILABLE: message(
    "Chatbot service available",
    "Compare subscription price, product quality, marketing, and available capacity.",
  ),
  API_OPTIMIZATION_ADVICE: message(
    "Review the API service",
    "Compare developer-tool improvements and capacity with your next training goal.",
  ),
  CHATBOT_OPTIMIZATION_ADVICE: message(
    "Review chatbot growth",
    "A better product or marketing may grow demand. Check whether you can serve that demand.",
  ),
  COMPUTE_WARNING_CRITICAL: message(
    "Capacity pressure",
    "Inspect actual shortfall and customer loss. More compute, lower demand, or service changes may help.",
  ),
  LOW_FUNDS_WARNING: message(
    "Cash-flow concern",
    "Cash is low. Check available services and visible recovery notices before choosing another investment.",
  ),
  FIRST_TRAINING_COMPLETED: message(
    "Your first training success",
    "The run increased Model Capability. This is a game outcome, not an intelligence test.",
  ),
  FIRST_REVENUE_MILESTONE: message(
    "Revenue is flowing",
    "Game revenue can finance later purchases. It also brings serving demand.",
  ),
  BALANCE_STRATEGY_ADVICE: message(
    "Invest with a purpose",
    "Compare the next blocker and current shortfall instead of maximizing one stat or equalizing everything.",
  ),
  FUNDING_MILESTONE_ADVICE: message(
    "Allocate your funding",
    "You have more game capital. Decide which blocker or reserve is worth buying next.",
  ),
  INVESTMENT_MILESTONE_100M: message(
    "Funding milestone",
    "A major game funding milestone is recorded. This amount is not a real-world funding estimate.",
  ),
  RESEARCH_PROGRESS_SLOW: message(
    "Research progress",
    "Inspect research requirements and engineer costs. Compare hiring with the next architecture upgrade.",
  ),
  TRAINING_STRATEGY_HINT: message(
    "Reserve room for training",
    "Compare the training reserve with current serving demand before launching a run.",
  ),
  TUTORIAL_STEP_1: message(
    "Welcome to the Factory",
    "Start with a visible training blocker and compare the investment options.",
    "This fictional simulation simplifies research, capacity, money, and time; it is not a forecast.",
  ),
  TUTORIAL_STEP_2: message(
    "Data choices",
    "Inspect data quality, quantity, and formats against the training requirements.",
  ),
  TUTORIAL_STEP_3: message(
    "Research choices",
    "Compare architecture upgrades and engineer hiring with the next research blocker.",
  ),
  SPARK_BREAKTHROUGH_ADVICE: message(
    "Breakthrough unlocked",
    "Review the recorded game benefit in Journey. A milestone name is not proof of a real-world capability.",
  ),
  SPARK_TRAINING_GUIDANCE: message(
    "Training capacity",
    "Keep enough available compute for the training reserve and compare it with serving demand.",
  ),
  SPARK_SCALING_WISDOM: message(
    "Scale is one choice",
    "Compare data quality, research, and compute. More infrastructure is not automatically the most useful next investment.",
  ),
  STUCK_NO_MONEY_HINT: message(
    "Financial options",
    "Check whether a platform and service are available to earn game revenue. Read any recovery notice before acting.",
  ),
  STUCK_NO_REVENUE_HINT: message(
    "Revenue options",
    "Inspect Economy for platform readiness and service controls, then check available compute.",
  ),
  STUCK_TRAINING_BLOCKED_HINT: message(
    "Training blockers",
    "The Training card lists exact unmet requirements. Choose an investment that reduces a listed deficit.",
  ),
  STUCK_NO_BREAKTHROUGHS_HINT: message(
    "Breakthrough requirements",
    "Inspect Journey for the missing era or resource level. Even spending is not itself an unlock condition.",
  ),
};

const narrativeMechanics = {
  BREAKTHROUGH_1: ["INVEST_ALGORITHM_ARCHITECTURE", "selector:breakthroughs"],
  BREAKTHROUGH_2: ["INVEST_DATA_QUALITY", "selector:breakthroughs"],
  BREAKTHROUGH_3: ["INVEST_COMPUTE", "selector:breakthroughs"],
  BREAKTHROUGH_16: ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_COMPUTE"],
  BREAKTHROUGH_17: ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_DATA_QUALITY"],
  BREAKTHROUGH_18: ["INVEST_COMPUTE", "selector:breakthroughs"],
  BREAKTHROUGH_19: ["INVEST_DATA_QUALITY", "INVEST_ALGORITHM_ARCHITECTURE"],
  BREAKTHROUGH_20: ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_COMPUTE"],
  BREAKTHROUGH_21: ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_DATA_QUALITY"],
  ERA_ADVANCE_GNT2: ["selector:allocation"],
  ERA_ADVANCE_GNT3: [
    "BUILD_API_PLATFORM",
    "TOGGLE_API_SERVICE",
    "selector:capacity",
  ],
  ERA_ADVANCE_GNT4: [
    "BUILD_CHATBOT_PLATFORM",
    "TOGGLE_CHATBOT_SERVICE",
    "selector:capacity",
  ],
  ERA_ADVANCE_AGI: ["selector:completion"],
  INVESTMENT_MILESTONE_1M: ["selector:allocation"],
  INVESTMENT_MILESTONE_10M: ["selector:allocation"],
  REVENUE_FIRST_API: ["TOGGLE_API_SERVICE", "selector:capacity"],
  REVENUE_FIRST_SUBSCRIPTION: ["TOGGLE_CHATBOT_SERVICE", "selector:churn"],
  COMPUTE_WARNING_HIGH: ["selector:capacity", "selector:shortfall"],
  MONEY_WARNING_LOW: ["selector:allocation", "selector:training-readiness"],
  TRAINING_FIRST_SUCCESS: ["START_TRAINING", "selector:training-readiness"],
  ADVICE_BALANCE_RESOURCES: [
    "selector:training-readiness",
    "selector:allocation",
  ],
  ADVICE_REVENUE_FOCUS: ["TOGGLE_API_SERVICE", "TOGGLE_CHATBOT_SERVICE"],
  API_SERVICE_AVAILABLE: ["BUILD_API_PLATFORM", "TOGGLE_API_SERVICE"],
  API_AUTO_ENABLE_SUGGESTION: ["TOGGLE_API_SERVICE", "selector:capacity"],
  CHATBOT_SERVICE_AVAILABLE: [
    "SET_MONTHLY_FEE",
    "UPGRADE_CHATBOT",
    "RUN_MARKETING_CAMPAIGN",
  ],
  API_OPTIMIZATION_ADVICE: ["UPGRADE_DEVELOPER_TOOLS", "selector:capacity"],
  CHATBOT_OPTIMIZATION_ADVICE: [
    "UPGRADE_CHATBOT",
    "RUN_MARKETING_CAMPAIGN",
    "selector:capacity",
  ],
  COMPUTE_WARNING_CRITICAL: [
    "INVEST_COMPUTE",
    "selector:shortfall",
    "selector:churn",
  ],
  LOW_FUNDS_WARNING: [
    "TOGGLE_API_SERVICE",
    "TOGGLE_CHATBOT_SERVICE",
    "selector:allocation",
  ],
  FIRST_TRAINING_COMPLETED: ["START_TRAINING", "selector:completion"],
  FIRST_REVENUE_MILESTONE: [
    "TOGGLE_API_SERVICE",
    "TOGGLE_CHATBOT_SERVICE",
    "selector:capacity",
  ],
  BALANCE_STRATEGY_ADVICE: [
    "selector:allocation",
    "selector:training-readiness",
  ],
  FUNDING_MILESTONE_ADVICE: ["selector:allocation", "selector:resilience"],
  INVESTMENT_MILESTONE_100M: ["selector:allocation"],
  RESEARCH_PROGRESS_SLOW: [
    "HIRE_RESEARCH_ENGINEER",
    "INVEST_ALGORITHM_ARCHITECTURE",
  ],
  TRAINING_STRATEGY_HINT: ["START_TRAINING", "selector:capacity"],
  TUTORIAL_STEP_1: ["selector:training-readiness"],
  TUTORIAL_STEP_2: [
    "INVEST_DATA_QUALITY",
    "INVEST_DATA_QUANTITY",
    "INVEST_DATA_FORMATS",
  ],
  TUTORIAL_STEP_3: ["INVEST_ALGORITHM_ARCHITECTURE", "HIRE_RESEARCH_ENGINEER"],
  SPARK_BREAKTHROUGH_ADVICE: ["selector:breakthroughs"],
  SPARK_TRAINING_GUIDANCE: ["START_TRAINING", "selector:capacity"],
  SPARK_SCALING_WISDOM: [
    "INVEST_COMPUTE",
    "INVEST_DATA_QUALITY",
    "INVEST_ALGORITHM_ARCHITECTURE",
  ],
  STUCK_NO_MONEY_HINT: [
    "BUILD_API_PLATFORM",
    "TOGGLE_API_SERVICE",
    "selector:allocation",
  ],
  STUCK_NO_REVENUE_HINT: ["TOGGLE_API_SERVICE", "TOGGLE_CHATBOT_SERVICE"],
  STUCK_TRAINING_BLOCKED_HINT: ["selector:training-readiness"],
  STUCK_NO_BREAKTHROUGHS_HINT: ["selector:breakthroughs"],
} satisfies Record<keyof typeof narrative, LinkedMechanic[]>;

export const narrativeLearning = Object.fromEntries(
  Object.entries(narrative).map(([key, entry]) => [
    key,
    learningClaimSchema.parse({
      id: `narrative-${key.toLowerCase()}`,
      text: `${entry.content} ${entry.context}`,
      sourceUrls: [],
      reviewedAt: CONTENT_REVIEW_DATE,
      claimType: "simulation",
      uncertaintyLabel: "Simulation guidance — not real-world evidence",
      linkedMechanics: narrativeMechanics[key as keyof typeof narrative],
    }),
  ]),
) as Record<keyof typeof narrative, LearningClaim>;

export const tutorialLearning: Record<string, LearningClaim> =
  Object.fromEntries(
    Object.entries(tutorialContent).flatMap(([phase, steps]) =>
      Object.entries(steps).map(([step, entry]) => {
        const links: LinkedMechanic[] = entry.targetElement?.startsWith(
          "compute-",
        )
          ? ["INVEST_COMPUTE"]
          : entry.targetElement?.startsWith("data-")
            ? ["INVEST_DATA_QUALITY"]
            : entry.targetElement?.startsWith("algorithm-")
              ? ["INVEST_ALGORITHM_ARCHITECTURE"]
              : entry.targetElement === "economy-tab"
                ? [
                    "TOGGLE_API_SERVICE",
                    "TOGGLE_CHATBOT_SERVICE",
                    "selector:capacity",
                  ]
                : ["selector:training-readiness", "selector:allocation"];
        return [
          `${phase}.${step}`,
          learningClaimSchema.parse({
            id: `tutorial-${phase.toLowerCase()}-${step}`,
            text: `${entry.content} ${entry.context}`,
            sourceUrls: [],
            reviewedAt: CONTENT_REVIEW_DATE,
            claimType: "simulation",
            uncertaintyLabel:
              "Simplified game guidance — not real-world evidence",
            linkedMechanics: links,
          }),
        ];
      }),
    ),
  );
