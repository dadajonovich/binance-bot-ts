import { config, pairs } from './config';
import { BinanceRepository } from './entities/Binance/BinanceRepository';
import { TelegramCycle } from './entities/Telegram/TelegramCycle';
import { Graph } from './entities/Graph';
import { connect } from './db/sequelize';
import { CronJob, CronTime } from 'cron';
import { Order } from './entities/Order';
import { BinanceService } from './entities/Binance/BinanceService';

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
