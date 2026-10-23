import { z } from "zod";
import { Era } from "@shared/game/domain/era";
import {
  gameCommandSchema,
  type GameCommandType,
} from "@shared/game/schemas/commands";

export const CONTENT_REVIEW_DATE = "2026-10-23" as const;
export const SIMULATION_DISCLAIMER =
  "This is a simplified, fictional management simulation, not a forecast. GNT names are not real model releases. Model Capability is a synthetic game measure, not IQ, a real-world benchmark, or evidence of AGI. GNT-5 through GNT-7 are speculative scenarios.";

export const learningSources = {
  transformer: {
    title: "Attention Is All You Need (2017)",
    url: "https://arxiv.org/abs/1706.03762",
  },
  gpt3: {
    title: "Language Models are Few-Shot Learners (2020)",
    url: "https://arxiv.org/abs/2005.14165",
  },
  gpt4: {
    title: "GPT-4 Technical Report (2023), scope and limitations",
    url: "https://arxiv.org/html/2303.08774v6",
  },
  chinchilla: {
    title: "Training Compute-Optimal Large Language Models (2022)",
    url: "https://arxiv.org/abs/2203.15556",
  },
  instruct: {
    title:
      "Training language models to follow instructions with human feedback (2022)",
    url: "https://arxiv.org/abs/2203.02155",
  },
  chainOfThought: {
    title:
      "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (2022)",
    url: "https://arxiv.org/abs/2201.11903",
  },
  synthetic: {
    title: "Textbooks Are All You Need (2023)",
    url: "https://arxiv.org/abs/2306.11644",
  },
  syntheticRisk: {
    title:
      "The Curse of Recursion: Training on Generated Data Makes Models Forget (2023)",
    url: "https://arxiv.org/abs/2305.17493",
  },
  governance: {
    title: "NIST AI Risk Management Framework",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
  },
  overload: {
    title: "Google Site Reliability Engineering: Handling Overload",
    url: "https://sre.google/sre-book/handling-overload/",
  },
} as const;

// These selector links identify things the player can observe, not new engine
// rules. Command links are checked against the canonical command union.
export const simulationSelectorIds = [
  "selector:allocation",
  "selector:capacity",
  "selector:shortfall",
  "selector:churn",
  "selector:training-readiness",
  "selector:breakthroughs",
  "selector:resilience",
  "selector:completion",
] as const;
export type SimulationSelectorId = (typeof simulationSelectorIds)[number];
export type LinkedMechanic = GameCommandType | SimulationSelectorId;

const commandTypes = new Set<string>(
  gameCommandSchema.options.map((command) => command.shape.type.value),
);
const selectorIds = new Set<string>(simulationSelectorIds);
export const linkedMechanicSchema = z.custom<LinkedMechanic>(
  (value) =>
    typeof value === "string" &&
    (commandTypes.has(value) || selectorIds.has(value)),
  "Unknown game command or simulation selector",
);

export const learningClaimSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    sourceUrls: z.array(z.string().url().startsWith("https://")),
    reviewedAt: z.literal(CONTENT_REVIEW_DATE),
    claimType: z.enum(["historical", "current", "speculative", "simulation"]),
    uncertaintyLabel: z.string().min(1),
    linkedMechanics: z.array(linkedMechanicSchema).min(1),
  })
  .strict()
  .superRefine((claim, context) => {
    if (
      (claim.claimType === "historical" || claim.claimType === "current") &&
      claim.sourceUrls.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceUrls"],
        message: "Historical and current claims need a primary source",
      });
    }
  });
export type LearningClaim = z.infer<typeof learningClaimSchema>;

export const eraLearningSchema = z
  .object({
    era: z.nativeEnum(Era),
    title: z.string().min(1),
    tension: z.string().min(1),
    lesson: learningClaimSchema,
    reflection: z.string().min(1),
  })
  .strict()
  .superRefine((entry, context) => {
    if (
      [Era.GNT5, Era.GNT6, Era.GNT7].includes(entry.era) &&
      entry.lesson.claimType !== "speculative"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lesson", "claimType"],
        message: "GNT-5 through GNT-7 must be labeled speculative",
      });
    }
  });
export type EraLearning = z.infer<typeof eraLearningSchema>;

export const breakthroughLearningSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string().min(1),
    lesson: learningClaimSchema,
  })
  .strict();
export type BreakthroughLearning = z.infer<typeof breakthroughLearningSchema>;

