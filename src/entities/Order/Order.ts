import { Pair } from '../../config';
import { sleep } from '../../includes/utils/sleep';
import { BinanceRepository } from '../../repositories/binance';

export type OrderProps = {
  symbol: Pair;
  orderId: number;
  price: number;
  side: 'SELL' | 'BUY';
  type: 'LIMIT' | 'MARKET';
  status: 'NEW' | 'PARTIALLY_FILLED' | 'CACANCELED';
  executedQty: number;
  cummulativeQuoteQty: number;
};

export class Order implements OrderProps {
  public symbol;
  public orderId;
  public status;
  public type;
  public side;
  public price;
  public executedQty;
  public cummulativeQuoteQty;

  public constructor(
    {
      symbol,
      orderId,
      price,
      status,
      type,
      side,
      executedQty,
      cummulativeQuoteQty,
    }: OrderProps,
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
    this.price = price;
    this.executedQty = executedQty;
    this.cummulativeQuoteQty = cummulativeQuoteQty;
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
    console.log(1, order);

    await sleep(1000 * 60 * 0.25);

    order.set(await BinanceRepository.getOrder(order.symbol, order.orderId));
    console.log(2, order);
    if (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED') {
      return order;
    }
    order.set(await BinanceRepository.cancelOrder(order.symbol, order.orderId));
    return Order.buy(order.symbol, usdt - order.cummulativeQuoteQty);
  }

  public static async sell(pair: Pair, asset: number): Promise<Order | null> {
    console.log('Order sell!');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    if (stepSize >= asset) {
      return null;
    }

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = Order.getQuantity(asset, stepSize);

    const order = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'SELL',
      quantity,
    );
    console.log(1, order);

    await sleep(1000 * 60 * 0.25);

    order.set(await BinanceRepository.getOrder(order.symbol, order.orderId));
    console.log(2, order);

    if (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED') {
      return order;
    }
    order.set(await BinanceRepository.cancelOrder(order.symbol, order.orderId));
    console.log(3, order);
    return Order.sell(order.symbol, asset - order.executedQty);
  }

  public static getQuantity(quantityAsset: number, stepSize: number): number {
    const [integer, decimal] = String(quantityAsset).split('.');
    if (decimal === undefined) return Number(integer);

    const length = stepSize.toString().replaceAll(/[^0]/gim, '').length;

    const quantityDecimal = decimal.slice(0, length);

    const quantity = [integer, quantityDecimal].filter((str) => str).join('.');

    console.log(quantityAsset, stepSize, quantity);
    return Number(quantity);
  }

  private set(order: Order | OrderProps) {
    const { symbol, orderId, price, status, type, side, executedQty } = order;

    this.symbol = symbol;
    this.orderId = orderId;
    this.status = status;
    this.type = type;
    this.side = side;
    this.price = price;
    this.executedQty = executedQty;
  }
}
