import type { ExperienceStateV1 } from "@shared/experience/schemas";
import type { GameStateV2 } from "@shared/game/schemas/state";
import { Era } from "@/lib/gameState";
import { narrative } from "@/lib/narrativeContent";
import { breakthroughLearning, eraLearning } from "@/lib/learningContent";
import { Button } from "@/components/ui/button";
import LearningClaim from "./LearningClaim";
import {
  CUSTOMER_LOSS_MESSAGE,
  trainingPrerequisiteNotice,
} from "@/lib/experiencePresentation";

export default function SparkMessageQueue({
  experience,
  simulation,
  writable,
  onDismiss,
}: {
  experience: ExperienceStateV1;
  simulation: GameStateV2;
  writable: boolean;
  onDismiss: (messageId: string) => void;
}) {
  const available = experience.queuedMessages.filter(
    (item) => item.availableAtTick <= simulation.clock.activeTick,
  );
  const message = available[0];
  if (!message) return null;
  const [type, key, amount, emergency] = message.messageId.split(":");
  let title = "Lab update";
  let text =
    "Review your current objective and choose the next action that fits your lab.";
  let claim;
  let reflection;
  if (type === "breakthrough") {
    const content = breakthroughLearning[Number(key)];
    title = content
      ? `Breakthrough · ${content.title}`
      : "Breakthrough unlocked";
    claim = content?.lesson;
    text =
      "A new milestone is available in Journey. Era advancement still requires training.";
  } else if (type === "training-completed") {
    title = `${key} training complete`;
    const previousEra: Partial<Record<Era, Era>> = {
      [Era.GNT3]: Era.GNT2,
      [Era.GNT4]: Era.GNT3,
      [Era.GNT5]: Era.GNT4,
      [Era.GNT6]: Era.GNT5,
      [Era.GNT7]: Era.GNT6,
    };
    const learning = eraLearning[previousEra[key as Era] ?? (key as Era)];
    text = `Your lab reached ${key}. Take a moment to reflect on the era you just completed.`;
    reflection = learning?.reflection;
    claim = learning?.lesson;
  } else if (type === "training-ready") {
    ({ title, text } = trainingPrerequisiteNotice(key));
  } else if (type === "training-started") {
    title = `${key} training started`;
    text =
      "Training reserves compute until completion. You can keep managing the lab; this message does not pause the run.";
  } else if (type === "funding") {
    title =
      emergency === "1" ? "Recovery · continuity funding" : "Funding received";
    text = `$${Number(amount).toLocaleString()} was added by the simulation's ${key.replaceAll("_", " ")} rule. This is external funding, not earned service revenue. Review the objective before reinvesting.`;
  } else if (type === "capacity") {
    title = "Recovery choice · compute shortfall";
    text =
      "Demand exceeded available compute. Consider expanding capacity, improving efficiency, or disabling a service to free training headroom. Check the visible choices; high utilization alone is not a failure.";
  } else if (type === "customers") {
    title = "Service customers left";
    text = CUSTOMER_LOSS_MESSAGE;
  } else if (type === "event") {
    const event = simulation.events.find((item) => item.id === Number(key));
    title = event ? `Simulation event · ${event.title}` : "Simulation event";
    text = event
      ? `The seeded ${event.effect.impact} event affected ${event.effect.type} in this lab. Its configured effect magnitude is ${event.effect.magnitude}. This is a simplified game event, not a forecast; inspect the updated resources and current objective before choosing a response.`
      : "A seeded event changed the lab's operating conditions. Its effects are part of this simplified scenario, not a forecast about AI development.";
  } else if (type === "service") {
    title = `${key === "api" ? "API" : "Chatbot"} service unlocked`;
    text =
      "The capability is available. Building a platform and enabling the service are separate decisions that use cash and compute.";
  } else if (type === "rejected") {
    title = "Action unavailable";
    text = `${key.replaceAll("_", " ")}. Your run is preserved. Check the current blocker and choose an enabled action.`;
  } else if (type === "advisor" || type === "narrative") {
    const content = narrative[key as keyof typeof narrative];
    if (content) {
      title = content.title;
      text = content.content;
    }
    if (key?.startsWith("ERA_ADVANCE_")) {
      const era = key.replace("ERA_ADVANCE_GNT", "GNT-") as Era;
      claim = eraLearning[era]?.lesson;
      reflection = eraLearning[era]?.reflection;
    }
  }
  return (
    <aside
      data-testid="spark-message"
      data-message-id={message.messageId}
      aria-labelledby="spark-message-title"
      className="mb-5 rounded-lg border border-teal-800 bg-gray-900 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
          Spark ·{" "}
          {available.length > 1
            ? `${available.length} queued updates`
            : "lab guide"}
        </p>
        <Button
          disabled={!writable}
          variant="ghost"
          onClick={() => onDismiss(message.messageId)}
          className="min-h-11 text-gray-200 hover:bg-gray-800 hover:text-white"
          aria-label={`Dismiss Spark message: ${title}`}
        >
          Dismiss
        </Button>
      </div>
      <h2
        id="spark-message-title"
        className="text-lg font-semibold text-amber-200"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-200" role="status">
        {text}
      </p>
      {reflection && (
        <p className="mt-3 border-l-2 border-teal-500 pl-3 text-sm leading-relaxed text-teal-100">
          Reflection: {reflection}
        </p>
      )}
      {claim ? (
        <div className="mt-3">
          <LearningClaim claim={claim} />
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-400">
          Simulation guidance — not real-world evidence. The lab keeps running
          unless you pause it.
        </p>
      )}
    </aside>
  );
}
