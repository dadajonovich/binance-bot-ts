import { Asset, Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { sleep } from '../../includes/sleep';
import { BinanceRepository } from '.';
import { Order } from '../Order/Order';
import { getQuantity } from '../Order/getQuantity';

export class BinanceService {
  private static async repeat(order: Order): Promise<Order> {
    if (order.isFilled) return order;
    await sleep(1000 * 60 * 0.25);

    const { symbol, orderId } = order;
    const currentOrder = await BinanceRepository.getOrder(symbol, orderId);

    if (order.isFilled) {
      return currentOrder;
    }
    return await BinanceRepository.cancelOrder(symbol, orderId);
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
    console.log('BinanceService.buy newOrder', newOrder);

    const order = await BinanceService.repeat(newOrder);
    console.log(
      '2 BinanceService.buy newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    if (order.isFilled) return order;

    return await BinanceService.buy(
      order.symbol,
      usdt - order.cummulativeQuoteQty,
    );
  }

  public static async sell(pair: Pair, qty: number): Promise<Order> {
    console.log('BinanceService.sell');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

    if (stepSize >= qty) {
      throw new ErrorInfo('Order.sell', 'stepSize >= qty', {
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

    const order = await BinanceService.repeat(newOrder);
    console.log(
      '2 BinanceService.sell newOrder',
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
        .free,
    );
    if (order.isFilled) return order;

    return await BinanceService.sell(order.symbol, qty - order.executedQty);
  }
}
