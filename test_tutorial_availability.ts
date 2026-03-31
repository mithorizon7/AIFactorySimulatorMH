#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { tutorialContent, tutorialTargetAvailability } from "./client/src/lib/narrativeContent.ts";

type TutorialPhaseKey = keyof typeof tutorialContent;

const repoRoot = process.cwd();
const uiFiles = [
  "client/src/components/factory/MainGameTabs.tsx",
  "client/src/components/factory/FactorySection.tsx",
  "client/src/components/factory/TrainingTab.tsx",
];

const tutorialIdsInCode = new Set<string>();

for (const relativePath of uiFiles) {
  const filePath = path.join(repoRoot, relativePath);
  const fileContents = fs.readFileSync(filePath, "utf8");

  for (const match of fileContents.matchAll(/data-tutorial-id="([^"]+)"/g)) {
    tutorialIdsInCode.add(match[1]);
  }
}

const errors: string[] = [];
const stepTargets: Array<{ key: string; targetElement: string }> = [];

for (const phaseKey of Object.keys(tutorialContent) as TutorialPhaseKey[]) {
  const phaseSteps = tutorialContent[phaseKey];

  for (const stepNumber of Object.keys(phaseSteps)) {
    const numericStep = Number(stepNumber);
    const step = phaseSteps[numericStep];

    if (step.modalStyle || !step.targetElement) {
      continue;
    }

    const stepKey = `${phaseKey}.${numericStep}`;
    stepTargets.push({ key: stepKey, targetElement: step.targetElement });

    if (!(step.targetElement in tutorialTargetAvailability)) {
      errors.push(`${stepKey} points to unknown tutorial target "${step.targetElement}".`);
    }

    if (!tutorialIdsInCode.has(step.targetElement)) {
      errors.push(`${stepKey} points to "${step.targetElement}", but no rendered UI element exposes that data-tutorial-id.`);
    }
  }
}

for (const tutorialTargetId of Object.keys(tutorialTargetAvailability)) {
  if (!tutorialIdsInCode.has(tutorialTargetId)) {
    errors.push(`Tutorial target catalog entry "${tutorialTargetId}" does not exist in the current UI markup.`);
  }
}

const expectedStepRequirements = {
  "PHASE_2.1": { targetElement: "compute-advanced-toggle", visibleTab: "resources" },
  "PHASE_2.2": { targetElement: "compute-level-upgrade", visibleTab: "resources", expandedAccordion: "compute" },
  "PHASE_2.3": { targetElement: "data-advanced-toggle", visibleTab: "resources" },
  "PHASE_2.4": { targetElement: "data-quality-upgrade", visibleTab: "resources", expandedAccordion: "data" },
  "PHASE_2.5": { targetElement: "algorithm-advanced-toggle", visibleTab: "resources" },
  "PHASE_2.6": { targetElement: "algorithm-architecture-upgrade", visibleTab: "resources", expandedAccordion: "algorithm" },
  "PHASE_4.2": { targetElement: "training-panel", visibleTab: "training" },
} as const;

for (const [stepKey, expected] of Object.entries(expectedStepRequirements)) {
  const [phaseKey, stepNumber] = stepKey.split(".");
  const step = tutorialContent[phaseKey as TutorialPhaseKey]?.[Number(stepNumber)];

  if (!step) {
    errors.push(`Expected tutorial step ${stepKey} is missing.`);
    continue;
  }

  if (step.targetElement !== expected.targetElement) {
    errors.push(`${stepKey} should target "${expected.targetElement}", but currently targets "${step.targetElement}".`);
    continue;
  }

  const availability = tutorialTargetAvailability[step.targetElement];

  if (availability.visibleTab !== expected.visibleTab) {
    errors.push(`${stepKey} should require visible tab "${expected.visibleTab}", but current requirement is "${availability.visibleTab ?? "none"}".`);
  }

  if ("expandedAccordion" in expected && availability.expandedAccordion !== expected.expandedAccordion) {
    errors.push(`${stepKey} should require expanded accordion "${expected.expandedAccordion}", but current requirement is "${availability.expandedAccordion ?? "none"}".`);
  }
}

if (tutorialContent.PHASE_1[1].content.includes("Start Game")) {
  errors.push("PHASE_1.1 still tells the player to click Start Game even though the tutorial begins with Continue-only modal steps.");
}

if (errors.length > 0) {
  console.error("Tutorial availability audit failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Tutorial availability audit passed for ${stepTargets.length} interactive tutorial steps.`);
console.log(`Verified ${tutorialIdsInCode.size} tutorial targets across ${uiFiles.length} UI files.`);
