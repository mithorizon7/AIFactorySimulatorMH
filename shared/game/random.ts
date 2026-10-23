import type { RandomState } from "./schemas/state";

export interface RandomDraw {
  random: RandomState;
  value: number;
}

/** One persisted xorshift32-v1 draw, mapped to [0, 1). */
export function drawRandom(random: RandomState): RandomDraw {
  let next = random.state >>> 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  next >>>= 0;

  return {
    random: { ...random, state: next, draws: random.draws + 1 },
    value: next / 0x1_0000_0000,
  };
}
