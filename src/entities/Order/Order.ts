import { Pair } from '../../config';
import { BinanceRepository } from '../../repositories/binance';

export type OrderProps = {
  symbol: Pair;
  price: number;
  side: 'SELL' | 'BUY';
  type: 'LIMIT' | 'MARKET';
  status: 'NEW' | 'PARTIALLY_FILLED';
};

export class Order implements OrderProps {
  public symbol;
  public status;
  public type;
  public side;
  public price;

  public constructor({ symbol, price, status, type, side }: OrderProps) {
    this.symbol = symbol;
    this.status = status;
    this.type = type;
    this.side = side;
    this.price = price;
  }
}
