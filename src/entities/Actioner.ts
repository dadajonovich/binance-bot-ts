import { Asset, Pair } from '../config';
import { EntityEvent, EntityWithEvents } from '../includes/EntityWithEvents';
import { ErrorInfo } from '../includes/ErrorInfo';
import { sleep } from '../includes/sleep';
import { BinanceRepository } from './Binance';
import { Order } from './Order';
import { getQuantity } from './Order/getQuantity';
import { SpotService } from './Spot/SpotService';

export class Actioner extends EntityWithEvents<{
  createdOrder: EntityEvent<Order>;
  filledSell: EntityEvent<Order>;
}> {
  private async repeat(order: Order): Promise<Order> {
    const { symbol, orderId } = order;
    SpotService.runEvent('createdOrder', order);

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

  public async buy(pair: Pair, usdt: number): Promise<Order> {
    console.log('Actioner.buy');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);
    let resultOrder;

    while (true) {
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

      console.log('Actioner.buy newOrder', newOrder);

      const order = await this.repeat(newOrder);
      console.log(
        '2 Actioner.buy newOrder',
        pair,
        (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
          .free,
      );
      if (order.isFilled) {
        resultOrder = order;
        break;
      }

      usdt -= order.cummulativeQuoteQty;
    }

    return resultOrder;
  }

  public async sell(pair: Pair, qty: number): Promise<Order> {
    console.log('Actioner.sell');
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);
    let resultOrder;

    if (stepSize >= qty) {
      throw new ErrorInfo('Actioner.sell', 'stepSize >= qty', {
        stepSize,
        asset: qty,
      });
    }

    while (true) {
      const currentPrice = await BinanceRepository.getPrice(pair);

      const validQty = getQuantity(qty, stepSize);
      console.log(
        '1 Actioner.sell newOrder',
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

      console.log('Actioner.sell newOrder', newOrder);

      const order = await this.repeat(newOrder);
      console.log(
        '2 Actioner.sell newOrder',
        pair,
        (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
          .free,
      );
      if (order.isFilled) {
        resultOrder = order;
        break;
      }

      qty -= order.executedQty;
    }

    SpotService.runEvent('filledSell', resultOrder);
    return resultOrder;
  }
}
