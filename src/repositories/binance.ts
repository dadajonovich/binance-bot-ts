import { binanceUrl, config, pairs } from '../config';
import { Repository } from '../includes/Repository';
import { Balance, Candle } from '../types';
import { createHmac } from 'node:crypto';

type BinanceError = {
  code: number;
  msg: string;
};

export const BinanceRepository =
  new (class BinanceRepository extends Repository<object, BinanceError> {
    constructor() {
      super(binanceUrl, {
        headers: {
          'X-MBX-APIKEY': config.BINANCE_API_KEY,
        },
      });
    }

    protected errorHandler<T extends object>(
      responce: T | BinanceError,
    ): responce is T {
      if ('code' in responce && 'msg' in responce)
        throw new Error(`${responce.msg}`);
      return true;
    }

    public async getBalances(): Promise<Balance[] | Error> {
      type Account = {
        balances: Record<'asset' | 'free' | 'locked', string>[];
      };

      const timestamp = Date.now();

      const signature = createHmac('sha256', config.BINANCE_SECRET_KEY)
        .update(`timestamp=${timestamp}`)
        .digest('hex');

      const responce = await this.request<Account>(
        `account?signature=${signature}&timestamp=${timestamp}`,
      );

      if (responce instanceof Error) return responce;

      return responce.balances.map(({ asset, free, locked }) => ({
        asset,
        free: Number(free),
        locked: Number(locked),
      }));
    }

    public async getCandles(
      symbol: (typeof pairs)[number],
    ): Promise<Candle[] | Error> {
      const responce = await this.request<string[][]>(
        // `klines?interval=1d&limit=35&symbol=${symbol}`,
        `klines?interval=15m&limit=35&symbol=${symbol}`,
      );
      if (responce instanceof Error) return responce;

      return responce.map(([, open, high, low, close]) => ({
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
      }));
    }
  })();
