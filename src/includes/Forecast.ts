import { Coin } from '../types';

export class Forecast {
  private static buySignalKaufman(ama: number[], filter: number[]): boolean {
    let extlow = null;
    for (let i = 2; i < ama.length - 1; i++) {
      if (ama[i] > ama[i - 1] && ama[i - 1] < ama[i - 2]) {
        extlow = ama[i - 1];
      }
    }
    const amaPrevious = ama.at(-2);
    const amaPrePrevious = ama.at(-3);
    const filterPrevious = filter.at(-2);
    if (!amaPrevious || !amaPrePrevious || !filterPrevious || !extlow)
      return false;
    return (
      amaPrevious > amaPrePrevious && amaPrevious - extlow > filterPrevious * 1
    );
  }

  private static volatilityFilter(atr: number[], filter: number[]): boolean {
    const atrPrevious = atr.at(-2);
    const atrPrePrevious = atr.at(-3);
    const filterPrevious = filter.at(-2);
    if (!atrPrevious || !atrPrePrevious || !filterPrevious) return false;
    const betweenPeriods = atrPrevious - atrPrePrevious;
    return betweenPeriods < filterPrevious * 1;
  }

  public static calcBuySignal(coins: Coin[]): Coin | undefined {
    return coins.find(
      (coin) =>
        Forecast.buySignalKaufman(coin.kama, coin.filterKama) &&
        Forecast.volatilityFilter(coin.atr, coin.filterAtr),
    );
  }
}
