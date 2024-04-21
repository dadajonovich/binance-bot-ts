import { Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { sleep } from '../../includes/utils/sleep';
import { BinanceRepository } from '../../repositories/binance';

export type OrderProps = {
  symbol: Pair;
  orderId: number;
  price: string;
  side: 'SELL' | 'BUY';
  type: 'LIMIT' | 'MARKET';
  status: 'NEW' | 'PARTIALLY_FILLED' | 'CACANCELED';
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
};

export class Order {
  public symbol: Pair;
  public orderId: number;
  public price: number;
  public side: 'SELL' | 'BUY';
  public type: 'LIMIT' | 'MARKET';
  public status: 'NEW' | 'PARTIALLY_FILLED' | 'CACANCELED';
  public origQty: number;
  public executedQty: number;
  public cummulativeQuoteQty: number;

  public constructor(
    {
      symbol,
      orderId,
      price,
      status,
      type,
      side,
      origQty,
      executedQty,
      cummulativeQuoteQty,
    }: OrderProps | Order,
    // order: OrderProps,
  ) {
    // Object.entries(order).forEach(([key, value]) => {
    //   this[key as keyof OrderProps] = value;
    // });
    this.symbol = symbol;
    this.orderId = orderId;
    this.status = status;
    this.type = type;
    this.side = side;
    this.price = Number(price);
    this.origQty = Number(origQty);
    this.executedQty = Number(executedQty);
    this.cummulativeQuoteQty = Number(cummulativeQuoteQty);
  }

  public static async buy(pair: Pair, usdt: number): Promise<Order> {
    console.log('Order buy!');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = Order.getQuantity(100 / currentPrice, stepSize);

    const order = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'BUY',
      quantity,
    );

    await sleep(1000 * 60 * 0.25);

    order.set(await BinanceRepository.getOrder(order.symbol, order.orderId));
    if (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED') {
      return order;
    }
    order.set(await BinanceRepository.cancelOrder(order.symbol, order.orderId));
    return await Order.buy(order.symbol, 100 - order.cummulativeQuoteQty);
  }

  public static async sell(pair: Pair, asset: number): Promise<Order> {
    console.log('Order sell!');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    if (stepSize >= asset) {
      throw new ErrorInfo('Order.sell', 'stepSize >= asset', {
        stepSize,
        asset,
      });
    }

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = Order.getQuantity(asset, stepSize);

    const order = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'SELL',
      quantity,
    );

    await sleep(1000 * 60 * 0.25);

    order.set(await BinanceRepository.getOrder(order.symbol, order.orderId));

    if (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED') {
      return order;
    }
    order.set(await BinanceRepository.cancelOrder(order.symbol, order.orderId));
    return await Order.sell(order.symbol, asset - order.executedQty);
  }

  public static getQuantity(quantityAsset: number, stepSize: number): number {
    const [integer, decimal] = String(quantityAsset).split('.');
    if (decimal === undefined) return Number(integer);

    const length = stepSize.toString().replaceAll(/[^0]/g, '').length;

    const quantityDecimal = decimal.slice(0, length);

    const quantity = [integer, quantityDecimal].filter((str) => str).join('.');

    console.log(quantityAsset, stepSize, quantity);
    return Number(quantity);
  }

  private set(order: Order | OrderProps) {
    const {
      symbol,
      orderId,
      price,
      // origQty,
      cummulativeQuoteQty,
      status,
      type,
      side,
      executedQty,
    } = order;

    this.symbol = symbol;
    this.orderId = orderId;
    this.status = status;
    this.type = type;
    this.side = side;
    this.price = Number(price);
    // this.origQty = Number(origQty);
    this.executedQty = Number(executedQty);
    this.cummulativeQuoteQty = Number(cummulativeQuoteQty);
  }
}
