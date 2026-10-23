import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getTrainingRequirementDetails,
  getUpcomingTrainingRun,
  type GameStateType,
} from "@/lib/gameState";
import { getRunGuidance } from "@shared/game/guidance";
import type { GameStateV2 } from "@shared/game/schemas/state";
import { eraLearning } from "@/lib/learningContent";
import LearningClaim from "./LearningClaim";

export function TrainingTab({
  gameState,
  simulation,
  onStartTraining,
}: {
  gameState: GameStateType;
  simulation: GameStateV2;
  onStartTraining: () => void;
}) {
  const guidance = getRunGuidance(simulation);
  const nextRun = getUpcomingTrainingRun(gameState);
  const requirements = getTrainingRequirementDetails(
    gameState,
    guidance.training.targetEra,
  );
  const learning =
    eraLearning[guidance.training.targetEra ?? simulation.currentEra];
  const progress =
    nextRun && gameState.training.active
      ? ((nextRun.daysRequired - gameState.training.daysRemaining) /
          nextRun.daysRequired) *
        100
      : 0;
  return (
    <section className="space-y-5" data-testid="training-tab">
      <div className="rounded-lg border border-teal-800 bg-gray-900 p-5">
        <h2 className="text-2xl font-semibold text-amber-200">
          {gameState.training.active
            ? "Training in progress"
            : guidance.training.targetEra
              ? `Prepare ${guidance.training.targetEra} training`
              : "Final training ladder complete"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-200">
          {guidance.reason}
        </p>
        {gameState.training.active ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-teal-200">
              {gameState.training.daysRemaining} simulation ticks remaining ·{" "}
              {gameState.training.computeReserved.toLocaleString()} compute
              reserved
            </p>
            <Progress
              value={progress}
              aria-label="Training progress"
              className="h-3"
            />
          </div>
        ) : guidance.training.targetEra ? (
          <>
            <Button
              onClick={onStartTraining}
              disabled={!guidance.training.ready}
              data-testid="start-training-button"
              className="mt-4 h-auto min-h-11 whitespace-normal bg-teal-800 px-5 py-3 text-white hover:bg-teal-700"
            >
              Start Training Run · $
              {guidance.training.cost?.toLocaleString() ?? "—"}
            </Button>
            <p className="mt-3 text-sm text-amber-200">
              {guidance.blocker ??
                "No blockers. This action commits the training budget and reserves compute until completion."}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-teal-200">
            Continue toward the scenario's Model Capability threshold. This
            synthetic measure is not a real-world intelligence benchmark.
          </p>
        )}
      </div>
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-5">
        <h2 className="text-xl font-semibold text-white">
          Training Prerequisites
        </h2>
        {guidance.training.targetEra ? (
          <>
            <p className="mt-2 text-sm text-gray-300">
              Engine-checked budget: $
              {guidance.training.cost?.toLocaleString() ?? "—"} · available
              compute required:{" "}
              {guidance.training.computeRequired?.toLocaleString() ?? "—"}
              {nextRun
                ? ` · duration: ${nextRun.daysRequired} simulation ticks`
                : ""}
            </p>
            <dl className="mt-4 space-y-2">
              {requirements.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-wrap justify-between gap-2 rounded border border-gray-700 p-3"
                  data-testid={`prereq-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <dt className="text-sm text-gray-200">{item.label}</dt>
                  <dd
                    className={`text-sm font-medium ${item.met ? "text-teal-200" : "text-amber-200"}`}
                  >
                    {item.current.toLocaleString()}
                    {item.isPercentage ? "%" : ""} /{" "}
                    {item.required.toLocaleString()}
                    {item.isPercentage ? "%" : ""} ·{" "}
                    {item.met ? "Met" : "Needed"}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-300">
            All five era training runs are complete.
          </p>
        )}
      </div>
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-5">
        <h2 className="mb-3 text-lg font-semibold text-teal-200">
          Learning context · {learning.era}
        </h2>
        <LearningClaim claim={learning.lesson} />
      </div>
    </section>
  );
}
