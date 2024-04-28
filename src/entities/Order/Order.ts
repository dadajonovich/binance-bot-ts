import { Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';

export type OrderDto = {
  symbol: Pair;
  orderId: number;
  price: string;
  side: 'SELL' | 'BUY';
  type: 'LIMIT' | 'MARKET';
  status: 'NEW' | 'PARTIALLY_FILLED' | 'CANCELED';
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
};

const allowStatuses = [
  'NEW',
  'PARTIALLY_FILLED',
  'CANCELED',
  'FILLED',
] as const;

type OrderStatus = (typeof allowStatuses)[number];

export class Order {
  public constructor(
    public symbol: Pair,
    public orderId: number,
    public price: number,
    public side: 'SELL' | 'BUY',
    public type: 'LIMIT' | 'MARKET',
    public status: OrderStatus,
    public origQty: number,
    public executedQty: number,
    public cummulativeQuoteQty: number,
  ) {
    if (!allowStatuses.includes(status))
      throw new ErrorInfo('class Order', 'Invalid status', {
        symbol,
        status,
      });
  }

  public get isFilled(): boolean {
    return this.status === 'FILLED';
  }

  public static from(order: OrderDto) {
    const {
      symbol,
      orderId,
      price,
      side,
      type,
      status,
      origQty,
      executedQty,
      cummulativeQuoteQty,
    } = order;

    return new Order(
      symbol,
      orderId,
      Number(price),
      side,
      type,
      status,
      Number(origQty),
      Number(executedQty),
      Number(cummulativeQuoteQty),
    );
  }
}
