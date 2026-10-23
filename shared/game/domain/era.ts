// GNT = Generative Neural Transformer. GNT-5 through GNT-7 are speculative scenarios.
export enum Era {
  GNT2 = "GNT-2",
  GNT3 = "GNT-3",
  GNT4 = "GNT-4",
  GNT5 = "GNT-5",
  GNT6 = "GNT-6",
  GNT7 = "GNT-7",
}

export const ERA_ORDER = [
  Era.GNT2,
  Era.GNT3,
  Era.GNT4,
  Era.GNT5,
  Era.GNT6,
  Era.GNT7,
] as const;

export function getNextEra(currentEra: Era): Era | null {
  const currentIndex = ERA_ORDER.indexOf(currentEra);
  return currentIndex < ERA_ORDER.length - 1
    ? ERA_ORDER[currentIndex + 1]
    : null;
}

export function isFinalEra(era: Era): boolean {
  return era === Era.GNT7;
}

export function getEraIndex(era: Era): number {
  return ERA_ORDER.indexOf(era);
}
