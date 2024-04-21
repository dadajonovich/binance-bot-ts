import { config, pairs } from './config';
import { BinanceRepository } from './repositories/binance';
import { TelegramCycle } from './services/TelegramCycle';
import { Graph } from './entities/Graph';
// import { _storage } from './entities/Storage';
import { connect } from './db/sequelize';
import { CronJob, CronTime } from 'cron';
import { Order } from './entities/Order';
import { OrderService } from './entities/Order/OrderService';

// console.log(config);

const cycle = new TelegramCycle();

cycle.start();

const run = async () => {
  await connect();
  const openOrders = await OrderService.getOpen();
  // for (const order of openOrders) {
  //   await OrderService.cancel(order.orderId);
  // }
  // await BinanceRepository.createOrder('BTCUSDT', 100000.0, 'SELL', 0.5),
  // console.log(await BinanceRepository.cancelOrder('SOLUSDT', 837957));
};

run();
