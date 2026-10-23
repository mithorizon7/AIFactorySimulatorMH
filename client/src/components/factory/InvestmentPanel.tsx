import { Button } from "@/components/ui/button";
import { inspectCommand } from "@shared/game/engine";
import type { GameStateV2 } from "@shared/game/schemas/state";
import type { GameCommandIntent } from "@shared/game/schemas/commands";
import { resourceLearning } from "@/lib/learningContent";
import LearningClaim from "./LearningClaim";
import { commandReasonLabel } from "@/lib/experiencePresentation";

const groups: {
  id: "compute" | "data" | "algorithm";
  title: string;
  actions: { label: string; type: GameCommandIntent["type"]; testId: string }[];
}[] = [
  {
    id: "compute",
    title: "Compute infrastructure",
    actions: [
      {
        label: "Invest in compute",
        type: "INVEST_COMPUTE",
        testId: "compute-level-upgrade",
      },
      {
        label: "Improve electricity",
        type: "INVEST_ELECTRICITY",
        testId: "electricity-upgrade",
      },
      {
        label: "Upgrade hardware",
        type: "INVEST_HARDWARE",
        testId: "hardware-upgrade",
      },
      {
        label: "Invest in governance / resilience",
        type: "INVEST_REGULATION",
        testId: "regulation-upgrade",
      },
    ],
  },
  {
    id: "data",
    title: "Data preparation",
    actions: [
      {
        label: "Improve data quality",
        type: "INVEST_DATA_QUALITY",
        testId: "data-quality-upgrade",
      },
      {
        label: "Expand data quantity",
        type: "INVEST_DATA_QUANTITY",
        testId: "data-quantity-upgrade",
      },
      {
        label: "Add data formats",
        type: "INVEST_DATA_FORMATS",
        testId: "data-formats-upgrade",
      },
    ],
  },
  {
    id: "algorithm",
    title: "Algorithm research",
    actions: [
      {
        label: "Research model architecture",
        type: "INVEST_ALGORITHM_ARCHITECTURE",
        testId: "algorithm-architecture-upgrade",
      },
      {
        label: "Hire a research engineer",
        type: "HIRE_RESEARCH_ENGINEER",
        testId: "hire-research-engineer",
      },
    ],
  },
];

export default function InvestmentPanel({
  simulation,
  onCommand,
}: {
  simulation: GameStateV2;
  onCommand: (intent: GameCommandIntent) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-amber-200">
        Invest in your lab
      </h2>
      <p className="text-sm text-gray-300">
        Each purchase changes this run immediately. Compare the objective and
        keep the training budget in view.
      </p>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <section
            key={group.id}
            className="min-w-0 rounded-lg border border-gray-700 bg-gray-900 p-4"
            data-tutorial-id={`${group.id}-factory-card`}
          >
            <h3 className="text-lg font-semibold text-teal-200">
              {group.title} · Level {simulation.levels[group.id]}
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              Resource{" "}
              {simulation.resources[group.id].toLocaleString(undefined, {
                maximumFractionDigits: 3,
              })}{" "}
              · production{" "}
              {simulation.production[group.id].toLocaleString(undefined, {
                maximumFractionDigits: 3,
              })}
              /tick
            </p>
            <div className="my-4 space-y-3">
              {group.actions.map((action) => {
                const intent = {
                  type: action.type,
                  payload: {},
                } as GameCommandIntent;
                const inspection = inspectCommand(simulation, intent);
                return (
                  <div key={action.type}>
                    <Button
                      data-game-command={action.type}
                      data-tutorial-id={action.testId}
                      data-testid={`investment-${action.type}`}
                      disabled={!inspection.enabled}
                      onClick={() => onCommand(intent)}
                      className="h-auto min-h-11 w-full whitespace-normal bg-teal-800 px-3 py-3 text-white hover:bg-teal-700"
                    >
                      {action.label}
                      {inspection.cost !== null
                        ? ` · $${inspection.cost.toLocaleString()}`
                        : ""}
                    </Button>
                    {inspection.reason && (
                      <p className="mt-1 text-xs leading-relaxed text-amber-200">
                        {commandReasonLabel(inspection.reason)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <LearningClaim claim={resourceLearning[group.id]} />
          </section>
        ))}
      </div>
    </section>
  );
}
