import { binanceUrl, config, pairs } from '../config';
import { Repository } from '../includes/Repository';
import { Balance, Candle } from '../types';
import { createHmac } from 'node:crypto';
import { toQuery } from '../includes/toQuery';

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

    private async protectedRequest<T extends object>(
      url: string,
      queryObject: Record<string, any> = {},
    ): Promise<T | Error> {
      const timestamp = Date.now();

      const queryObjectForHmac = { ...queryObject, timestamp };

      // Удаляем "?" т.к. он не нужен в update
      const queryForHmac = toQuery(queryObjectForHmac).slice(1);

      const signature = createHmac('sha256', config.BINANCE_SECRET_KEY)
        .update(queryForHmac)
        .digest('hex');

      const query = toQuery({ ...queryObjectForHmac, signature });

      const responce = await this.request<T>(`${url}${query}`);
      return responce;
    }

    public async getBalances(): Promise<Balance[] | Error> {
      type Account = {
        balances: Record<'asset' | 'free' | 'locked', string>[];
      };

      const responce = await this.protectedRequest<Account>(`account`);

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

    public async getLotParams(
      symbol: (typeof pairs)[number],
    ): Promise<Record<'stepSize' | 'tickSize', number> | Error> {
      type PriceFilter = {
        filterType: 'PRICE_FILTER';
        tickSize: string;
      };
      type LotFilter = {
        filterType: 'LOT_SIZE';
        stepSize: string;
      };

      type ExchangeInfo = {
        symbols: {
          symbol: (typeof pairs)[number];
          filters: (PriceFilter | LotFilter)[];
        }[];
      };

      const responce = await this.request<ExchangeInfo>(
        `exchangeInfo?symbol=${symbol}`,
      );

      if (responce instanceof Error) return responce;

      const symbolObject = responce.symbols.find(
        ({ symbol: symbolName }) => symbolName === symbol,
      );

      const lotSizeFilter = symbolObject?.filters.find(
        (f): f is LotFilter => f.filterType === 'LOT_SIZE',
      );
      const priceFilter = symbolObject?.filters.find(
        (f): f is PriceFilter => f.filterType === 'PRICE_FILTER',
      );

      if (lotSizeFilter && priceFilter)
        return {
          stepSize: Number(lotSizeFilter.stepSize),
          tickSize: Number(priceFilter.tickSize),
        };

      return new Error('Filter not found');
    }

    public async getOpenOrders(symbol?: (typeof pairs)[number]) {
      type OpenOrder = {
        symbol: (typeof pairs)[number];
        status: string;
        type: string;
        side: string;
      };

      const responce = await this.protectedRequest<OpenOrder>('openOrders', {
        symbol,
      });
      if (responce instanceof Error) return responce;

      return responce;
    }
  })();
