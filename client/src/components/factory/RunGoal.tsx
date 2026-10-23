import { Button } from "@/components/ui/button";
import { eraLearning } from "@/lib/learningContent";
import { getRunGuidance, type GuidanceAction } from "@shared/game/guidance";
import type { GameStateV2 } from "@shared/game/schemas/state";
import type { GameCommandIntent } from "@shared/game/schemas/commands";
import type { GameTab } from "@shared/experience/schemas";
import { commandReasonLabel } from "@/lib/experiencePresentation";

interface RunGoalProps {
  simulation: GameStateV2;
  practice: boolean;
  onCommand: (intent: GameCommandIntent) => void;
  onNavigate: (tab: GameTab) => void;
  onSkipPractice: () => void;
}

export default function RunGoal({
  simulation,
  practice,
  onCommand,
  onNavigate,
  onSkipPractice,
}: RunGoalProps) {
  const guidance = getRunGuidance(simulation);
  const learning = eraLearning[simulation.currentEra];
  const primaryActions = guidance.actions
    .filter((action) => action.enabled)
    .slice(0, 3);
  const readyTraining = guidance.actions.find(
    (action) => action.enabled && action.command?.type === "START_TRAINING",
  );
  if (readyTraining && !primaryActions.includes(readyTraining))
    primaryActions[2] = readyTraining;
  const otherActions = guidance.actions.filter(
    (action) => !primaryActions.includes(action),
  );
  return (
    <section
      aria-labelledby="run-goal-title"
      data-testid="run-goal"
      className="mb-5 rounded-lg border border-amber-600/60 bg-gray-900 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
            {practice
              ? "GNT-2 · learn by doing"
              : `${simulation.currentEra} · lab objective`}
          </p>
          <h2
            id="run-goal-title"
            className="mt-1 text-xl font-semibold text-amber-200"
          >
            {guidance.goal}
          </h2>
        </div>
        {practice && (
          <Button
            onClick={onSkipPractice}
            variant="ghost"
            className="min-h-11 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Hide practice guidance
          </Button>
        )}
      </div>
      <p className="mt-3 text-sm text-gray-200" data-testid="run-blocker">
        <span className="font-semibold text-amber-300">Current blocker: </span>
        {guidance.blocker ?? "None — your next action is ready."}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">
        <span className="font-semibold text-gray-200">Why it matters: </span>
        {guidance.reason}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-teal-200">
        Era tension: {learning.tension}
      </p>
      <div
        className="mt-4 grid gap-2 sm:flex sm:flex-wrap"
        aria-label="Viable next choices"
      >
        {primaryActions.map((action) => (
          <GoalAction
            key={action.id}
            action={action}
            onCommand={onCommand}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      {otherActions.length > 0 && (
        <details className="mt-2">
          <summary className="min-h-11 cursor-pointer py-3 text-sm text-teal-200">
            All choices and requirements ({otherActions.length} more)
          </summary>
          <div className="grid gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-3">
            {otherActions.map((action) => (
              <GoalAction
                key={action.id}
                action={action}
                onCommand={onCommand}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </details>
      )}
      {practice && (
        <p className="mt-3 text-xs leading-relaxed text-gray-400">
          Try a real investment, inspect its effect, then train when the
          engine-checked requirements are met. This guidance never locks
          navigation or pauses the lab.
        </p>
      )}
    </section>
  );
}

function GoalAction({
  action,
  onCommand,
  onNavigate,
}: {
  action: GuidanceAction;
  onCommand: RunGoalProps["onCommand"];
  onNavigate: RunGoalProps["onNavigate"];
}) {
  return (
    <div className="min-w-0 sm:max-w-xs">
      <Button
        data-testid={`goal-action-${action.id}`}
        disabled={!action.enabled}
        onClick={() => {
          if (action.command) onCommand(action.command);
          else if (action.tab) onNavigate(action.tab as GameTab);
        }}
        className="h-auto min-h-11 w-full whitespace-normal bg-teal-800 px-4 py-3 text-left text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {action.label}
        {action.cost !== null && action.cost > 0
          ? ` · $${action.cost.toLocaleString()}`
          : ""}
      </Button>
      {action.reason && (
        <p className="mt-1 px-1 text-xs leading-relaxed text-gray-400">
          {commandReasonLabel(action.reason)}
        </p>
      )}
    </div>
  );
}
