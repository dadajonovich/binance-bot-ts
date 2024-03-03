import { Statistic } from './Statistic';

export class Indicator {
  public static getKama(
    data: number[],
    len1 = 10,
    len2 = 2,
    len3 = 30,
  ): number[] {
    const fasted = 2 / (len2 + 1);
    const slowest = 2 / (len3 + 1);
    const kama = data.slice(0, len1);

    for (let i = len1; i < data.length; i++) {
      let volatility = 0;
      const direction = Math.abs(data[i] - data[i - len1]);
      for (let a = 0; a < len1; a++) {
        volatility += Math.abs(data[i - a] - data[i - a - 1]);
      }

      const er = direction / volatility;
      const smooth = (er * (fasted - slowest) + slowest) ** 2;

      const last = kama.at(-1);
      if (!last) continue;

      kama.push(last + smooth * (data[i] - last));
    }
    return kama;
  }
  public static getAtr(
    closePrices: number[],
    highPrice: number[],
    lowPrice: number[],
    length = 14,
  ) {
    const atr = [highPrice[0] - lowPrice[0]];

    for (let i = 1; i < closePrices.length; i++) {
      const tr = Math.max(
        highPrice[i] - lowPrice[i],
        Math.abs(highPrice[i] - closePrices[i - 1]),
        Math.abs(lowPrice[i] - closePrices[i - 1]),
      );

      const atrValue = (atr[i - 1] * (length - 1) + tr) / length;

      atr.push(atrValue);
    }

    return atr;
  }
  public static getFilter(data: number[]) {
    Statistic;
    const valueBetweenPeriods = Statistic.getValueBetweenPeriods(data);
    const filter = Statistic.getStd(valueBetweenPeriods, 20);
    return filter;
  }
}
