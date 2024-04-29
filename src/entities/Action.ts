import { Pair } from '../config';
import { EntityWithEvents } from '../includes/EntityWithEvents';
import { ErrorInfo } from '../includes/ErrorInfo';
import { sleep } from '../includes/sleep';
import { BinanceRepository, LotParams } from './Binance';
import { Order } from './Order';

type OrderOptions = {
  typeOrder?: Order['type'];
};

export type ActionResult = {
  pair: Order['symbol'];
  side: Order['side'];
  usdt: number;
};

export class Action extends EntityWithEvents<{
  createdOrder: Order;
  filled: void;
}> {
  private readonly orderOptions: OrderOptions;
  private lotParams: LotParams;
  private readonly pair: Pair;
  private usdt: number = 0;

  public static async create(
    pair: Pair,
    options: OrderOptions = {},
  ): Promise<Action> {
    const lotParams = await BinanceRepository.getLotParams(pair);

    return new Action(pair, lotParams, options);
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

    // eslint-disable-next-line no-constant-condition
    while (true) {
      this.currentPrice = await BinanceRepository.getPrice(pair);
      this.qty = usdtQty / this.currentPrice;

      if (!this.qtyGreaterMin) break;

      const order = await this.execute('BUY');
      if (!order) break;

      this.order = order;

      this.usdt += order.cummulativeQuoteQty;

      usdtQty -= order.cummulativeQuoteQty;
      this.qty = usdtQty / this.currentPrice;

      if (this.isSuccess) break;
    }
  }

  public async sell(qty: number): Promise<void> {
    const { pair, lotParams } = this;

    console.log('Action.sell');

    if (lotParams.stepSize >= qty) {
      throw new ErrorInfo('Action.sell', 'stepSize >= qty', {
        stepSize: lotParams.stepSize,
        asset: qty,
      });
    }

    this.qty = qty;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      this.currentPrice = await BinanceRepository.getPrice(pair);

      if (!this.qtyGreaterMin) break;

      const order = await this.execute('SELL');
      if (!order) break;

      this.order = order;

      this.usdt += order.executedQty * this.currentPrice;

      this.qty -= order.executedQty;

      if (this.isSuccess) break;
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

  private async execute(side: 'BUY' | 'SELL'): Promise<Order> {
    const { currentPrice, orderOptions, pair } = this;

    const newOrder = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      side,
      this.validQty,
      orderOptions.typeOrder,
    );
    console.log('Action.execute: newOrder =', newOrder);
    await this.runEvent('createdOrder', newOrder);
    if (newOrder.isFilled) return newOrder;

    await sleep(1000 * 60 * 0.25);

    const { symbol, orderId } = newOrder;

    const currentOrder = await BinanceRepository.getOrder(symbol, orderId);
    if (currentOrder.isFilled) return currentOrder;

    return await BinanceRepository.cancelOrder(symbol, orderId);
  }

  private get validQty(): number {
    const { qty, currentPrice, lotParams } = this;

    const { stepSize, maxNotional } = lotParams;

    const maxQty = maxNotional / currentPrice;

    const [integer, decimal] = String(qty).split('.');
    if (decimal === undefined) return Math.min(Number(integer), maxQty);

    const length = stepSize.toString().replaceAll(/[^0]/g, '').length;

    const quantityDecimal = decimal.slice(0, length);

    const quantity = [integer, quantityDecimal].filter((str) => str).join('.');

    return Math.min(Number(quantity), maxQty);
  }

  private _currentPrice?: number;

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

  private _qty?: number;

  private get qty(): number {
    const { _qty } = this;

    if (_qty === undefined) {
      throw new ErrorInfo('Action.qty', '_qty не установлен', this);
    }

    return _qty;
  }

  private set qty(value: number) {
    this._qty = value;
  }

  private _order?: Order;

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

  private get isSuccess() {
    const { lotParams, order, qty } = this;

    return order.isFilled && lotParams.stepSize >= qty;
  }

  private get qtyGreaterMin(): boolean {
    const { lotParams, currentPrice, qty } = this;

    return qty > lotParams.minNotional / currentPrice;
  }
}
