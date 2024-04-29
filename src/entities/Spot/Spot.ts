import { CronJob, CronTime } from 'cron';
import { BinanceRepository } from '../Binance';
import { Graph } from '../Graph';
import { TelegramRepository } from '../Telegram';
import { Asset, Pair, pairs } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { SpotService } from './SpotService';
import { LastOrder } from '../LastOrder';
import type { ActionResult } from '../Action';

export class Spot {
  private chatId: number;

  public constructor(chatId: number) {
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
          const lastOrder = await SpotService.getLast();
          const isBuy = await this.isBuy(lastOrder);

          cronJob.setTime(new CronTime(isBuy ? buyTime : sellTime));

          const pairForAction = await this.toPairForAction(
            lastOrder?.symbol || null,
          );
          if (pairForAction) {
            await this.action(pairForAction, isBuy);
          }

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

  private async isBuy(lastOrder: LastOrder | null): Promise<boolean> {
    if (lastOrder === null) return true;

    const { symbol, orderId } = lastOrder;
    const order = await BinanceRepository.getOrder(symbol, orderId);

    const isPartiallyFilled = order.status === 'PARTIALLY_FILLED';
    const isSideBuy = order.side === 'BUY';
    const isNew = order.status === 'NEW';

    if (isSideBuy && (isPartiallyFilled || isNew)) return true;
    if (!isSideBuy && (!isPartiallyFilled || !isNew)) return true;

    return false;
  }

  private async action(pair: Pair, isBuy: boolean) {
    let result;

    if (isBuy) {
      result = await this.buy(pair);
    } else {
      result = await this.sell(pair);
    }

    const quantity = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
    }).format(result.usdt);

    await TelegramRepository.sendMessage(
      this.chatId,
      `${result.side} ${result.pair} ${quantity}`,
    );
  }

  private async toPairForAction(pair: Pair | null): Promise<Pair | null> {
    if (!pair) {
      return await this.searchBuy();
    } else {
      const sellSignal = await this.toSellSignal(pair);

      return sellSignal ? pair : null;
    }
  }

  private async searchBuy(): Promise<Pair | null> {
    for (const pair of pairs) {
      const graph = await Graph.createByPair(pair);
      if (graph.buySignal) return pair;
    }
    return null;
  }

  private async toSellSignal(pair: Pair): Promise<boolean> {
    const graph = await Graph.createByPair(pair);
    return graph.sellSignal;
  }

  private async buy(pair: Pair): Promise<ActionResult> {
    console.log('Spot.buy');
    const { free: usdt } = await BinanceRepository.getBalances('USDT');

    if (usdt > 10) return await SpotService.buy(pair, 1000);

    throw new ErrorInfo('Spot.buy', 'USDT < 10', { balanceUsdt: usdt });
  }

  private async sell(pair: Pair): Promise<ActionResult> {
    console.log('Spot.sell');
    const { free } = await BinanceRepository.getBalances(
      pair.replace('USDT', '') as Asset,
    );
    console.log('Spot.sell asset', pair, free);

    return await SpotService.sell(pair, free);
  }
}
