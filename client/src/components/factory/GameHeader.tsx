import { useState } from "react";
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
  Trophy
} from "lucide-react";
import GameTimer from "./GameTimer";
import { GameStateType } from "@/lib/gameState";
import { formatCurrency } from "@/lib/utils";

interface GameHeaderProps {
  gameState: GameStateType;
  isRunning: boolean;
  timeElapsed: number;
  formattedTime: string;
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  onOpenLeaderboard: () => void;
}

export default function GameHeader({
  gameState,
  isRunning,
  timeElapsed,
  formattedTime,
  startGame,
  pauseGame,
  resetGame,
  onOpenLeaderboard
}: GameHeaderProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    localStorage.removeItem('hasPlayedAIFactory');
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
                  Current Era: <span className="text-amber-400 font-medium">{gameState.currentEra}</span>
                </p>
              </div>
            </div>
            
            {/* Primary Metrics */}
            <div className="flex gap-4">
              {/* Intelligence */}
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-amber-900/30">
                <div className="flex items-center gap-1 text-sm text-gray-300">
                  <BrainCircuit className="h-4 w-4 text-amber-400" />
                  Intelligence
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
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-blue-900/30">
                <div className="flex items-center gap-1 text-sm text-gray-300">
                  <Clock className="h-4 w-4 text-blue-400" />
                  Time Elapsed
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {formattedTime}
                </div>
              </div>
            </div>
            
            {/* Game Controls */}
            <div className="flex gap-2">
              {!isRunning ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2" 
                  onClick={startGame}
                  data-testid="button-start-game"
                >
                  <PlayCircle className="h-5 w-5" />
                  {timeElapsed > 0 ? "Resume" : "Start Game"}
                </Button>
              ) : (
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
                  onClick={pauseGame}
                  data-testid="button-pause-game"
                >
                  <PauseCircle className="h-5 w-5" />
                  Pause
                </Button>
              )}
              <Button 
                variant="outline"
                className="flex items-center gap-2 text-yellow-400 border-yellow-600 hover:bg-yellow-900/20 hover:text-yellow-300"
                onClick={onOpenLeaderboard}
                data-testid="button-open-leaderboard"
              >
                <Trophy className="h-5 w-5" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Button>
              <Button 
                variant="outline"
                className="flex items-center gap-2 text-gray-200 border-gray-600 hover:text-white"
                onClick={handleResetClick}
                data-testid="button-reset-game"
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
            style={{ width: `${Math.min(100, (gameState.intelligence / gameState.agiThreshold) * 100)}%` }}
          ></div>
        </div>
      </header>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">Reset Your Progress?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This will permanently delete all your current progress, including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Current intelligence level ({gameState.intelligence.toFixed(0)})</li>
                <li>All resources and upgrades</li>
                <li>Time elapsed ({formattedTime})</li>
                <li>Money and revenue ({formatCurrency(gameState.money)})</li>
              </ul>
              <p className="mt-3 font-medium text-amber-400">This action cannot be undone.</p>
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