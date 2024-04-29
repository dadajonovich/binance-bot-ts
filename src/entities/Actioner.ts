import { Asset, Pair } from '../config';
import { EntityEvent, EntityWithEvents } from '../includes/EntityWithEvents';
import { ErrorInfo } from '../includes/ErrorInfo';
import { sleep } from '../includes/sleep';
import { BinanceRepository, LotParams } from './Binance';
import { Order, getQuantity } from './Order';

type ActionerOptions = {
  typeOrder?: Order['type'];
};

export type ActionResult = {
  symbol: Pair;
  usdt: number;
  side: 'BUY' | 'SELL';

};

class Action {

public typeOrder

  public constructor(
    public symbol: Pair,
    public usdt: number,
    public side: 'BUY' | 'SELL',
    options: ActionerOptions
  ) {this.typeOrder = options.typeOrder || 'LIMIT';}


private async step(qty: number,lotParams: LotParams) {





  const minQty = lotParams.minNotional / currentPrice;

  if (minQty >= qty) {
    break;
  }

  const quantity = getQuantity(qty, currentPrice, lotParams);
  console.log(
    '1 BinanceService.buy newOrder',
    this.symbol,
    (await BinanceRepository.getBalances(this.symbol.replace('USDT', '') as Asset))
      .free,
  );
  const newOrder = await BinanceRepository.createOrder(
    this.symbol,
    currentPrice,
    this.side,
    quantity,
    this.typeOrder,
  );

  console.log('Actioner.buy newOrder', newOrder);

  const order = await this.repeat(newOrder);
  console.log(
    '2 Actioner.buy newOrder',
    this.symbol,
    (await BinanceRepository.getBalances(this.symbol.replace('USDT', '') as Asset))
      .free,
  );

}

  public async run(qty: number) {
    console.log('Actioner.buy');
    const lotParams = await BinanceRepository.getLotParams(pair);
    const resultBuy: ActionResult = { symbol: pair, usdt: 0, side: 'BUY' };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentPrice = await BinanceRepository.getPrice(this.symbol);
      const qty = this.side === "BUY" ? qty / currentPrice : qty
 this.step(qty, lotParams)
    }

    return resultBuy;
  }
  }
}

export class Actioner extends EntityWithEvents<{
  createdOrder: EntityEvent<Order>;
  filledSell: EntityEvent<ActionResult>;
}> {
  private typeOrder;

  public constructor(options: ActionerOptions = {}) {
    super();
    this.typeOrder = options.typeOrder || 'LIMIT';
  }

  private async repeat(order: Order): Promise<Order> {
    const { symbol, orderId } = order;
    this.runEvent('createdOrder', order);

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

  public async buy(pair: Pair, usdt: number): Promise<ActionResult> {
    console.log('Actioner.buy');
    const lotParams = await BinanceRepository.getLotParams(pair);
    const resultBuy: ActionResult = { symbol: pair, usdt: 0, side: 'BUY' };

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentPrice = await BinanceRepository.getPrice(pair);
      let assetForOrder = usdt / currentPrice;

      const minQty = lotParams.minNotional / currentPrice;

      if (minQty >= assetForOrder) {
        break;
      }

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
      resultBuy.usdt += order.cummulativeQuoteQty;
      assetForOrder = usdt / currentPrice;

      if (order.isFilled && lotParams.stepSize >= assetForOrder) {
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

      const minQty = lotParams.minNotional / currentPrice;

      if (minQty >= qty) {
        break;
      }

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
      resultSell.usdt += order.executedQty * currentPrice;
      if (order.isFilled && lotParams.stepSize >= qty) {
        break;
      }
    }

    this.runEvent('filledSell', resultSell);
    return resultSell;
  }
}
