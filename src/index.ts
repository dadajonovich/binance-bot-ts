import { config, pairs } from './config';
import { BinanceRepository } from './repositories/binance';
import { TelegramCycle } from './services/TelegramCycle';
import { Graph } from './entities/Graph/Graph';

// console.log(config);

const cycle = new TelegramCycle();
cycle.start();

const run = async () => {
  // console.log(await BinanceRepository.getBalances());

  for (const pair of pairs) {
    const candles = await BinanceRepository.getCandles(pair);
    const graph = new Graph(pair, candles);
    // console.log(graph);
    if (graph.buySignal) {
      console.log(graph);
      break;
    }
  }
};

run();
