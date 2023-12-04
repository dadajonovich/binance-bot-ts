import { binanceUrl, config, pairs } from '../config';

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
};

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
    const responce = BinanceRepository.checkReject<number[][]>(
      await fetch(
        `${binanceUrl}/api/v3/uiKlines?interval=1d&limit=35&symbol=${symbol}`,
        {
          headers: {
            'X-MBX-APIKEY': config.BINANCE_API_KEY,
          },
        },
      ).then((responce) => responce.json()),
    );
    return responce.map(([, open, high, low, close]) => ({
      open,
      high,
      low,
      close,
    }));
  }
}
