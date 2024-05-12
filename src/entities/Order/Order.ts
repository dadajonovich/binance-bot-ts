import { Pair } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { sequelize } from '../../db/sequelize';

import {
  DataTypes,
  Model,
  NonAttribute,
  ForeignKey,
  BelongsToCreateAssociationMixin,
  BelongsToSetAssociationMixin,
  BelongsToGetAssociationMixin,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Deal } from '../Deal';

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

export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  declare symbol: Pair;
  declare orderId: number;
  declare price: number;
  declare side: 'SELL' | 'BUY';
  declare type: 'LIMIT' | 'MARKET';
  declare status: OrderStatus;
  declare origQty: number;
  declare executedQty: number;
  declare cummulativeQuoteQty: number;

  declare DealId: ForeignKey<number>;
  declare Deal?: NonAttribute<Deal>;
  declare createDeal: BelongsToCreateAssociationMixin<Deal>;
  declare setDeal: BelongsToSetAssociationMixin<Deal, number>;
  declare getDeal: BelongsToGetAssociationMixin<Deal>;

  // public constructor(
  //   public symbol: Pair,
  //   public orderId: number,
  //   public price: number,
  //   public side: 'SELL' | 'BUY',
  //   public type: 'LIMIT' | 'MARKET',
  //   public status: OrderStatus,
  //   public origQty: number,
  //   public executedQty: number,
  //   public cummulativeQuoteQty: number,
  // ) {
  //   if (!allowStatuses.includes(status))
  //     throw new ErrorInfo('class Order', 'Invalid status', {
  //       symbol,
  //       status,
  //     });
  // }

  public get isFilled(): NonAttribute<boolean> {
    return this.status === 'FILLED';
  }

  // public static from(order: OrderDto) {
  //   const {
  //     symbol,
  //     orderId,
  //     price,
  //     side,
  //     type,
  //     status,
  //     origQty,
  //     executedQty,
  //     cummulativeQuoteQty,
  //   } = order;

  //   return new Order(
  //     symbol,
  //     orderId,
  //     Number(price),
  //     side,
  //     type,
  //     status,
  //     Number(origQty),
  //     Number(executedQty),
  //     Number(cummulativeQuoteQty),
  //   );
  // }
}

Order.init(
  {
    DealId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    side: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    origQty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    executedQty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cummulativeQuoteQty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { sequelize, timestamps: false },
);
