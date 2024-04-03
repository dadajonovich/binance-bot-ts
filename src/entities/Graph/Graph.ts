export type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
};

export class Graph {
  private pair: string;

  private candles: Candle[];

  private close: number[];
  private high: number[];
  private low: number[];
  private open: number[];

  private kama: number[];
  private filterKama: number[];

  // private atr: number[];
  // private filterAtr: number[];

  private hv: number[];

  public buySignal: boolean;
  public sellSignal: boolean;

  public constructor(pair: string, candles: Candle[]) {
    this.pair = pair;

    this.candles = candles;

    this.close = this.candles.map(({ close }) => close);
    this.high = this.candles.map(({ high }) => high);
    this.low = this.candles.map(({ low }) => low);
    this.open = this.candles.map(({ open }) => open);

    this.kama = this.getKama(this.close, 10, 2, 30);
    // this.atr = this.getAtr(this.close, this.high, this.low, 10);
    this.filterKama = this.getFilter(this.kama);
    // this.filterAtr = this.getFilter(this.atr);

    this.hv = this.getHistoricalVolatility(this.close);

    this.buySignal =
      this.buySignalKaufman(this.kama, this.filterKama) && this.hv.at(-2)! < 40;

    this.sellSignal =
      this.sellSignalKaufman(this.kama, this.filterKama) &&
      this.hv.at(-2)! > 55;
  }

  private getKama(data: number[], len1 = 10, len2 = 2, len3 = 30): number[] {
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

  // private getAtr(
  //   closePrices: number[],
  //   highPrice: number[],
  //   lowPrice: number[],
  //   length = 14,
  // ) {
  //   const atr = [highPrice[0] - lowPrice[0]];

  //   for (let i = 1; i < closePrices.length; i++) {
  //     const tr = Math.max(
  //       highPrice[i] - lowPrice[i],
  //       Math.abs(highPrice[i] - closePrices[i - 1]),
  //       Math.abs(lowPrice[i] - closePrices[i - 1]),
  //     );

  //     const atrValue = (atr[i - 1] * (length - 1) + tr) / length;

  //     atr.push(atrValue);
  //   }

  //   return atr;
  // }

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
