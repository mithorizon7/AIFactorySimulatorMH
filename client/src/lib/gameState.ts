/**
 * Client compatibility exports for the shared simulation domain.
 *
 * Simulation rules, catalogs, and fresh-state construction live under
 * shared/game. Keeping this adapter lets the existing UI migrate without
 * creating a shared -> client dependency.
 */
export * from "@shared/game/domain/gameState";
