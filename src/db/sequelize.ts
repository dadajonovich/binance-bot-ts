import { Sequelize } from 'sequelize';
import { Order } from '../entities/Order';
import { Deal } from '../entities/Deal';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false,
});

export const connect = async () => {
  try {
    Order.belongsTo(Deal);
    Deal.hasMany(Order);
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};
