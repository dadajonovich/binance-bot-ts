import { binanceUrl, config, pairs } from '../config';
import { Candle } from '../types';

type BinanceError = {
  code: number;
  msg: string;
};

export class BinanceRepository {
  private static checkReject<T extends object>(responce: T | BinanceError): T {
    if ('code' in responce && 'msg' in responce)
      throw new Error(`${responce.msg}`);
    return responce;
  }

  public static async getCandles(
    symbol: (typeof pairs)[number],
  ): Promise<Candle[]> {
    const responce = BinanceRepository.checkReject<string[][]>(
      await fetch(
        `${binanceUrl}/api/v3/klines?interval=1d&limit=35&symbol=${symbol}`,
        {
          headers: {
            'X-MBX-APIKEY': config.BINANCE_API_KEY,
          },
        },
      ).then((responce) => responce.json()),
    );
    return responce.map(([, open, high, low, close]) => ({
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
    }));
  }
}
