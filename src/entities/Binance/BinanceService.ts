import { Order } from '../Order/Order';
import { BinanceRepository } from '.';
import { sleep } from '../../includes/sleep';
import { Asset, Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { getQuantity } from '../Order/getQuantity';
import { SpotService } from '../Spot/SpotService';

export class BinanceService {
  protected static async handleCreateOrder(order: Order): Promise<void> {}
  protected static async deleteOrder(orderId: number): Promise<void> {}

  private static async repeat(order: Order): Promise<Order> {
    const { symbol, orderId } = order;

    if (order.isFilled) {
      return order;
    }
    await sleep(1000 * 60 * 0.25);

    const currentOrder = await BinanceRepository.getOrder(symbol, orderId);

    if (currentOrder.isFilled) {
      return currentOrder;
    }

    const canceledOrder = await BinanceRepository.cancelOrder(symbol, orderId);
    return canceledOrder;
  }

  public static async buy(pair: Pair, usdt: number): Promise<Order> {
    console.log('BinanceService.buy');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = getQuantity(usdt / currentPrice, stepSize);
    console.log(
      '1 BinanceService.buy newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    const newOrder = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'BUY',
      quantity,
    );

    await this.handleCreateOrder(newOrder);
    console.log('BinanceService.buy newOrder', newOrder);

    const order = await BinanceService.repeat(newOrder);
    console.log(
      '2 BinanceService.buy newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    if (order.isFilled) return order;

    await this.deleteOrder(order.orderId);

    return await BinanceService.buy(
      order.symbol,
      usdt - order.cummulativeQuoteQty,
    );
  }

  public static async sell(pair: Pair, qty: number): Promise<Order> {
    console.log('BinanceService.sell');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    if (stepSize >= qty) {
      throw new ErrorInfo('BinanceService.sell', 'stepSize >= qty', {
        stepSize,
        asset: qty,
      });
    }

    const currentPrice = await BinanceRepository.getPrice(pair);

    const validQty = getQuantity(qty, stepSize);
    console.log(
      '1 BinanceService.sell newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    const newOrder = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'SELL',
      validQty,
    );

    console.log('BinanceService.sell newOrder', newOrder);

    const lastOrder = await SpotService.getLast();
    if (lastOrder) await this.deleteOrder(lastOrder.orderId);

    await this.handleCreateOrder(newOrder);

    const order = await BinanceService.repeat(newOrder);
    console.log(
      '2 BinanceService.sell newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    if (order.isFilled) {
      await this.deleteOrder(order.orderId);
      return order;
    }

    return await BinanceService.sell(order.symbol, qty - order.executedQty);
  }
}
