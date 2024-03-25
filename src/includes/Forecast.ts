export class Forecast {
  public static buySignalKaufman(ama: number[], filter: number[]): boolean {
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

  public static sellSignalKaufman(ama: number[], filter: number[]): boolean {
    let exthigh = null;
    for (let i = 2; i < ama.length - 1; i++) {
      if (ama[i] < ama[i - 1] && ama[i - 1] > ama[i - 2]) {
        exthigh = ama[i - 1];
      }
    }
    const amaPrevious = ama.at(-2);
    const amaPrePrevious = ama.at(-3);
    const filterPrevious = filter.at(-2);
    if (!amaPrevious || !amaPrePrevious || !filterPrevious || !exthigh)
      return false;
    return (
      amaPrevious < amaPrePrevious &&
      exthigh - amaPrevious > filterPrevious * 0.1
    );
  }

  public static lowVolatility(atr: number[], filter: number[]): boolean {
    const atrPrevious = atr.at(-2);
    const atrPrePrevious = atr.at(-3);
    const filterPrevious = filter.at(-2);
    if (!atrPrevious || !atrPrePrevious || !filterPrevious) return false;
    const betweenPeriods = atrPrevious - atrPrePrevious;
    return betweenPeriods < filterPrevious * 1;
  }
}
