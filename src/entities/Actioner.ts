import { type Asset, Pair } from '../config';
import { EntityEvent, EntityWithEvents } from '../includes/EntityWithEvents';
import { ErrorInfo } from '../includes/ErrorInfo';
import { sleep } from '../includes/sleep';
import { BinanceRepository, LotParams } from './Binance';
import { getQuantity, Order } from './Order';

type ActionerOptions = {
  typeOrder?: Order['type'];
};

export type ActionResult = {
  symbol: Pair;
  usdt: number;
  side: 'BUY' | 'SELL';
};

export class Actioner extends EntityWithEvents<{
  createdOrder: EntityEvent<Order>;
  filledSell: EntityEvent<ActionResult>;
}> {
  private readonly typeOrder;

  public constructor(options: ActionerOptions = {}) {
    super();
    this.typeOrder = options.typeOrder || 'LIMIT';
  }

  public async buy(pair: Pair, usdt: number): Promise<ActionResult> {
    console.log('Actioner.buy');
    const lotParams = await BinanceRepository.getLotParams(pair);
    const resultBuy: ActionResult = { symbol: pair, usdt: 0, side: 'BUY' };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentPrice = await BinanceRepository.getPrice(pair);
      let qty = usdt / currentPrice;

      const order = await this.step(pair, 'BUY', qty, currentPrice, lotParams);
      if (!order) break;

      usdt -= order.cummulativeQuoteQty;
      resultBuy.usdt += order.cummulativeQuoteQty;
      qty = usdt / currentPrice;

      if (order.isFilled && lotParams.stepSize >= qty) {
        break;
      }
    }

    return resultBuy;
  }

  public async sell(pair: Pair, qty: number): Promise<ActionResult> {
    console.log('Actioner.sell');
    const lotParams = await BinanceRepository.getLotParams(pair);
    const resultSell: ActionResult = { symbol: pair, usdt: 0, side: 'SELL' };

    if (lotParams.stepSize >= qty) {
      throw new ErrorInfo('Actioner.sell', 'stepSize >= qty ', {
        stepSize: lotParams.stepSize,
        asset: qty,
      });
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentPrice = await BinanceRepository.getPrice(pair);

      const order = await this.step(pair, 'SELL', qty, currentPrice, lotParams);
      if (!order) break;

      qty -= order.executedQty;
      resultSell.usdt += order.executedQty * currentPrice;

      if (order.isFilled && lotParams.stepSize >= qty) break;
    }

    await this.runEvent('filledSell', resultSell);
    return resultSell;
  }

  private async repeat(order: Order): Promise<Order> {
    const { symbol, orderId } = order;
    await this.runEvent('createdOrder', order);

    if (order.isFilled) {
      return order;
    }
    await sleep(1000 * 60 * 0.25);

    const currentOrder = await BinanceRepository.getOrder(symbol, orderId);

    if (currentOrder.isFilled) {
      return currentOrder;
    }

    return await BinanceRepository.cancelOrder(symbol, orderId);
  }

  private async step(
    pair: Pair,
    side: 'BUY' | 'SELL',
    qty: number,
    currentPrice: number,
    lotParams: LotParams,
  ): Promise<Order | null> {
    const minQty = lotParams.minNotional / currentPrice;

    if (minQty >= qty) return null;

    const validQty = getQuantity(qty, currentPrice, lotParams);

    console.log(
      `1 Actioner.${side} newOrder`,
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset)).free,
    );

    const newOrder = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      side,
      validQty,
      this.typeOrder,
    );

    console.log(
      `2 Actioner.${side} newOrder`,
      pair,
      (await BinanceRepository.getBalances(pair.replace('USDT', '') as Asset)).free,
    );

    return await this.repeat(newOrder);
  }
}
