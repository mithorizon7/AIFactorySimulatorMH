import type { GameStateV2, SpendCategory } from "./schemas/state";

export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export function recordSpend(
  state: GameStateV2,
  amount: number,
  category: SpendCategory,
): void {
  const cents = roundMoney(amount);
  state.money = roundMoney(state.money - cents);
  state.facts.spendByCategory[category] = roundMoney(
    state.facts.spendByCategory[category] + cents,
  );
  state.facts.totalSpend = roundMoney(
    Object.values(state.facts.spendByCategory).reduce(
      (sum, value) => sum + value,
      0,
    ),
  );
}

export function creditRevenue(state: GameStateV2, amount: number): void {
  const cents = roundMoney(Math.max(0, amount));
  state.money = roundMoney(state.money + cents);
  state.facts.earnedRevenue = roundMoney(state.facts.earnedRevenue + cents);
}

export function creditFunding(
  state: GameStateV2,
  amount: number,
  emergency: boolean,
): void {
  const cents = roundMoney(Math.max(0, amount));
  state.money = roundMoney(state.money + cents);
  state.revenue.investors = roundMoney(state.revenue.investors + cents);
  state.facts.externalFunding = roundMoney(state.facts.externalFunding + cents);
  if (emergency) {
    state.facts.emergencyFunding = roundMoney(
      state.facts.emergencyFunding + cents,
    );
    state.facts.emergencyFundingInterventions += 1;
  }
}

export function creditOtherCashAdjustment(
  state: GameStateV2,
  amount: number,
): void {
  const cents = roundMoney(amount);
  state.money = roundMoney(state.money + cents);
  state.facts.otherCashAdjustments = roundMoney(
    state.facts.otherCashAdjustments + cents,
  );
}

export function expectedCash(state: GameStateV2): number {
  return roundMoney(
    state.facts.startingMoney +
      state.facts.earnedRevenue +
      state.facts.externalFunding +
      state.facts.otherCashAdjustments -
      state.facts.totalSpend,
  );
}
