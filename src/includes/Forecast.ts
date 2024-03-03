export class Forecast {
  private static buySignalKaufman(ama: number[], filter: number[]): boolean {
    let extlow = null;

    for (let i = 2; i < ama.length - 1; i++) {
      const a = ama.at(i);
      const b = ama.at(i - 1);
      const c = ama.at(i - 2);

      if (!a || !b || !c) return false;

      if (a > b && b < c) {
        extlow = b;
      }
    }
    const a = ama.at(-2);
    const b = ama.at(-3);
    const c = filter.at(-2);

    if (!a || !b || !c || !extlow) return false;
    if (a > b && a - extlow > c * 1) {
      return true;
    }
    return false;
  }

  private static volatilityFilter(atr: number[], filter: number[]): boolean {
    const betweenPeriods = atr.at(-2) - atr.at(-3);

    if (betweenPeriods < filter.at(-2) * 1) {
      return true;
    }

    return false;
  }
}
