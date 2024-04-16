import { CronJob } from 'cron';
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
    // const buyTime = '0 */1 * * * *';
    const buyTime = '*/5 * * * * *';

    // const sellTime = '30 */1 * * * *';
    const sellTime = '*/5 * * * * *';

    const cronJob = new CronJob(
      // '0 15 0 * * *',
      buyTime,

      async () => {
        try {
          const targetPair = storage.targetPair;
          const isBuy = targetPair === null;

          if (isBuy) {
            cronJob.setTime(new CronTime(buyTime));
            const pairBySignal = await this.searchBuy();
            if (!pairBySignal) return;

            this.buy(pairBySignal);
            // cronJob.setTime(new CronTime('0 5 0 * * *'));
          } else {
            cronJob.setTime(new CronTime(sellTime));
            this.sell(targetPair);
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
    } else console.log('Есть открытые ордера!');
  }

  private async sell(pair: Pair) {
    const { free: balance } = await BinanceRepository.getBalances(
      pair.replace('USDT', ''),
    );

    const order = await Order.sell(pair, balance);

    storage.targetPair = null;
    await TelegramRepository.sendMessage(this.chatId, `Buy ${pair}`);
    console.log(order);
  }
}
