import { CronJob, CronTime } from 'cron';
import { BinanceRepository } from '../Binance';
import { Graph } from '../Graph';
import { TelegramRepository } from '../Telegram';
import { Asset, Pair, pairs } from '../../config';
import { ErrorInfo } from '../../includes/ErrorInfo';
import { SpotService } from './SpotService';
import { ActionResult } from '../Executor';
import { OrderService } from '../Order/OrderService';
import { Order } from '../Order';

enum Mode {
  buy,
  sell,
  unknown,
}

export class Spot {
  private chatId: number;
  private targetPair: Pair | null = null;
  private mode: Mode = Mode.unknown;

  public constructor(chatId: number) {
    this.chatId = chatId;
  }

  public async start() {
    this.mode = await this.createMode();

    const buyTime = '*/15 * * * * *';

    const sellTime = '*/15 * * * * *';

    const cronJob = new CronJob(
      buyTime,

      async () => {
        console.log('Cron stop');
        cronJob.stop();
        try {
          cronJob.setTime(new CronTime(this.isBuy() ? buyTime : sellTime));
          const lastOrder = await OrderService.getLastOrder();

          const pairForAction = await this.toPairForAction(lastOrder);
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

  private isBuy(): boolean {
    if (Mode.sell) return false;
    if (Mode.buy) return true;

    throw new ErrorInfo('Spot.isBuy', 'Неизвестный режим', { mode: this.mode });
  }

  private async createMode(): Promise<Mode> {
    const lastOrder = await SpotService.getLast();

    if (lastOrder === null) return Mode.buy;

    const { symbol, orderId } = lastOrder;
    const order = await BinanceRepository.getOrder(symbol, orderId);

    const isFilled = order.status === 'FILLED';

    const isSideBuy = order.side === 'BUY';
    const isSideSell = order.side === 'SELL';

    if (isSideBuy && !isFilled) return Mode.buy;
    if (isSideSell && isFilled) return Mode.buy;

    return Mode.sell;
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

  private async toPairForAction(lastOrder: Order | null): Promise<Pair | null> {
    if (!lastOrder) {
      return await this.searchBuy();
    }
    const sellSignal = await this.toSellSignal(lastOrder.symbol);

    return sellSignal ? lastOrder.symbol : null;
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
