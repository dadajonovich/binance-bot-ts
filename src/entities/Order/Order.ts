import { Pair } from '../../config';
import { BinanceRepository } from '../../repositories/binance';

export type OrderProps = {
  symbol: Pair;
  orderId: number;
  price: number;
  side: 'SELL' | 'BUY';
  type: 'LIMIT' | 'MARKET';
  status: 'NEW' | 'PARTIALLY_FILLED';
};

export class Order implements OrderProps {
  public symbol;
  public orderId;
  public status;
  public type;
  public side;
  public price;

  public constructor({
    symbol,
    orderId,
    price,
    status,
    type,
    side,
  }: OrderProps) {
    this.symbol = symbol;
    this.orderId = orderId;
    this.status = status;
    this.type = type;
    this.side = side;
    this.price = price;
  }

  private async checkStatus() {}

  public static getQuantity(quantityAsset: number, stepSize: number) {
    const quantity = quantityAsset - (quantityAsset % stepSize);

    return quantity;
  }
}
