import { useState, useEffect } from "react";
import { GameStateType, Breakthrough } from "@/lib/gameState";

export function useBreakthroughs(gameState: GameStateType) {
  const [newBreakthrough, setNewBreakthrough] = useState<Breakthrough | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Watch for newly unlocked breakthroughs
  useEffect(() => {
    const justUnlocked = gameState.breakthroughs.find(b => 
      b.unlocked && b.id === gameState.currentGoal.id
    );
    
    if (justUnlocked) {
      setNewBreakthrough(justUnlocked);
      setShowModal(true);
    }
  }, [gameState.breakthroughs]);

  const closeModal = () => {
    setShowModal(false);
  };

  return {
    newBreakthrough,
    showModal,
    closeModal
  };
}
