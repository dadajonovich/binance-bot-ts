import { Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { BinanceRepository, Kline } from '../Binance';

export class Graph {
  private pair: string;

  private klines: Kline[];

  private close: number[];
  private high: number[];
  private low: number[];
  private open: number[];

  private kama: number[];
  private filterKama: number[];

  private atr: number[];
  private filterAtr: number[];

  private hv: number[];

  public buySignal: boolean;
  public sellSignal: boolean;

  public static async createByPair(pair: Pair) {
    const klines = await BinanceRepository.getKlines(pair);

    return new Graph(pair, klines);
  }

  public constructor(pair: Pair, klines: Kline[]) {
    this.pair = pair;

    this.klines = klines;

    this.close = this.klines.map(({ close }) => close);
    this.high = this.klines.map(({ high }) => high);
    this.low = this.klines.map(({ low }) => low);
    this.open = this.klines.map(({ open }) => open);

    this.kama = this.getKama(this.close, 10, 2, 30);
    this.filterKama = this.getFilter(this.kama);

    this.atr = this.getAtr(this.close, this.high, this.low, 10);
    this.filterAtr = this.getFilter(this.atr);

    this.hv = this.getHistoricalVolatility(this.close);

    this.buySignal = this.createBuySignal();

    this.sellSignal = true;
  }

  private createBuySignal(): boolean {
    const hvPrevious = this.hv.at(-2);
    if (hvPrevious === undefined)
      throw new ErrorInfo(
        'Graph.createBuySignal',
        'Недостаточная длина массива hv',
        { hv: this.hv },
      );

    return (
      this.buySignalKaufman(this.kama, this.filterKama) &&
      hvPrevious < 50 &&
      !this.shock(this.atr, this.filterAtr)
    );
  }

  private createSellSignal(): boolean {
    const hvPrevious = this.hv.at(-2);
    if (!hvPrevious)
      throw new ErrorInfo(
        'Graph.createBuySignal',
        'Недостаточная длина массива hv',
      );

    return (
      this.sellSignalKaufman(this.kama, this.filterKama) ||
      hvPrevious > 50 ||
      this.shock(this.atr, this.filterAtr)
    );
  }

  private getKama(data: number[], len1 = 10, len2 = 2, len3 = 30): number[] {
    if (data.length < len3)
      throw new ErrorInfo('Graph.getKama', 'Недостаточная длина массива!', {
        data,
        len1,
        len2,
        len3,
      });

    const fasted = 2 / (len2 + 1);
    const slowest = 2 / (len3 + 1);
    const kama = data.slice(0, len1);

    for (let i = len1; i < data.length; i++) {
      let volatility = 0;
      const direction = Math.abs(data[i] - data[i - len1]);
      for (let j = 0; j < len1; j++) {
        volatility += Math.abs(data[i - j] - data[i - j - 1]);
      }

      const er = direction / volatility;
      const smooth = (er * (fasted - slowest) + slowest) ** 2;

      const last = kama.at(-1);
      if (!last) continue;

      kama.push(last + smooth * (data[i] - last));
    }
    return kama;
  }

  private getAtr(
    closePrices: number[],
    highPrice: number[],
    lowPrice: number[],
    length = 14,
  ) {
    if (closePrices.length < length)
      throw new Error('Недостаточная длина массива в getAtr');

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

  private getFilter(data: number[]): number[] {
    const valueDifferences = [];
    for (let i = 1; i < data.length; i++) {
      const difference = data[i] - data[i - 1];
      valueDifferences.push(difference);
    }
    const filter = this.getStd(valueDifferences, 20);
    return filter;
  }

  private getStd(data: number[], length = data.length): number[] {
    const arrStd: number[] = [];
    for (let i = 0; i <= data.length - length; i++) {
      const sliceData = data.slice(i, i + length);
      const mean = sliceData.reduce((a, b) => a + b) / length;
      arrStd.push(
        Math.sqrt(
          sliceData.reduce((sq, n) => sq + (n - mean) ** 2, 0) / length,
        ),
      );
    }
    return arrStd;
  }

  private buySignalKaufman(ama: number[], filter: number[]): boolean {
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

  private sellSignalKaufman(ama: number[], filter: number[]): boolean {
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

  private shock = (atr: number[], filter: number[]) => {
    const atrPrevious = atr.at(-2);
    const atrPrePrevious = atr.at(-3);

    const filterPrevious = filter.at(-2);

    if (!atrPrevious || !atrPrePrevious || !filterPrevious) return false;

    const betweenPeriods = atrPrevious - atrPrePrevious;

    if (betweenPeriods > filterPrevious * 3) {
      return true;
    }

    return false;
  };

  private getHistoricalVolatility(data: number[]): number[] {
    const dailyVolatility = [];
    for (let i = 1; i < data.length; i++) {
      const difference = data[i] / data[i - 1] - 1;
      dailyVolatility.push(difference);
    }
    const dvStd = this.getStd(dailyVolatility, 20);
    const hv = [];
    const annual = Math.sqrt(365);
    for (let j = 0; j < dvStd.length; j++) {
      hv.push(dvStd[j] * annual);
    }
    return hv;
  }
}
