import { Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { sleep } from '../../includes/utils/sleep';
import { BinanceRepository } from '../../repositories/binance';
import { Order, OrderProps } from './Order';

export class OrderService {
  private static async update(
    order: Order,
    orderProps: OrderProps,
  ): Promise<Order> {
    const { status, executedQty, cummulativeQuoteQty } = orderProps;

    return await order.update({
      status,
      executedQty: Number(executedQty),
      cummulativeQuoteQty: Number(cummulativeQuoteQty),
    });
  }

  public static async get(orderId: number): Promise<Order> {
    const order = await this.getByPk(orderId);
    const { symbol } = order;

    const responce = await BinanceRepository.getOrder(symbol, orderId);

    return await this.update(order, responce);
  }

  public static async cancel(orderId: number): Promise<Order> {
    const order = await this.getByPk(orderId);

    const { symbol } = order;

    const responce = await BinanceRepository.cancelOrder(symbol, orderId);

    return await this.update(order, responce);
  }

  private static async create(
    symbol: Pair,
    price: number,
    side: Order['side'],
    quantity: number,
    type: Order['type'] = 'LIMIT',
  ): Promise<Order> {
    const responce = await BinanceRepository.createOrder(
      symbol,
      price,
      side,
      quantity,
      type,
    );

    const { orderId, status, executedQty, cummulativeQuoteQty, origQty } =
      responce;

    return await Order.create({
      orderId,
      symbol,
      price,
      side,
      type,
      status,
      executedQty: Number(executedQty),
      cummulativeQuoteQty: Number(cummulativeQuoteQty),
      origQty: Number(origQty),
    });
  }

  private static async getByPk(orderId: number): Promise<Order> {
    return await Order.findByPk(orderId, {
      rejectOnEmpty: new ErrorInfo(
        'BinanceRepository.getOrder',
        'orderId не найден',
        { orderId },
      ),
    });
  }

  public static async buy(pair: Pair, usdt: number): Promise<Order> {
    console.log('Order buy!');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = this.getQuantity(100 / currentPrice, stepSize);

    const order = await OrderService.create(
      pair,
      currentPrice,
      'BUY',
      quantity,
    );
    await sleep(1000 * 60 * 0.25);

    const currentOrder = await OrderService.get(order.orderId);

    if (
      currentOrder.status !== 'NEW' &&
      currentOrder.status !== 'PARTIALLY_FILLED'
    ) {
      return currentOrder;
    }
    const canceledOrder = await OrderService.cancel(currentOrder.orderId);
    return await this.buy(
      canceledOrder.symbol,
      100 - canceledOrder.cummulativeQuoteQty,
    );
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

    const quantity = this.getQuantity(asset, stepSize);

    const order = await OrderService.create(
      pair,
      currentPrice,
      'SELL',
      quantity,
    );

    await sleep(1000 * 60 * 0.25);

    const currentOrder = await this.get(order.orderId);

    if (
      currentOrder.status !== 'NEW' &&
      currentOrder.status !== 'PARTIALLY_FILLED'
    ) {
      return currentOrder;
    }
    const cancelOrder = await OrderService.cancel(currentOrder.orderId);
    return await this.sell(cancelOrder.symbol, asset - cancelOrder.executedQty);
  }

  private static getQuantity(quantityAsset: number, stepSize: number): number {
    const [integer, decimal] = String(quantityAsset).split('.');
    if (decimal === undefined) return Number(integer);

    const length = stepSize.toString().replaceAll(/[^0]/g, '').length;

    const quantityDecimal = decimal.slice(0, length);

    const quantity = [integer, quantityDecimal].filter((str) => str).join('.');

    console.log('getQuantity', quantityAsset, stepSize, quantity);
    return Number(quantity);
  }

  public static async getOpen(): Promise<Order[]> {
    return await Order.findAll({ where: { status: 'NEW' } });
  }

  public static async getLast(): Promise<Order | null> {
    return await Order.findOne({ order: [['orderId', 'DESC']] });
  }
}
