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
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = Order.getQuantity(usdt / currentPrice, stepSize);

    const order = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'BUY',
      quantity,
    );

    await sleep(1000 * 60 * 5);

    order.set(await BinanceRepository.getOrder(order.symbol, order.orderId));

    if (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED') {
      return order;
    }
    order.set(await BinanceRepository.cancelOrder(order.symbol, order.orderId));
    return Order.buy(order.symbol, usdt - order.cummulativeQuoteQty);
  }

  public static getQuantity(quantityAsset: number, stepSize: number) {
    const quantity = quantityAsset - (quantityAsset % stepSize);

    return quantity;
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
