import { Pair } from '../config';
import { sequelize } from '../db/sequelize';

import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from 'sequelize';

export class LastOrder extends Model<
  InferAttributes<LastOrder>,
  InferCreationAttributes<LastOrder>
> {
  declare symbol: Pair;
  declare orderId: number;
}

LastOrder.init(
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
  },
  { sequelize, timestamps: false },
);
