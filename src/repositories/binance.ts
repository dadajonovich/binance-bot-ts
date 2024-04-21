import { Pair, binanceUrl, config } from '../config';
import { Repository } from '../includes/Repository';
import { createHmac } from 'node:crypto';
import { toQuery } from '../includes/utils/toQuery';
import { Order, OrderProps } from '../entities/Order';
import { Kline } from '../entities/Kline';

type BinanceError = {
  code: number;
  msg: string;
};

type Balance = {
  asset: string;
  free: number;
  locked: number;
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
      options: RequestInit = {},
    ): Promise<T> {
      const timestamp = Date.now();

      const queryObjectForHmac = { ...queryObject, timestamp };

      // Удаляем "?" т.к. он не нужен в update
      const queryForHmac = toQuery(queryObjectForHmac).slice(1);

      const signature = createHmac('sha256', config.BINANCE_SECRET_KEY)
        .update(queryForHmac)
        .digest('hex');

      // const query = toQuery({ ...queryObjectForHmac, signature });

      const responce = await this.request<T>(
        url,
        {
          ...queryObjectForHmac,
          signature,
        },
        options,
      );
      return responce;
    }

    public async getBalances(): Promise<Balance[]>;
    public async getBalances(asset: string): Promise<Balance>;

    public async getBalances(asset?: string): Promise<Balance[] | Balance> {
      type Account = {
        balances: Record<'asset' | 'free' | 'locked', string>[];
      };

      const responce = await this.protectedRequest<Account>(`account`);

      if (asset) {
        const assetBalance = responce.balances.find(
          (balance) => balance.asset === asset,
        );

        if (!assetBalance) throw new Error('Invalid asset');
        else {
          const { asset, free, locked } = assetBalance;
          return { asset, free: Number(free), locked: Number(locked) };
        }
      }

      return responce.balances.map(({ asset, free, locked }) => ({
        asset,
        free: Number(free),
        locked: Number(locked),
      }));
    }

    public async getKlines(symbol: Pair): Promise<Kline[]> {
      const responce = await this.request<string[][]>(
        // `klines?interval=1d&limit=35&symbol=${symbol}`,
        `klines`,
        { interval: '1s', limit: 35, symbol },
      );

      return responce.map(([, open, high, low, close]) => ({
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
      }));
    }

    public async getLotParams(
      symbol: Pair,
    ): Promise<Record<'stepSize' | 'tickSize', number>> {
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
          symbol: Pair;
          filters: (PriceFilter | LotFilter)[];
        }[];
      };

      const responce = await this.request<ExchangeInfo>(`exchangeInfo`, {
        symbol,
      });

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

      throw new Error('Filter not found');
    }

    public async getOpenOrders(symbol?: Pair): Promise<Order[]> {
      const responce = await this.protectedRequest<Order[]>('openOrders', {
        symbol,
      });
      return responce.map((order) => new Order(order));
    }

    public async getPrice(symbol: Pair): Promise<number> {
      type TickerPrice = { symbol: string; price: string };
      const responce = await this.request<TickerPrice>(`ticker/price`, {
        symbol,
      });

      return Number(responce.price);
    }

    public async createOrder(
      symbol: Pair,
      price: number,
      side: Order['side'],
      quantity: number,
      type: Order['type'] = 'LIMIT',
      timeInForce = 'GTC',
    ): Promise<Order> {
      return new Order(
        await this.protectedRequest<OrderProps>(
          'order',
          {
            symbol,
            price,
            side,
            quantity,
            type,
            timeInForce,
          },
          { method: 'POST' },
        ),
      );
    }

    public async cancelOrder(symbol: Pair, orderId: number): Promise<Order> {
      return new Order(
        await this.protectedRequest<OrderProps>(
          'order',
          { symbol, orderId },
          { method: 'DELETE' },
        ),
      );
    }

    public async getOrder(symbol: Pair, orderId: number): Promise<Order> {
      const [order] = await this.protectedRequest<OrderProps[]>('allOrders', {
        symbol,
        orderId,
      });
      if (!order) throw new Error('Not found order');
      return new Order(order);
    }
  })();
