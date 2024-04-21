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
import { OrderService } from './OrderService';

export type OrderProps = {
  symbol: Pair;
  orderId: number;
  price: string;
  side: 'SELL' | 'BUY';
  type: 'LIMIT' | 'MARKET';
  status: 'NEW' | 'PARTIALLY_FILLED' | 'CACANCELED';
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
};

export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  declare symbol: Pair;
  declare orderId: number;
  declare price: number;
  declare side: 'SELL' | 'BUY';
  declare type: 'LIMIT' | 'MARKET';
  declare status: 'NEW' | 'PARTIALLY_FILLED' | 'CACANCELED';
  declare origQty: number;
  declare executedQty: number;
  declare cummulativeQuoteQty: number;

  // private set(order: Order | OrderProps) {
  //   const {
  //     symbol,
  //     orderId,
  //     price,
  //     // origQty,
  //     cummulativeQuoteQty,
  //     status,
  //     type,
  //     side,
  //     executedQty,
  //   } = order;

  //   this.symbol = symbol;
  //   this.orderId = orderId;
  //   this.status = status;
  //   this.type = type;
  //   this.side = side;
  //   this.price = Number(price);
  //   // this.origQty = Number(origQty);
  //   this.executedQty = Number(executedQty);
  //   this.cummulativeQuoteQty = Number(cummulativeQuoteQty);
  // }
}

Order.init(
  {
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
