import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparkCharacter } from "@/components/character/SparkCharacter";
import { Era, GameStateType, TrainingStatus } from "@/lib/gameState";
import { formatCurrency } from "@/lib/utils";
import {
  BrainCircuit,
  DollarSign,
  FlaskConical,
  Lightbulb,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

interface VictoryScreenProps {
  gameState: GameStateType;
  onClose: () => void;
  onReset: () => void;
}

export default function VictoryScreen({
  gameState,
  onClose,
  onReset,
}: VictoryScreenProps) {
  const completedTrainingRuns = Object.values(gameState.training.runs).filter(
    (run) => run.status === TrainingStatus.COMPLETE,
  ).length;
  const unlockedBreakthroughs = gameState.breakthroughs.filter(
    (breakthrough) => breakthrough.unlocked,
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-complete-title"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-gray-800">
        <header className="relative border-b border-gray-700 p-6 text-center">
          <h1 id="run-complete-title" className="text-3xl font-bold text-white">
            Run complete — {Era.GNT7} scenario
          </h1>
          <p className="mt-2 text-gray-300">
            This is a speculative learning scenario, not a claim that real-world
            AGI has been achieved.
          </p>
          <SparkCharacter position="corner" size="small" />
        </header>

        <div className="space-y-6 p-6">
          <Card className="border-gray-600 bg-gray-700">
            <CardHeader>
              <CardTitle className="text-xl">Final simulation facts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Fact
                  icon={<BrainCircuit className="h-6 w-6 text-blue-400" />}
                  value={gameState.intelligence.toFixed(3)}
                  label="Final model capability"
                />
                <Fact
                  icon={<FlaskConical className="h-6 w-6 text-purple-400" />}
                  value={`${completedTrainingRuns}/5`}
                  label="Training runs completed"
                />
                <Fact
                  icon={<Lightbulb className="h-6 w-6 text-yellow-400" />}
                  value={`${unlockedBreakthroughs}/${gameState.breakthroughs.length}`}
                  label="Breakthroughs unlocked"
                />
                <Fact
                  icon={<DollarSign className="h-6 w-6 text-green-400" />}
                  value={formatCurrency(gameState.money)}
                  label="Ending cash"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-600 bg-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-6 w-6 text-indigo-400" />
                Customers at completion
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Fact
                value={gameState.revenue.developers.toLocaleString()}
                label="B2B developers"
              />
              <Fact
                value={gameState.revenue.subscribers.toLocaleString()}
                label="B2C subscribers"
              />
            </CardContent>
          </Card>

          <p className="text-sm leading-relaxed text-gray-400">
            Active time, complete spend and revenue flows, capacity pressure,
            emergency interventions, allocation, and personal bests appear only
            when they can be reconstructed from the versioned factual ledger.
            This run is not assigned a score, rank, or strategy profile.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onReset}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="button-play-again"
            >
              Start new run
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-blue-600 font-medium text-white hover:bg-blue-500"
              data-testid="button-close-victory"
            >
              Close summary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon,
  value,
  label,
}: {
  icon?: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center">
      {icon ? <div className="mb-2 flex justify-center">{icon}</div> : null}
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
