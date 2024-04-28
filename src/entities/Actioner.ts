import { Asset, Pair } from '../config';
import { EntityEvent, EntityWithEvents } from '../includes/EntityWithEvents';
import { ErrorInfo } from '../includes/ErrorInfo';
import { sleep } from '../includes/sleep';
import { BinanceRepository } from './Binance';
import { Order } from './Order';
import { getQuantity } from './Order/getQuantity';
import { SpotService } from './Spot/SpotService';

type ActionerOptions = {
  typeOrder?: Order['type'];
};

export class Actioner extends EntityWithEvents<{
  createdOrder: EntityEvent<Order>;
  filledSell: EntityEvent<Order>;
}> {
  private typeOrder;

  public constructor(options: ActionerOptions = {}) {
    super();
    this.typeOrder = options.typeOrder || 'LIMIT';
  }

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
    const lotParams = await BinanceRepository.getLotParams(pair);
    let resultOrder;

    while (true) {
      const currentPrice = await BinanceRepository.getPrice(pair);
      let assetForOrder = usdt / currentPrice;

      const quantity = getQuantity(assetForOrder, currentPrice, lotParams);
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
        this.typeOrder,
      );

      console.log('Actioner.buy newOrder', newOrder);

      const order = await this.repeat(newOrder);
      console.log(
        '2 Actioner.buy newOrder',
        pair,
        (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
          .free,
      );
      usdt -= order.cummulativeQuoteQty;
      assetForOrder = usdt / currentPrice;

      if (order.isFilled && lotParams.stepSize >= assetForOrder) {
        resultOrder = order;
        break;
      }
    }

    return resultOrder;
  }

  public async sell(pair: Pair, qty: number): Promise<Order> {
    console.log('Actioner.sell');
    const lotParams = await BinanceRepository.getLotParams(pair);
    let resultOrder;

    if (lotParams.stepSize >= qty) {
      throw new ErrorInfo('Actioner.sell', 'stepSize >= qty ', {
        stepSize: lotParams.stepSize,
        asset: qty,
      });
    }

    while (true) {
      const currentPrice = await BinanceRepository.getPrice(pair);

      const validQty = getQuantity(qty, currentPrice, lotParams);
      console.log('1 Actioner.sell newOrder', {
        pair,
        free: (
          await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset)
        ).free,
        lotParams,
        validQty,
      });

      const newOrder = await BinanceRepository.createOrder(
        pair,
        currentPrice,
        'SELL',
        validQty,
        this.typeOrder,
      );

      console.log('Actioner.sell newOrder', newOrder);

      const order = await this.repeat(newOrder);
      console.log(
        '2 Actioner.sell newOrder',
        pair,
        (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset))
          .free,
      );

      qty -= order.executedQty;
      if (order.isFilled && lotParams.stepSize >= qty) {
        resultOrder = order;
        break;
      }
    }

    SpotService.runEvent('filledSell', resultOrder);
    return resultOrder;
  }
}
