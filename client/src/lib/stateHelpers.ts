/**
 * Immutable state update helpers for GameStateType
 * These functions ensure proper nested copying without mutations
 */

import { GameStateType, TrainingStatus } from "./gameState";

/**
 * Applies a capped bonus multiplier to prevent runaway growth
 */
export const applyCappedBonus = (currentBonus: number, multiplier: number, maxCap: number = 2.5): number => {
  const newBonus = currentBonus * multiplier;
  return Math.min(newBonus, maxCap);
};

/**
 * Adds intelligence points to state immutably
 */
export const addIntelligence = (state: GameStateType, delta: number): GameStateType => {
  return {
    ...state,
    intelligence: state.intelligence + delta
  };
};

/**
 * Updates bonus values immutably
 */
export const withBonuses = (state: GameStateType, partialBonuses: Partial<typeof state.bonuses>): GameStateType => {
  return {
    ...state,
    bonuses: {
      ...state.bonuses,
      ...partialBonuses
    }
  };
};

/**
 * Updates revenue values immutably
 */
export const withRevenue = (state: GameStateType, partialRevenue: Partial<typeof state.revenue>): GameStateType => {
  return {
    ...state,
    revenue: {
      ...state.revenue,
      ...partialRevenue
    }
  };
};

/**
 * Updates narrative flags immutably
 */
export const withFlags = (state: GameStateType, partialFlags: Partial<typeof state.narrativeFlags>): GameStateType => {
  return {
    ...state,
    narrativeFlags: {
      ...state.narrativeFlags,
      ...partialFlags
    }
  };
};

/**
 * Updates training runs immutably, only cloning runs that match predicate
 * This ensures structural sharing for unchanged runs
 */
export const updateRuns = (
  state: GameStateType,
  predicate: (run: typeof state.training.runs[keyof typeof state.training.runs]) => boolean,
  updater: (run: typeof state.training.runs[keyof typeof state.training.runs]) => typeof state.training.runs[keyof typeof state.training.runs]
): GameStateType => {
  const runs = state.training.runs;
  let changed = false;
  const newRuns = {} as typeof runs;
  
  for (const eraKey of Object.keys(runs)) {
    const era = eraKey as keyof typeof runs;
    const run = runs[era];
    
    if (predicate(run)) {
      const newRun = updater(run);
      if (newRun !== run) {
        changed = true;
      }
      newRuns[era] = newRun;
    } else {
      newRuns[era] = run;
    }
  }
  
  if (changed) {
    return {
      ...state,
      training: {
        ...state.training,
        runs: newRuns
      }
    };
  }
  
  return state;
};