function claim(
  id: string,
  text: string,
  claimType: LearningClaim["claimType"],
  linkedMechanics: LinkedMechanic[],
  sources: (keyof typeof learningSources)[] = [],
  uncertaintyLabel = claimType === "speculative"
    ? "Speculative game scenario — not a forecast or demonstrated capability"
    : claimType === "simulation"
      ? "Simplified game rule — not a real-world estimate"
      : "Historical study — results depend on the tasks and evaluation",
): LearningClaim {
  return learningClaimSchema.parse({
    id,
    text,
    claimType,
    sourceUrls: sources.map((key) => learningSources[key].url),
    reviewedAt: CONTENT_REVIEW_DATE,
    uncertaintyLabel,
    linkedMechanics,
  });
}

export const eraLearning: Record<Era, EraLearning> = {
  [Era.GNT2]: {
    era: Era.GNT2,
    title: "GNT-2: Build with limited capital",
    tension: "Split seed capital across infrastructure, data, and research.",
    lesson: claim(
      "era-gnt2",
      "The 2017 Transformer paper introduced an attention-based architecture and evaluated it on translation tasks. In this game, compute, data, and research are separate investments; no purchase reproduces that research.",
      "historical",
      [
        "INVEST_COMPUTE",
        "INVEST_DATA_QUALITY",
        "INVEST_ALGORITHM_ARCHITECTURE",
        "selector:allocation",
      ],
      ["transformer"],
    ),
    reflection:
      "Which blocker did your first purchase remove, and what did you postpone?",
  },
  [Era.GNT3]: {
    era: Era.GNT3,
    title: "GNT-3: Earn revenue, reserve capacity",
    tension: "Monetization uses compute that could support training.",
    lesson: claim(
      "era-gnt3",
      "GPT-3's 2020 study tested a 175-billion-parameter model with examples supplied in prompts, without updating its weights for each task. It still struggled on some tasks. The game's shared serving/training budget is a simplification, not GPT-3's business history.",
      "historical",
      [
        "BUILD_API_PLATFORM",
        "TOGGLE_API_SERVICE",
        "START_TRAINING",
        "selector:capacity",
      ],
      ["gpt3"],
    ),
    reflection:
      "Did serving more customers leave enough capacity for your next training run?",
  },
  [Era.GNT4]: {
    era: Era.GNT4,
    title: "GNT-4: Grow without overload",
    tension:
      "More customers can mean more revenue, but overload can drive churn.",
    lesson: claim(
      "era-gnt4",
      "Google's reliability guidance describes how overloaded services may give degraded responses or errors. Here, demand above available capacity creates simulated shortfall and customer loss; these rates are game rules, not measured customer behavior.",
      "current",
      [
        "RUN_MARKETING_CAMPAIGN",
        "SET_MONTHLY_FEE",
        "INVEST_COMPUTE",
        "selector:shortfall",
        "selector:churn",
      ],
      ["overload"],
      "Engineering guidance — game churn rates are invented, not calibrated to a real company",
    ),
    reflection:
      "Did extra demand improve your revenue, or did it increase shortfall and churn?",
  },
  [Era.GNT5]: {
    era: Era.GNT5,
    title: "GNT-5: Quality and efficiency versus scale",
    tension:
      "Compare better data and algorithms with buying more infrastructure.",
    lesson: claim(
      "era-gnt5",
      "This speculative scenario explores quality and efficiency rather than scale alone. Historical motivation: Chinchilla outperformed a larger comparison model on the paper's evaluations using the same training-compute budget and more data. That result does not predict a future model generation.",
      "speculative",
      [
        "INVEST_DATA_QUALITY",
        "INVEST_ALGORITHM_ARCHITECTURE",
        "INVEST_COMPUTE",
        "selector:training-readiness",
      ],
      ["chinchilla"],
    ),
    reflection:
      "Which choice improved progress per dollar: more scale, better data, or research?",
  },
  [Era.GNT6]: {
    era: Era.GNT6,
    title: "GNT-6: Speed versus resilience",
    tension:
      "Choose how much to invest in governance, redundancy, and recovery capacity.",
    lesson: claim(
      "era-gnt6",
      "This speculative scenario asks what you will protect before pushing faster. NIST's voluntary AI Risk Management Framework supports considering risks throughout development and use. The game's regulation and reserve mechanics are simplified proxies, not a safety guarantee or legal-compliance checklist.",
      "speculative",
      [
        "INVEST_REGULATION",
        "INVEST_HARDWARE",
        "INVEST_COMPUTE",
        "selector:resilience",
      ],
      ["governance", "overload"],
    ),
    reflection:
      "What did governance or spare capacity protect when conditions changed, and what did it cost?",
  },
  [Era.GNT7]: {
    era: Era.GNT7,
    title: "GNT-7: Complete and reconsider",
    tension:
      "Finish the scenario while preserving a business that can recover.",
    lesson: claim(
      "era-gnt7",
      "GNT-7 is a speculative final scenario, not an AGI threshold. Completing training and reaching Model Capability ends this game; neither establishes human-level intelligence, safety, or a timetable for real AI progress.",
      "speculative",
      ["START_TRAINING", "selector:completion", "selector:resilience"],
    ),
    reflection:
      "Which trade-off would you reverse on a replay, and which run facts support that choice?",
  },
};
Object.values(eraLearning).forEach((entry) => eraLearningSchema.parse(entry));

