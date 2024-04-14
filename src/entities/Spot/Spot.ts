import { CronJob } from 'cron/dist/job';
import { storage } from '../Storage';
import { BinanceRepository } from '../../repositories/binance';
import { Graph } from '../Graph';
import { TelegramRepository } from '../../repositories/telegram';
import { Pair, pairs } from '../../config';
import { CronTime } from 'cron';
import { Order } from '../Order';

export class Spot {
  private chatId: number;

  constructor(chatId: number) {
    this.chatId = chatId;
  }

  public async start() {
    const cronJob = new CronJob(
      // '0 15 0 * * *',
      '0 */1 * * * *',

      async () => {
        try {
          const targetPair = storage.targetPair;
          const isBuy = targetPair === null;

          if (isBuy) {
            const pairBySignal = await this.searchBuy();
            if (!pairBySignal) return;

            this.buy(pairBySignal);
            cronJob.setTime(new CronTime('0 5 0 * * *'));
          } else {
            this.sell(targetPair);
            cronJob.setTime(new CronTime('0 15 0 * * *'));
          }
        } catch (error) {
          console.log(error instanceof Error ? error.message : error);
        }
      },
      null,
      null,
      null,
      null,
      // true,
      null,
      0,
    );
    cronJob.start();
  }

  private async searchBuy(): Promise<Pair | null> {
    for (const pair of pairs) {
      const graph = await Graph.createByPair(pair);
      if (graph.buySignal) {
        return pair;
      }
    }
    return null;
  }

  private async buy(pair: Pair) {
    const openOrders = await BinanceRepository.getOpenOrders();

    if (openOrders.length === 0) {
      const { free: usdt } = await BinanceRepository.getBalances('USDT');

      if (usdt > 10) {
        storage.targetPair = pair;
        const order = await Order.buy(pair, usdt);

        await TelegramRepository.sendMessage(this.chatId, `Buy ${pair}`);
        console.log(order);
      }

      await TelegramRepository.sendMessage(this.chatId, 'USDT < 10');
      throw new Error('USDT < 10');
    }
  }

  private async sell(pair: Pair) {
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);
    const { free: balance } = await BinanceRepository.getBalances(
      pair.replace('USDT', ''),
    );

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = Order.getQuantity(balance, stepSize);

    const order = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'SELL',
      quantity,
    );
    storage.targetPair = null;

    await TelegramRepository.sendMessage(this.chatId, `Sell ${pair}`);
    // console.log(order);
  }
}
