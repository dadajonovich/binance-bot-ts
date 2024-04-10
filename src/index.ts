import { config, pairs } from './config';
import { BinanceRepository } from './repositories/binance';
import { TelegramCycle } from './services/TelegramCycle';
import { Graph } from './entities/Graph';
import { storage } from './entities/Storage';
import { connect } from './db/sequelize';
import { CronJob, CronTime } from 'cron';
import { Order } from './entities/Order';

console.log(config);

const cycle = new TelegramCycle();

cycle.start();

const run = async () => {
  // await BinanceRepository.createOrder('BTCUSDT', 100000.0, 'SELL', 0.5),
  console.log(await BinanceRepository.cancelOrder('BTCUSDT', 74445));
};

run();
