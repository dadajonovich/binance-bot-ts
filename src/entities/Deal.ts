import { sequelize } from '../db/sequelize';

import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  CreationOptional,
  HasManyAddAssociationsMixin,
  NonAttribute,
  HasManySetAssociationsMixin,
  HasManyHasAssociationsMixin,
  HasManyGetAssociationsMixin,
  HasManyRemoveAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyAddAssociationMixin,
  HasManyHasAssociationMixin,
  HasManyRemoveAssociationMixin,
} from 'sequelize';
import { Order } from './Order';

export class Deal extends Model<
  InferAttributes<Deal>,
  InferCreationAttributes<Deal>
> {
  declare id: CreationOptional<number>;
  declare profitPercent: number;
  declare profitUsdt: number;

  declare Orders?: NonAttribute<Order[]>;
  declare addOrders: HasManyAddAssociationsMixin<Order, Order['orderId']>;
  declare setOrders: HasManySetAssociationsMixin<Order, Order['orderId']>;
  declare hasOrders: HasManyHasAssociationsMixin<Order, Order['orderId']>;
  declare getOrders: HasManyGetAssociationsMixin<Order>;
  declare removeOrders: HasManyRemoveAssociationsMixin<Order, Order['orderId']>;
  declare countOrders: HasManyCountAssociationsMixin;
  declare createOrder: HasManyCreateAssociationMixin<Order, 'orderId'>;
  declare addOrder: HasManyAddAssociationMixin<Order, Order['orderId']>;
  declare hasOrder: HasManyHasAssociationMixin<Order, Order['orderId']>;
  declare removeOrder: HasManyRemoveAssociationMixin<Order, Order['orderId']>;
}

Deal.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    profitPercent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profitUsdt: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { sequelize, timestamps: false },
);
