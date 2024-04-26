import { config, pairs } from './config';
import { BinanceRepository } from './repositories/binance';
import { TelegramCycle } from './services/TelegramCycle';
import { Graph } from './entities/Graph';
// import { _storage } from './entities/Storage';
import { connect } from './db/sequelize';
import { CronJob, CronTime } from 'cron';
import { Order } from './entities/Order';
import { OperationService } from './entities/Spot/OperationService';
// import { OrderService } from './entities/Spot/OperationService';

// console.log(config);

const cycle = new TelegramCycle();

cycle.start();

const run = async () => {
  await connect();
  // const openOrders = await OrderService.getOpen();

  // for (const order of openOrders) {
  //   await OrderService.cancel(order.orderId);
  // }

  // Написать покупку ордера и обработать ошибку cancelOrder
  // await OperationService.sell('BNBUSDT', 0.9);
  //   console.log(await BinanceRepository.cancelOrder('BTCUSDT', 4276536));
};

run();
