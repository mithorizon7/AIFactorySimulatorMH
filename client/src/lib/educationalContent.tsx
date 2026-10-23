import { Era } from "@shared/game/domain/era";
import {
  CONTENT_REVIEW_DATE,
  eraLearning,
  learningClaimSchema,
  resourceLearning,
  type LearningClaim,
  type LinkedMechanic,
} from "./learningContent";

// Compatibility shape for the existing resource tooltips. Real-world claims
// stay in the reviewed lesson; invented mechanics are explicitly labeled.
function tip(title: string, lesson: LearningClaim) {
  return {
    title,
    description: lesson.text,
    realWorldExample: lesson.uncertaintyLabel,
    industryImpact: "Game numbers are illustrative, not real-world forecasts.",
    lesson,
  };
}

function simulationTip(
  id: string,
  title: string,
  text: string,
  linkedMechanics: LinkedMechanic[],
) {
  return tip(
    title,
    learningClaimSchema.parse({
      id,
      text,
      sourceUrls: [],
      reviewedAt: CONTENT_REVIEW_DATE,
      claimType: "simulation",
      uncertaintyLabel: "Simplified game rule — not a real-world estimate",
      linkedMechanics,
    }),
  );
}

export const resourceDefinitions = {
  compute: tip("Compute and capacity", resourceLearning.compute),
  data: tip("Training data", resourceLearning.data),
  algorithm: tip("Algorithms and research", resourceLearning.algorithm),
};

export const enablingInputs = {
  money: simulationTip(
    "input-money",
    "Funding",
    "Cash pays for infrastructure, research, platforms, and training in this game. Funding amounts and revenue rates do not reproduce any real company's finances.",
    ["selector:allocation", "START_TRAINING"],
  ),
  electricity: simulationTip(
    "input-electricity",
    "Power infrastructure",
    "Electricity is a training prerequisite here. The levels are invented and do not estimate energy consumption or household equivalence.",
    ["INVEST_ELECTRICITY", "selector:training-readiness"],
  ),
  hardware: simulationTip(
    "input-hardware",
    "Hardware infrastructure",
    "Hardware upgrades satisfy listed prerequisites. A game level is not a chip benchmark or a specific real device.",
    ["INVEST_HARDWARE", "selector:training-readiness"],
  ),
  regulation: simulationTip(
    "input-regulation",
    "Governance and resilience",
    "This investment is a simplified governance/resilience input. It does not prove legal compliance, remove every risk, or certify a model as safe.",
    ["INVEST_REGULATION", "selector:resilience"],
  ),
  quality: simulationTip(
    "input-quality",
    "Data quality",
    "Data-quality upgrades satisfy game requirements and affect progress. Quality levels do not guarantee truthful, fair, or secure model behavior.",
    ["INVEST_DATA_QUALITY", "selector:training-readiness"],
  ),
  quantity: simulationTip(
    "input-quantity",
    "Data quantity",
    "Quantity and quality are separate game investments. More data is not automatically the best use of your next dollar.",
    ["INVEST_DATA_QUANTITY", "INVEST_DATA_QUALITY"],
  ),
  formats: simulationTip(
    "input-formats",
    "Data formats",
    "Format upgrades represent a broader range of inputs within the scenario. The unlock does not demonstrate real perception or reliable understanding.",
    ["INVEST_DATA_FORMATS", "selector:training-readiness"],
  ),
  architectures: simulationTip(
    "input-architecture",
    "Model architectures",
    "Architecture upgrades and researcher hiring are separate game choices. Research is compressed into progress and levels rather than real experiments.",
    ["INVEST_ALGORITHM_ARCHITECTURE", "HIRE_RESEARCH_ENGINEER"],
  ),
};

function eraTip(era: Era) {
  const entry = eraLearning[era];
  return {
    ...tip(entry.title, entry.lesson),
    realWorldParallel: entry.lesson.text,
    technicalSignificance: entry.tension,
    speculativeDevelopments: entry.lesson.text,
    potentialImpact:
      "Speculative scenario, not a prediction of future AI capabilities.",
  };
}
export const eraEducationalContent = {
  GNT2: eraTip(Era.GNT2),
  GNT3: eraTip(Era.GNT3),
  GNT4: eraTip(Era.GNT4),
  GNT5: eraTip(Era.GNT5),
  GNT6: eraTip(Era.GNT6),
  GNT7: eraTip(Era.GNT7),
};

export const synergyEffects = {
  computeToData: simulationTip(
    "synergy-compute-data",
    "Compute and data processing",
    "The game's compute-to-data bonus represents processing capacity. Its multiplier is illustrative, not an estimate of real curation performance.",
    ["INVEST_COMPUTE", "INVEST_DATA_QUALITY"],
  ),
  computeToAlgorithm: simulationTip(
    "synergy-compute-algorithm",
    "Compute and experiments",
    "The game's compute-to-research bonus compresses experimentation into a resource multiplier. It is not a guarantee of scientific discoveries.",
    ["INVEST_COMPUTE", "INVEST_ALGORITHM_ARCHITECTURE"],
  ),
  computeToIntelligence: simulationTip(
    "synergy-compute-capability",
    "Compute and Model Capability",
    "Compute contributes to synthetic Model Capability in the game. More compute does not establish general intelligence or guarantee better real-world results.",
    ["INVEST_COMPUTE", "selector:completion"],
  ),
  dataToCompute: simulationTip(
    "synergy-data-compute",
    "Data and efficiency",
    "The game gives data investment an efficiency effect. The size of that bonus is invented; check the next blocker before assuming it beats more infrastructure.",
    ["INVEST_DATA_QUALITY", "selector:capacity"],
  ),
  dataToAlgorithm: simulationTip(
    "synergy-data-algorithm",
    "Data and research",
    "The game's data-to-research multiplier represents interaction between investments. It does not claim a universal causal relationship or optimal allocation.",
    ["INVEST_DATA_FORMATS", "INVEST_ALGORITHM_ARCHITECTURE"],
  ),
  dataToIntelligence: simulationTip(
    "synergy-data-capability",
    "Data and Model Capability",
    "Data contributes to the game's synthetic Model Capability. This score does not measure knowledge, fairness, or reliability on real tasks.",
    ["INVEST_DATA_QUALITY", "INVEST_DATA_QUANTITY", "selector:completion"],
  ),
  algorithmToCompute: simulationTip(
    "synergy-algorithm-compute",
    "Research and compute efficiency",
    "Algorithm research can change resource efficiency in the game. The multiplier is not a benchmark for a real training method.",
    ["INVEST_ALGORITHM_ARCHITECTURE", "selector:capacity"],
  ),
  algorithmToData: simulationTip(
    "synergy-algorithm-data",
    "Research and data use",
    "The game links research to data efficiency. This is a simplified interaction, not a promise that an algorithm can replace representative data.",
    ["INVEST_ALGORITHM_ARCHITECTURE", "INVEST_DATA_QUALITY"],
  ),
  algorithmToIntelligence: simulationTip(
    "synergy-algorithm-capability",
    "Research and Model Capability",
    "Research contributes to synthetic Model Capability. A game breakthrough is not proof of real reasoning, safe autonomy, or AGI.",
    [
      "INVEST_ALGORITHM_ARCHITECTURE",
      "selector:breakthroughs",
      "selector:completion",
    ],
  ),
};
