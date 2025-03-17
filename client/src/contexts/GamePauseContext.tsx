import React, { createContext, useContext, useState } from 'react';

type GamePauseContextType = {
  isPausedForLearning: boolean;
  pauseForLearning: () => void;
  resumeFromLearning: () => void;
  pauseGameEngine: () => void;
  resumeGameEngine: () => void;
};

const GamePauseContext = createContext<GamePauseContextType | undefined>(undefined);

export function GamePauseProvider({ 
  children, 
  pauseGame, 
  startGame,
  isRunning
}: { 
  children: React.ReactNode;
  pauseGame: () => void;
  startGame: () => void;
  isRunning: boolean;
}) {
  const [isPausedForLearning, setIsPausedForLearning] = useState(false);
  
  // This will pause the game and track that it was paused for learning
  const pauseForLearning = () => {
    if (isRunning) {
      setIsPausedForLearning(true);
      pauseGame();
    }
  };
  
  // This will resume the game if it was paused for learning
  const resumeFromLearning = () => {
    if (isPausedForLearning) {
      setIsPausedForLearning(false);
      startGame();
    }
  };

  // These methods are for direct control, without tracking learning state
  const pauseGameEngine = () => {
    pauseGame();
  };

  const resumeGameEngine = () => {
    startGame();
  };
  
  return (
    <GamePauseContext.Provider 
      value={{ 
        isPausedForLearning, 
        pauseForLearning, 
        resumeFromLearning,
        pauseGameEngine,
        resumeGameEngine
      }}
    >
      {children}
    </GamePauseContext.Provider>
  );
}

export function useGamePause() {
  const context = useContext(GamePauseContext);
  if (context === undefined) {
    throw new Error('useGamePause must be used within a GamePauseProvider');
  }
  return context;
}