const breakthrough = (
  id: number,
  title: string,
  text: string,
  claimType: LearningClaim["claimType"],
  linkedMechanics: LinkedMechanic[],
  sources: (keyof typeof learningSources)[] = [],
): BreakthroughLearning =>
  breakthroughLearningSchema.parse({
    id,
    title,
    lesson: claim(
      `breakthrough-${id}`,
      text,
      claimType,
      linkedMechanics,
      sources,
    ),
  });

export const breakthroughLearning: Record<number, BreakthroughLearning> = {
  1: breakthrough(
    1,
    "Transformer Architecture",
    "The Transformer paper introduced an attention-based sequence model and reported translation results. This game turns research into a discrete unlock, not a research recipe.",
    "historical",
    ["INVEST_ALGORITHM_ARCHITECTURE", "selector:breakthroughs"],
    ["transformer"],
  ),
  2: breakthrough(
    2,
    "Unsupervised Pre-training",
    "GPT-3 used language-model pre-training before evaluation with prompts. Learning statistical patterns from text does not guarantee factual or unbiased output.",
    "historical",
    ["INVEST_DATA_QUALITY", "selector:breakthroughs"],
    ["gpt3"],
  ),
  3: breakthrough(
    3,
    "Massive Parameter Scaling",
    "The GPT-3 paper studied a 175-billion-parameter model. Larger size improved several evaluations, but not every task. Game resource levels are not parameter counts.",
    "historical",
    ["INVEST_COMPUTE", "selector:breakthroughs"],
    ["gpt3"],
  ),
  4: breakthrough(
    4,
    "Few-Shot Learning",
    "In GPT-3's few-shot evaluations, task examples appeared in the prompt without weight updates. Prompt examples are different from retraining a model.",
    "historical",
    ["INVEST_DATA_QUALITY", "INVEST_ALGORITHM_ARCHITECTURE"],
    ["gpt3"],
  ),
  5: breakthrough(
    5,
    "Instruction Tuning",
    "InstructGPT's human-feedback training improved measured preferences and some truthfulness results on the study's prompts. The models still made mistakes; feedback is not a safety guarantee.",
    "historical",
    ["INVEST_ALGORITHM_ARCHITECTURE", "UPGRADE_CHATBOT"],
    ["instruct"],
  ),
  6: breakthrough(
    6,
    "Multimodal Integration",
    "The GPT-4 report describes image-and-text inputs with text outputs, alongside important limitations. It does not disclose model size or training compute. GNT-4 is not GPT-4.",
    "historical",
    ["INVEST_DATA_FORMATS", "INVEST_COMPUTE"],
    ["gpt4"],
  ),
  7: breakthrough(
    7,
    "Advanced Reasoning",
    "A speculative game upgrade explores reasoning-related product value. Better results on selected tasks would not establish general human-like understanding.",
    "speculative",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_DATA_QUALITY"],
  ),
  8: breakthrough(
    8,
    "Self-Improvement Capabilities",
    "This speculative upgrade represents an efficiency benefit. It does not demonstrate a system that improves itself safely or without human evaluation.",
    "speculative",
    ["INVEST_ALGORITHM_ARCHITECTURE", "selector:breakthroughs"],
  ),
  9: breakthrough(
    9,
    "Advanced Tool Use",
    "This speculative scenario assigns value to tool-using products. Access to tools can also create new failure paths; the unlock is not proof of safe autonomous action.",
    "speculative",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_COMPUTE", "selector:resilience"],
  ),
  10: breakthrough(
    10,
    "General Problem Solving",
    "This is a speculative game milestone. Its name and revenue effects are not evidence of real general intelligence or competence across every domain.",
    "speculative",
    ["selector:breakthroughs", "selector:completion"],
  ),
  11: breakthrough(
    11,
    "Continuous Learning & Live Personalization",
    "This speculative product upgrade explores retention. Learning from users does not automatically preserve privacy, and this game collects no training conversations.",
    "speculative",
    ["INVEST_DATA_QUALITY", "INVEST_ALGORITHM_ARCHITECTURE", "selector:churn"],
  ),
  12: breakthrough(
    12,
    "Neuro-Symbolic Reasoning",
    "A speculative game upgrade combines pattern-based and rule-based methods. A formal guarantee applies only to stated assumptions and properties, not every answer or deployment.",
    "speculative",
    [
      "INVEST_ALGORITHM_ARCHITECTURE",
      "INVEST_DATA_FORMATS",
      "selector:resilience",
    ],
  ),
  13: breakthrough(
    13,
    "World Models for Planning",
    "This speculative upgrade imagines testing plans in a learned model. A simulation can be wrong; success inside one does not establish safety in the real world.",
    "speculative",
    ["INVEST_COMPUTE", "INVEST_DATA_FORMATS", "selector:resilience"],
  ),
  14: breakthrough(
    14,
    "Verified Self-Improvement",
    "This is a speculative scenario label, not an achieved guarantee. No upgrade here proves that arbitrary self-changes are beneficial or risk-free.",
    "speculative",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_COMPUTE", "selector:resilience"],
  ),
  15: breakthrough(
    15,
    "Agentic Autonomy & Orchestration",
    "This speculative product milestone explores coordinating multiple systems. Coordination has costs and does not guarantee that systems will catch one another's errors.",
    "speculative",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_COMPUTE", "selector:capacity"],
  ),
  16: breakthrough(
    16,
    "Chain-of-Thought Reasoning",
    "The historical prompting study improved selected reasoning benchmarks using intermediate steps. This GNT-5 application is speculative: such text is not proof of human-like thought or a correct answer.",
    "speculative",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_COMPUTE"],
    ["chainOfThought"],
  ),
  17: breakthrough(
    17,
    "Reinforcement Learning Training",
    "InstructGPT used a learned reward signal from ranked responses during reinforcement learning. Optimizing that signal improved some measured behavior, not all possible outcomes.",
    "historical",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_DATA_QUALITY"],
    ["instruct"],
  ),
  18: breakthrough(
    18,
    "Next-Generation Computing Hardware",
    "This speculative scenario assigns a hardware efficiency benefit. Its cost and capacity multipliers are invented game rules, not claims about a vendor's chips.",
    "speculative",
    ["INVEST_HARDWARE", "INVEST_COMPUTE"],
  ),
  19: breakthrough(
    19,
    "AI-Generated Training Data",
    "This speculative upgrade is inspired by phi-1's use of selected and generated coding data. Other research found degradation in recursive generated-data training. Benefits depend on selection, mixture, and evaluation; generation does not create guaranteed truth.",
    "speculative",
    ["INVEST_DATA_QUALITY", "INVEST_ALGORITHM_ARCHITECTURE"],
    ["synthetic", "syntheticRisk"],
  ),
  20: breakthrough(
    20,
    "AI Team Coordination",
    "This speculative upgrade explores specialization versus coordination overhead. Multiple assistants can share mistakes; extra systems are not automatically more reliable.",
    "speculative",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_COMPUTE", "selector:capacity"],
  ),
  21: breakthrough(
    21,
    "Pocket-Sized AI",
    "This speculative game upgrade rewards efficiency. Local processing can reduce cloud transfer, but does not by itself guarantee privacy, security, instant answers, or offline support in every product.",
    "speculative",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_DATA_QUALITY"],
  ),
};

export const resourceLearning = {
  compute: claim(
    "resource-compute",
    "Compute is the processing work used in training and serving models. Here it is a shared game budget; available capacity matters more than a utilization percentage alone.",
    "simulation",
    ["INVEST_COMPUTE", "selector:capacity", "selector:shortfall"],
  ),
  data: claim(
    "resource-data",
    "Data choice and model size both affect how a fixed training budget is used. Chinchilla tested this trade-off; more parameters alone were not best on its evaluations.",
    "historical",
    ["INVEST_DATA_QUALITY", "INVEST_DATA_QUANTITY"],
    ["chinchilla"],
  ),
  algorithm: claim(
    "resource-algorithm",
    "Architecture and training methods affect what a model can do. The Transformer paper is one historical example; the game's research level compresses that work into a simplified investment.",
    "historical",
    ["INVEST_ALGORITHM_ARCHITECTURE", "HIRE_RESEARCH_ENGINEER"],
    ["transformer"],
  ),
} satisfies Record<string, LearningClaim>;

export function sourceTitle(url: string): string {
  return (
    Object.values(learningSources).find((source) => source.url === url)
      ?.title ?? "Primary source"
  );
}
