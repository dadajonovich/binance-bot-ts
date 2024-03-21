import { Forecast } from '../../includes/Forecast';
import { Indicator } from '../../includes/Indicator';

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
  private atr: number[];
  private filterKama: number[];
  private filterAtr: number[];

  public buySignal: boolean;

  public constructor(pair: string, candles: Candle[]) {
    this.pair = pair;

    this.candles = candles;

    this.close = this.candles.map(({ close }) => close);
    this.high = this.candles.map(({ high }) => high);
    this.low = this.candles.map(({ low }) => low);
    this.open = this.candles.map(({ open }) => open);

    this.kama = Indicator.getKama(this.close, 10, 2, 30);
    this.atr = Indicator.getAtr(this.close, this.high, this.low, 10);
    this.filterKama = Indicator.getFilter(this.kama);
    this.filterAtr = Indicator.getFilter(this.atr);

    this.buySignal =
      Forecast.buySignalKaufman(this.kama, this.filterKama) &&
      Forecast.buySignalVolatility(this.atr, this.filterAtr);
  }
}
