import { Button } from "@/components/ui/button";
import { 
  PlayCircle, 
  PauseCircle, 
  RefreshCw, 
  BrainCircuit, 
  Clock, 
  Coins
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
}

export default function GameHeader({
  gameState,
  isRunning,
  timeElapsed,
  formattedTime,
  startGame,
  pauseGame,
  resetGame
}: GameHeaderProps) {
  return (
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
              >
                <PlayCircle className="h-5 w-5" />
                {timeElapsed > 0 ? "Resume" : "Start Game"}
              </Button>
            ) : (
              <Button 
                className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
                onClick={pauseGame}
              >
                <PauseCircle className="h-5 w-5" />
                Pause
              </Button>
            )}
            <Button 
              variant="outline"
              className="flex items-center gap-2 text-gray-200 border-gray-600 hover:text-white"
              onClick={() => {
                localStorage.removeItem('hasPlayedAIFactory');
                resetGame();
              }}
            >
              <RefreshCw className="h-5 w-5" />
              Reset
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
  );
}