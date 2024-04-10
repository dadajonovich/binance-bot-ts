import { config, pairs } from './config';
import { BinanceRepository } from './repositories/binance';
import { TelegramCycle } from './services/TelegramCycle';
import { Graph } from './entities/Graph';
import { storage } from './entities/Storage';
import { connect } from './db/sequelize';

console.log(config);

const cycle = new TelegramCycle();

cycle.start();

const run = async () => {
  // await connect();
  // console.log(await BinanceRepository.getPrice('DOGEUSDT'));
  console.log(await BinanceRepository.getLotParams('BTCUSDT'));
  // for (const pair of pairs) {
  // const lotParams = await BinanceRepository.getLotParams(pair);
  // console.log(lotParams);
  // const openOrders = await BinanceRepository.getOpenOrders(pair);
  // console.log(openOrders);
  // const candles = await BinanceRepository.getCandles(pair);
  // if (candles instanceof Error) {
  //   console.log(candles.message);
  //   continue;
  // }
  // const graph = new Graph(pair, candles);
  // // console.log(graph);
  // if (graph.buySignal) {
  //   console.log(graph);
  //   break;
  // }
  // }
};

run();
