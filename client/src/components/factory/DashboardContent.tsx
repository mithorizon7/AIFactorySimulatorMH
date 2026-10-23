import type { GameStateType } from "@/lib/gameState";
import type { GameTab } from "@shared/experience/schemas";
import { Button } from "@/components/ui/button";

export default function DashboardContent({
  gameState,
  setActiveTab,
}: {
  gameState: GameStateType;
  setActiveTab: (tab: GameTab) => void;
}) {
  const resources = [
    {
      id: "compute",
      name: "Compute",
      level: gameState.levels.compute,
      value: gameState.resources.compute,
      detail: "Infrastructure shared by training and live services.",
    },
    {
      id: "data",
      name: "Data",
      level: gameState.levels.data,
      value: gameState.resources.data,
      detail: "Examples and preparation used by training.",
    },
    {
      id: "algorithm",
      name: "Algorithms",
      level: gameState.levels.algorithm,
      value: gameState.resources.algorithm,
      detail: "Research methods that support model development.",
    },
  ];
  return (
    <div className="space-y-5">
      <section
        className="rounded-lg border border-gray-700 bg-gray-900 p-5"
        aria-labelledby="scenario-progress"
      >
        <h2
          id="scenario-progress"
          className="text-xl font-semibold text-amber-300"
        >
          Scenario Progress
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          {gameState.currentEra} · Model Capability{" "}
          {gameState.intelligence.toFixed(2)} / {gameState.agiThreshold}.
          Training advances eras; the final threshold completes this fictional
          scenario.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric
            label="Available funds"
            value={`$${gameState.money.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
            testId="financial-overview"
          />
          <Metric
            label="Earned service revenue per tick"
            value={`$${(gameState.revenue.b2b + gameState.revenue.b2c).toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
          />
          <Metric
            label="Available compute"
            value={`${gameState.computeCapacity.available.toLocaleString()} / ${gameState.computeCapacity.maxCapacity.toLocaleString()}`}
          />
        </div>
      </section>
      <section
        className="rounded-lg border border-gray-700 bg-gray-900 p-5"
        aria-labelledby="resource-overview"
      >
        <h2
          id="resource-overview"
          className="text-xl font-semibold text-teal-200"
        >
          Resource Overview
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {resources.map((resource) => (
            <div
              key={resource.id}
              data-testid={`${resource.id}-overview`}
              className="rounded-lg border border-gray-700 bg-gray-800/60 p-4"
            >
              <h3 className="font-semibold text-white">
                {resource.name} · Level {resource.level}
              </h3>
              <p className="mt-2 text-xl text-teal-200">
                {resource.value.toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-300">
                {resource.detail}
              </p>
            </div>
          ))}
        </div>
        <Button
          onClick={() => setActiveTab("resources")}
          className="mt-4 min-h-11 bg-teal-800 text-white hover:bg-teal-700"
        >
          Review investments
        </Button>
      </section>
      <section className="rounded-lg border border-gray-700 bg-gray-900 p-5">
        <h2 className="text-lg font-semibold text-white">
          Read the trade-off, then choose
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          The objective above uses the same requirements as the engine. Keep a
          cash reserve, compare training needs with service demand, and review
          what happened in Journey.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="min-h-11 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
            onClick={() => setActiveTab("training")}
          >
            Review training requirements
          </Button>
          <Button
            variant="outline"
            className="min-h-11 border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
            onClick={() => setActiveTab("journey")}
          >
            Open Journey
          </Button>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <div
      className="min-w-0 rounded-lg border border-gray-700 bg-gray-800 p-3"
      data-testid={testId}
    >
      <p className="text-sm text-gray-300">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold text-teal-200">
        {value}
      </p>
    </div>
  );
}
