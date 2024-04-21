import { CronJob } from 'cron';
import { storage } from '../Storage';
import { BinanceRepository } from '../../repositories/binance';
import { Graph } from '../Graph';
import { TelegramRepository } from '../../repositories/telegram';
import { Pair, pairs } from '../../config';
import { CronTime } from 'cron';
import { Order } from '../Order';
import { ErrorInfo } from '../../includes/ErrorInfo';

export class Spot {
  private chatId: number;

  constructor(chatId: number) {
    this.chatId = chatId;
  }

  public async start() {
    const buyTime = '*/15 * * * * *';

    const sellTime = '*/15 * * * * *';

    const cronJob = new CronJob(
      buyTime,

      async () => {
        console.log('Cron stop');
        cronJob.stop();
        try {
          const targetPair = storage.targetPair;
          const isBuy = targetPair === null;

          cronJob.setTime(new CronTime(isBuy ? buyTime : sellTime));
          const pairForAction = await this.toPairForAction(targetPair);
          if (pairForAction) await this.action(pairForAction, isBuy);

          cronJob.start();
          console.log('Cron start');
        } catch (e) {
          const error = ErrorInfo.create(e);
          console.log(error);
          await TelegramRepository.sendMessage(this.chatId, error.message);
        }
      },
      null,
      true,
      null,
      null,
      null,
      0,
    );
  }

  private async action(pair: Pair, isBuy: boolean) {
    let order;

    if (isBuy) {
      console.log('Spot buy');
      order = await this.buy(pair);
      storage.targetPair = pair;
    } else {
      console.log('Spot sell');
      order = await this.sell(pair);
      storage.targetPair = null;
    }

    const price = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
    }).format(order.price);

    await TelegramRepository.sendMessage(
      this.chatId,
      `${order.side} ${price} ${pair} `,
    );
  }

  private async toPairForAction(pair: Pair | null): Promise<Pair | null> {
    if (!pair) {
      const pairBySignal = await this.searchBuy();
      return pairBySignal;
    } else {
      const sellSignal = await this.toSellSignal(pair);

      return sellSignal ? pair : null;
    }
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

  private async toSellSignal(pair: Pair): Promise<boolean> {
    const graph = await Graph.createByPair(pair);
    if (graph.sellSignal) {
      return true;
    }

    return false;
  }

  private async buy(pair: Pair): Promise<Order> {
    const openOrders = await BinanceRepository.getOpenOrders();

    if (openOrders.length === 0) {
      const { free: usdt } = await BinanceRepository.getBalances('USDT');

      if (usdt > 10) {
        const order = await Order.buy(pair, usdt);
        return order;
      } else {
        throw new ErrorInfo('Spot.buy', 'USDT < 10', { balanceUsdt: usdt });
      }
    } else
      throw new ErrorInfo('Spot.buy', 'Есть открытые ордера', {
        openOrders: openOrders,
      });
  }

  private async sell(pair: Pair): Promise<Order> {
    const { free: balance } = await BinanceRepository.getBalances(
      pair.replace('USDT', ''),
    );

    const order = await Order.sell(pair, balance);

    return order;
  }
}
