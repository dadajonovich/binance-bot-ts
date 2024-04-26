import { CronJob } from 'cron';
// import { storage } from '../Storage';
import { BinanceRepository } from '../../repositories/binance';
import { Graph } from '../Graph';
import { TelegramRepository } from '../../repositories/telegram';
import { Asset, Pair, pairs } from '../../config';
import { CronTime } from 'cron';
import { Order } from '../Order';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { OperationService } from './OperationService';

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
          const lastOrder = await OrderService.getLast();
          const isBuy = this.isBuy(lastOrder);

          cronJob.setTime(new CronTime(isBuy ? buyTime : sellTime));
          const pairForAction = await this.toPairForAction(
            lastOrder?.symbol || null,
          );
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

  private isBuy(lastOrder: Order | null): boolean {
    const isNull = lastOrder === null;

    if (isNull) return true;

    const isPartiallyFilled = lastOrder.status === 'PARTIALLY_FILLED';

    const isSideBuy = lastOrder.side === 'BUY';
    const isNew = lastOrder.status === 'NEW';

    if (isSideBuy && (isPartiallyFilled || isNew)) return true;
    if (!isSideBuy && (!isPartiallyFilled || !isNew)) return true;

    return false;
  }

  private async action(pair: Pair, isBuy: boolean) {
    let order;

    if (isBuy) {
      console.log('Spot buy');
      order = await this.buy(pair);
    } else {
      console.log('Spot sell');
      order = await this.sell(pair);
    }

    const quantity = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
    }).format(order.origQty * order.price);

    await TelegramRepository.sendMessage(
      this.chatId,
      `${order.side} ${quantity} ${pair} `,
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
    console.log('Order.buy');
    const { free: usdt } = await BinanceRepository.getBalances('USDT');

    if (usdt > 10) {
      const order = await OperationService.buy(pair, 1000);
      return order;
    } else {
      throw new ErrorInfo('Spot.buy', 'USDT < 10', { balanceUsdt: usdt });
    }
  }

  private async sell(pair: Pair): Promise<Order> {
    console.log('Order.sell');
    const { free } = await BinanceRepository.getBalances(
      pair.replace('USDT', '') as Asset,
    );
    console.log('Spot.sell asset', pair, free);

    const order = await OperationService.sell(pair, free);

    return order;
  }
}
