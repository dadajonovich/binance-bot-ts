import { pairs } from '../../config';
import { BinanceRepository } from '../../repositories/binance';

export type OrderProps = {
  symbol: (typeof pairs)[number];
  status: string;
  type: string;
  side: string;
};

export class Order implements OrderProps {
  public symbol;
  public status;
  public type;
  public side;

  public constructor({ symbol, status, type, side }: OrderProps) {
    this.symbol = symbol;
    this.status = status;
    this.type = type;
    this.side = side;
  }

  //   private static getValueFor(currentPrice: number, balanceFree: number);
}
