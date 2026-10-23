import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

type GamePauseContextType = {
  isPausedForLearning: boolean;
  pauseForLearning: () => void;
  resumeFromLearning: () => void;
  pauseGameEngine: () => void;
  resumeGameEngine: () => void;
};

const GamePauseContext = createContext<GamePauseContextType | undefined>(
  undefined,
);

const optionalGamePauseFallback: GamePauseContextType = {
  isPausedForLearning: false,
  pauseForLearning: () => {},
  resumeFromLearning: () => {},
  pauseGameEngine: () => {},
  resumeGameEngine: () => {},
};

export function GamePauseProvider({
  children,
  pauseGame,
  startGame,
  isRunning,
}: {
  children: React.ReactNode;
  pauseGame: () => void;
  startGame: () => void;
  isRunning: boolean;
}) {
  const [isPausedForLearning, setIsPausedForLearning] = useState(false);
  const learningPauseRef = useRef(false);

  // This will pause the game and track that it was paused for learning
  const pauseForLearning = useCallback(() => {
    if (isRunning) {
      learningPauseRef.current = true;
      setIsPausedForLearning(true);
      pauseGame();
    }
  }, [isRunning, pauseGame]);

  // This will resume the game if it was paused for learning
  const resumeFromLearning = useCallback(() => {
    if (learningPauseRef.current) {
      learningPauseRef.current = false;
      setIsPausedForLearning(false);
      startGame();
    }
  }, [startGame]);

  // These methods are for direct control, without tracking learning state
  const pauseGameEngine = useCallback(() => {
    pauseGame();
  }, [pauseGame]);

  const resumeGameEngine = useCallback(() => {
    startGame();
  }, [startGame]);

  return (
    <GamePauseContext.Provider
      value={{
        isPausedForLearning,
        pauseForLearning,
        resumeFromLearning,
        pauseGameEngine,
        resumeGameEngine,
      }}
    >
      {children}
    </GamePauseContext.Provider>
  );
}

export function useGamePause() {
  const context = useContext(GamePauseContext);
  if (context === undefined) {
    throw new Error("useGamePause must be used within a GamePauseProvider");
  }
  return context;
}

export function useOptionalGamePause(): GamePauseContextType {
  return useContext(GamePauseContext) ?? optionalGamePauseFallback;
}
