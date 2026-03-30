import { useState, useEffect, useRef } from "react";
import { GameStateType, Breakthrough } from "@/lib/gameState";

export function useBreakthroughs(gameState: GameStateType) {
  const [newBreakthrough, setNewBreakthrough] = useState<Breakthrough | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const unlockedIdsRef = useRef<number[]>([]);

  // Watch for newly unlocked breakthroughs
  useEffect(() => {
    const previouslyUnlocked = new Set(unlockedIdsRef.current);
    const justUnlocked = gameState.breakthroughs.find(
      (breakthrough) => breakthrough.unlocked && !previouslyUnlocked.has(breakthrough.id)
    );
    unlockedIdsRef.current = gameState.breakthroughs
      .filter((breakthrough) => breakthrough.unlocked)
      .map((breakthrough) => breakthrough.id);
    
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
