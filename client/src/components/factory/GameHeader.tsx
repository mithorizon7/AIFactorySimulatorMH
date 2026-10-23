import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PlayCircle,
  PauseCircle,
  RefreshCw,
  BrainCircuit,
  Clock,
  Coins,
} from "lucide-react";
import GameTimer from "./GameTimer";
import { GameStateType } from "@/lib/gameState";
import { formatCurrency } from "@/lib/utils";

interface GameHeaderProps {
  gameState: GameStateType;
  isRunning: boolean;
  formattedTime: string;
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
}

export default function GameHeader({
  gameState,
  isRunning,
  formattedTime,
  startGame,
  pauseGame,
  resetGame,
}: GameHeaderProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetButton = useRef<HTMLButtonElement>(null);

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    localStorage.removeItem("hasPlayedAIFactory");
    resetGame();
    setShowResetConfirm(false);
  };

  return (
    <>
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg shadow-lg border border-gray-700 mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Game Title */}
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-8 w-8 text-amber-400" />
              <div>
                <h1 className="text-2xl font-bold">AI Factory</h1>
                <p className="text-sm text-gray-300">
                  Current Era:{" "}
                  <span className="text-amber-400 font-medium">
                    {gameState.currentEra}
                  </span>
                </p>
              </div>
            </div>

            {/* Primary Metrics */}
            <div className="grid min-w-0 w-full grid-cols-1 gap-2 min-[380px]:grid-cols-2 sm:w-auto sm:grid-cols-3 sm:gap-4">
              {/* Intelligence */}
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-amber-900/30">
                <div className="flex items-center gap-1 text-sm text-gray-300">
                  <BrainCircuit className="h-4 w-4 text-amber-400" />
                  Model Capability
                </div>
                <div className="text-xl font-bold text-amber-400">
                  {gameState.intelligence.toFixed(2)} / {gameState.agiThreshold}
                </div>
              </div>

              {/* Money */}
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-emerald-900/30">
                <div className="flex items-center gap-1 text-sm text-gray-300">
                  <Coins className="h-4 w-4 text-emerald-400" />
                  Budget
                </div>
                <div className="text-xl font-bold text-emerald-400">
                  {formatCurrency(gameState.money)}
                </div>
              </div>

              {/* Timer */}
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-blue-900/30 min-[380px]:col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1 text-sm text-gray-300">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Time Elapsed
                </div>
                <div
                  className="text-xl font-bold text-blue-400"
                  data-testid="active-time"
                >
                  {formattedTime}
                </div>
              </div>
            </div>

            {/* Game Controls */}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  className="bg-emerald-700 hover:bg-emerald-800 flex items-center gap-2"
                  onClick={startGame}
                  disabled={gameState.clock.status === "completed"}
                  data-testid="button-start-game"
                >
                  <PlayCircle className="h-5 w-5" />
                  {gameState.clock.status === "paused"
                    ? "Resume"
                    : gameState.clock.status === "completed"
                      ? "Run Complete"
                      : "Start Game"}
                </Button>
              ) : (
                <Button
                  className="bg-amber-700 hover:bg-amber-800 flex items-center gap-2"
                  onClick={pauseGame}
                  data-testid="button-pause-game"
                >
                  <PauseCircle className="h-5 w-5" />
                  Pause
                </Button>
              )}
              <Button
                ref={resetButton}
                variant="outline"
                className="flex items-center gap-2 bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700 hover:text-white"
                onClick={handleResetClick}
                data-testid="button-reset-game"
                aria-label="Reset"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Intelligence Progress Bar */}
        <div className="w-full bg-gray-700 h-2">
          <div
            className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(100, (gameState.intelligence / gameState.agiThreshold) * 100)}%`,
            }}
          ></div>
        </div>
      </header>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent
          className="bg-gray-800 border-gray-700"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            resetButton.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">
              Start a Fresh Run?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-gray-300">
                <p>
                  This starts a separate new run. The current run is preserved
                  as an abandoned save for 30 days, including:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    Current intelligence level (
                    {gameState.intelligence.toFixed(0)})
                  </li>
                  <li>All resources and upgrades</li>
                  <li>Time elapsed ({formattedTime})</li>
                  <li>Money and revenue ({formatCurrency(gameState.money)})</li>
                </ul>
                <p className="mt-3 font-medium text-amber-400">
                  Personal bests and completed-run summaries are preserved.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-reset"
            >
              Yes, Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
