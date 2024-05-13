import { Pair } from '../config';
import { EntityWithEvents } from '../includes/EntityWithEvents';
import { ErrorInfo } from '../includes/ErrorInfo';
import { sleep } from '../includes/sleep';
import { BinanceRepository, LotParams } from './Binance';
import { Order } from './Order';
import { OrderService } from './Order';

type OrderOptions = {
  typeOrder?: Order['type'];
};

export type ActionResult = {
  pair: Order['symbol'];
  side: Order['side'];
  usdt: number;
};

export class Executor extends EntityWithEvents<{
  createdOrder: Order;
  filled: void;
}> {
  private readonly orderOptions: OrderOptions;
  private lotParams: LotParams;
  private readonly pair: Pair;
  private usdt: number = 0;
  private _currentPrice?: number;
  private _order?: Order;

  public static async create(
    pair: Pair,
    options: OrderOptions = {},
  ): Promise<Executor> {
    const lotParams = await BinanceRepository.getLotParams(pair);

    return new Executor(pair, lotParams, options);
  }

  private constructor(
    pair: Pair,
    lotParams: LotParams,
    options: OrderOptions = {},
  ) {
    super();

    this.pair = pair;
    this.lotParams = lotParams;
    this.orderOptions = options;
  }

  public async buy(usdtQty: number): Promise<void> {
    const { pair } = this;

    console.log('Action.buy');
    let muchUsdt = usdtQty;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      this.currentPrice = await BinanceRepository.getPrice(pair);
      const qty = this.usdtToQty(muchUsdt);

      if (!this.isQtyGreaterMin(qty)) break;

      const order = await this.execute('BUY', qty);
      if (!order) break;

      this.order = order;

      muchUsdt -= order.cummulativeQuoteQty;
      this.usdt += order.cummulativeQuoteQty;
      // muchUsdt = usdtQty - this.usdt;

      if (this.isSuccess(this.usdtToQty(muchUsdt))) break;
    }
  }

  private usdtToQty(usdt: number): number {
    return usdt / this.currentPrice;
  }

  public async sell(qty: number): Promise<void> {
    const { pair, lotParams } = this;

    let muchQty = qty;

    console.log('Action.sell');

    if (lotParams.stepSize >= qty) {
      throw new ErrorInfo('Action.sell', 'stepSize >= qty', {
        stepSize: lotParams.stepSize,
        asset: qty,
      });
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      this.currentPrice = await BinanceRepository.getPrice(pair);

      if (!this.isQtyGreaterMin(muchQty)) break;

      const order = await this.execute('SELL', muchQty);
      if (!order) break;

      this.order = order;

      this.usdt += order.executedQty * this.currentPrice;
      muchQty -= order.executedQty;

      if (this.isSuccess(muchQty)) break;
    }

    await this.runEvent('filled');
  }

  public get result(): ActionResult {
    return {
      pair: this.pair,
      usdt: this.usdt,
      side: this.order.side,
    };
  }

  private async execute(side: 'BUY' | 'SELL', qty: number): Promise<Order> {
    const { currentPrice, orderOptions, pair } = this;

    const order = await OrderService.createOrder(
      pair,
      currentPrice,
      side,
      this.toValidQty(qty),
      orderOptions.typeOrder,
    );

    console.log('Action.execute: newOrder =', order);
    await this.runEvent('createdOrder', order);
    if (order.isFilled) return order;

    await sleep(1000 * 60 * 0.25);

    const { symbol, orderId } = order;

    const currentOrderDto = await BinanceRepository.getOrder(symbol, orderId);
    const currentOrder = await OrderService.updateOrCreate(currentOrderDto);

    if (currentOrder.isFilled) return currentOrder;

    return await BinanceRepository.cancelOrder(symbol, orderId);
  }

  private toValidQty(qty: number): number {
    const { currentPrice, lotParams } = this;

    const { stepSize, maxNotional } = lotParams;

    const maxQty = maxNotional / currentPrice;

    const [integer, decimal] = String(qty).split('.');
    if (decimal === undefined) return Math.min(Number(integer), maxQty);

    const length = stepSize.toString().replaceAll(/[^0]/g, '').length;

    const quantityDecimal = decimal.slice(0, length);

    const quantity = [integer, quantityDecimal].filter((str) => str).join('.');

    return Math.min(Number(quantity), maxQty);
  }

  private get currentPrice(): number {
    const { _currentPrice } = this;

    if (_currentPrice === undefined) {
      throw new ErrorInfo(
        'Action.currentPrice',
        '_currentPrice не установлен',
        this,
      );
    }

    return _currentPrice;
  }
  private set currentPrice(value: number) {
    this._currentPrice = value;
  }

  private get order(): Order {
    const { _order } = this;

    if (_order === undefined) {
      throw new ErrorInfo('Action.order', '_order не установлен', this);
    }

    return _order;
  }
  private set order(value: Order) {
    this._order = value;
  }

  private isSuccess(qty: number) {
    const { lotParams, order } = this;

    return order.isFilled && lotParams.stepSize >= qty;
  }

  private isQtyGreaterMin(qty: number): boolean {
    const { lotParams, currentPrice } = this;

    return qty > lotParams.minNotional / currentPrice;
  }
}
