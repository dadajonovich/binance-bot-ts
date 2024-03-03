import { Candle } from '../types';

type Prices = Record<keyof Candle, number[]>;

export class Candles {
  public static getPrices(candles: Candle[]): Prices {
    return {
      close: candles.map(({ close }) => close),
      high: candles.map(({ high }) => high),
      low: candles.map(({ low }) => low),
      open: candles.map(({ open }) => open),
    };
  }
}
