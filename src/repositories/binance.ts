import { binanceUrl, config, pairs } from '../config';
import { Balance, Candle } from '../types';
import { createHmac } from 'node:crypto';

type BinanceError = {
  code: number;
  msg: string;
};

export class BinanceRepository {
  private static async request<T extends object>(url: string): Promise<T> {
    const responce = await fetch(`${binanceUrl}/${url}`, {
      headers: {
        'X-MBX-APIKEY': config.BINANCE_API_KEY,
      },
    }).then((responce) => responce.json() as T | BinanceError);
    if ('code' in responce && 'msg' in responce)
      throw new Error(`${responce.msg}`);
    return responce;
  }

  public static async getBalances(): Promise<Balance[]> {
    type Account = {
      balances: Record<'asset' | 'free' | 'locked', string>[];
    };

    const timestamp = Date.now();

    const signature = createHmac('sha256', config.BINANCE_SECRET_KEY)
      .update(`timestamp=${timestamp}`)
      .digest('hex');

    const responce = await BinanceRepository.request<Account>(
      `account?signature=${signature}&timestamp=${timestamp}`,
    );
    return responce.balances.map(({ asset, free, locked }) => ({
      asset,
      free: Number(free),
      locked: Number(locked),
    }));
  }

  public static async getCandles(
    symbol: (typeof pairs)[number],
  ): Promise<Candle[]> {
    const responce = await BinanceRepository.request<string[][]>(
      `klines?interval=1d&limit=35&symbol=${symbol}`,
    );

    return responce.map(([, open, high, low, close]) => ({
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
    }));
  }
}
