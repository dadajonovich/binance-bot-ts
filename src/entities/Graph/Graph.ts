import { Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { BinanceRepository, Kline } from '../Binance';
import { Indicators } from '../Indicators';

export class Graph {
  private pair: string;

  private klines: Kline[];

  private close: number[];
  private high: number[];
  private low: number[];
  private open: number[];

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
  }
}
