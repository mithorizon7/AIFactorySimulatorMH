import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  CALIBRATION_SEEDS,
  RELEASE_B_POLICIES,
  dominates,
  simulatePolicy,
  type SimulationRow,
} from "../tests/unit/game/release-b-policies";

const rows: SimulationRow[] = [];
for (const seed of CALIBRATION_SEEDS) {
  for (const policy of RELEASE_B_POLICIES)
    rows.push(simulatePolicy(seed, policy));
  console.log(
    `Completed seed ${seed}: ${RELEASE_B_POLICIES.length} scripted policies`,
  );
}
const dominance = RELEASE_B_POLICIES.flatMap((policy) =>
  RELEASE_B_POLICIES.filter((other) => other !== policy).map((other) => ({
    policy,
    other,
    seeds: CALIBRATION_SEEDS.filter((seed) =>
      dominates(
        rows.find((row) => row.seed === seed && row.policy === policy)!,
        rows.find((row) => row.seed === seed && row.policy === other)!,
      ),
    ).length,
    total: CALIBRATION_SEEDS.length,
  })),
);
const report = {
  rulesetVersion: "release-b.1",
  corpusVersion: "release-b-seeds.1",
  evidenceKind: "scripted simulation, not human playtest or scoring validation",
  metricDirections: {
    activeTicks: "lower",
    firstTrainingTick: "lower",
    finalCapability: "higher",
    spend: "lower",
    revenue: "higher",
    meanShortfall: "lower",
    interventions: "lower",
  },
  scoring: {
    scoreAlgorithmVersion: null,
    profileClassifierVersion: null,
    humanComprehensionEvidence: false,
  },
  gates: {
    allComplete: rows.every((row) => row.completed),
    runPacing1200to1800: rows.every(
      (row) => row.activeTicks >= 1200 && row.activeTicks <= 1800,
    ),
    firstTraining360to480: rows.every(
      (row) =>
        row.firstTrainingTick !== null &&
        row.firstTrainingTick >= 360 &&
        row.firstTrainingTick <= 480,
    ),
    pairwiseDominanceAtMost70Percent: dominance.every(
      (pair) => pair.seeds / pair.total <= 0.7,
    ),
  },
  seeds: CALIBRATION_SEEDS,
  dominance,
  rows,
};
const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0) {
  const output = process.argv[outputIndex + 1];
  if (!output) throw new Error("--output requires a path");
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(
  JSON.stringify({
    gates: report.gates,
    maximumPairwiseDominance: Math.max(
      ...dominance.map((pair) => pair.seeds / pair.total),
    ),
    runs: rows.length,
  }),
);
if (Object.values(report.gates).some((passed) => !passed)) process.exitCode = 1;
