import { sequelize } from '../db/sequelize';

import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  CreationOptional,
} from 'sequelize';

export class Deal extends Model<
  InferAttributes<Deal>,
  InferCreationAttributes<Deal>
> {
  declare id: CreationOptional<number>;
  declare profitPercent: number;
  declare profitUsdt: number;
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
