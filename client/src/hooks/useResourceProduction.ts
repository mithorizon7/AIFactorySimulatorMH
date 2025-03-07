import { useState, useEffect, useRef } from "react";
import { GameStateType } from "@/lib/gameState";

export function useResourceProduction(initialGameState: GameStateType, isRunning: boolean) {
  const [resources, setResources] = useState(initialGameState.resources);
  const [production, setProduction] = useState(initialGameState.production);
  const productionLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Production loop
  useEffect(() => {
    if (isRunning) {
      const updateResources = () => {
        setResources(prev => ({
          compute: prev.compute + (production.compute / 10), // Update 10 times per second
          data: prev.data + (production.data / 10),
          algorithm: prev.algorithm + (production.algorithm / 10)
        }));
      };

      productionLoopRef.current = setInterval(updateResources, 100);
    }

    return () => {
      if (productionLoopRef.current) {
        clearInterval(productionLoopRef.current);
      }
    };
  }, [isRunning, production]);

  // Update production rates
  const updateProduction = (type: 'compute' | 'data' | 'algorithm', multiplier: number) => {
    setProduction(prev => ({
      ...prev,
      [type]: prev[type] * multiplier
    }));
  };

  // Consume resources
  const consumeResources = (type: 'compute' | 'data' | 'algorithm', amount: number) => {
    setResources(prev => {
      // Only consume if there's enough
      if (prev[type] >= amount) {
        return {
          ...prev,
          [type]: prev[type] - amount
        };
      }
      return prev;
    });
  };

  return {
    resources,
    production,
    updateProduction,
    consumeResources
  };
}
