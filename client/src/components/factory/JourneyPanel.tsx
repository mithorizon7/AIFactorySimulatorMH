import { Era } from "@/lib/gameState";
import {
  breakthroughLearning,
  eraLearning,
  SIMULATION_DISCLAIMER,
} from "@/lib/learningContent";
import type { GameStateV2 } from "@shared/game/schemas/state";
import LearningClaim from "./LearningClaim";

const eras = [Era.GNT2, Era.GNT3, Era.GNT4, Era.GNT5, Era.GNT6, Era.GNT7];

export default function JourneyPanel({
  simulation,
}: {
  simulation: GameStateV2;
}) {
  const currentIndex = eras.indexOf(simulation.currentEra);
  return (
    <section
      aria-labelledby="journey-title"
      className="space-y-5"
      data-testid="journey-panel"
    >
      <header className="rounded-lg border border-gray-700 bg-gray-900 p-5">
        <h2
          id="journey-title"
          className="text-2xl font-semibold text-amber-300"
        >
          Your AI lab journey
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          Training advances your era. Breakthroughs are milestones within eras
          you have reached; they do not replace training.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-teal-200">
          {SIMULATION_DISCLAIMER}
        </p>
      </header>
      <ol className="space-y-4">
        {eras.map((era, index) => {
          const learning = eraLearning[era];
          const reached = index <= currentIndex;
          const current = era === simulation.currentEra;
          const breakthroughs = simulation.breakthroughs.filter(
            (item) => item.era === era,
          );
          return (
            <li
              key={era}
              className={`rounded-lg border bg-gray-900 p-4 sm:p-5 ${current ? "border-amber-600" : "border-gray-700"}`}
              aria-current={current ? "step" : undefined}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">
                  {era} · {learning.title}
                </h3>
                <span
                  className={`rounded px-2 py-1 text-xs ${current ? "bg-amber-950 text-amber-200" : "bg-gray-800 text-gray-300"}`}
                >
                  {current ? "Current era" : reached ? "Era reached" : "Ahead"}
                  {index >= 3 ? " · Speculative" : ""}
                </span>
              </div>
              <p className="mt-3 text-sm text-teal-200">{learning.tension}</p>
              <div className="mt-3">
                <LearningClaim claim={learning.lesson} />
              </div>
              {reached && (
                <div className="mt-4 rounded border-l-2 border-teal-500 bg-teal-950/30 p-3">
                  <h4 className="text-sm font-semibold text-teal-200">
                    {current ? "Consider as you play" : "Era reflection"}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-200">
                    {learning.reflection}
                  </p>
                </div>
              )}
              <details className="mt-4" open={current}>
                <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-amber-200">
                  Breakthroughs ·{" "}
                  {breakthroughs.filter((item) => item.unlocked).length}/
                  {breakthroughs.length} unlocked
                </summary>
                <ul className="space-y-3 pt-2">
                  {breakthroughs.map((item) => {
                    const content = breakthroughLearning[item.id];
                    return (
                      <li
                        key={item.id}
                        className="rounded border border-gray-700 bg-gray-800/60 p-3"
                      >
                        <h4 className="font-medium text-white">
                          {content?.title ?? item.name}{" "}
                          <span className="text-xs text-teal-200">
                            ·{" "}
                            {item.unlocked
                              ? "Unlocked"
                              : reached
                                ? "Not yet unlocked"
                                : "Reach this era first"}
                          </span>
                        </h4>
                        {content && (
                          <div className="mt-2">
                            <LearningClaim claim={content.lesson} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
