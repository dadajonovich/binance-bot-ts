import { Pair } from '../../config';
import { sequelize } from '../../db/sequelize';

import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  BelongsToManyAddAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyHasAssociationsMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManyCountAssociationsMixin,
  BelongsToManyCreateAssociationMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyRemoveAssociationMixin,
  NonAttribute,
} from 'sequelize';
import { OrderService } from '../Binance/BinanceService';

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

export class Order {
  public constructor(
    public symbol: Pair,
    public orderId: number,
    public price: number,
    public side: 'SELL' | 'BUY',
    public type: 'LIMIT' | 'MARKET',
    public status: 'NEW' | 'PARTIALLY_FILLED' | 'CANCELED' | 'FILLED',
    public origQty: number,
    public executedQty: number,
    public cummulativeQuoteQty: number,
  ) {}

  public get isFilled(): boolean {
    return (
      this.status !== 'NEW' &&
      this.status !== 'PARTIALLY_FILLED' &&
      this.status !== 'CANCELED'
    );
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
