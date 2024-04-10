import { CronJob } from 'cron/dist/job';
import { storage } from '../Storage';
import { BinanceRepository } from '../../repositories/binance';
import { Graph } from '../Graph';
import { TelegramRepository } from '../../repositories/telegram';
import { Pair, pairs } from '../../config';

export class Spot {
  private chatId: number;

  constructor(chatId: number) {
    this.chatId = chatId;
  }

  public async start() {
    const searchSignal = new CronJob(
      // '0 15 0 * * *',
      '0 */1 * * * *',

      async () => {
        try {
          if (storage.targetPair === null) {
            const targetPair = await this.search(true);
            if (targetPair) {
              this.buy(targetPair);
            }
          } else {
            this.sell('ADAUSDT');
          }
        } catch (error) {
          console.log(error instanceof Error ? error.message : error);
        }
        searchSignal.stop();
      },
      null,
      null,
      null,
      null,
      // true,
      null,
      0,
    );
    searchSignal.start();
  }

  private getQuantityForOrder(quantityAsset: number, stepSize: number) {
    const quantity = quantityAsset - (quantityAsset % stepSize);

    return quantity;
  }

  private async search(isBuy: boolean) {
    for (const pair of pairs) {
      const candles = await BinanceRepository.getKlines(pair);

      const graph = new Graph(pair, candles);
      if (isBuy ? graph.buySignal : graph.sellSignal) {
        return pair;
      }
    }
    return null;
  }

  private async buy(pair: Pair) {
    const openOrders = await BinanceRepository.getOpenOrders();

    if (openOrders.length === 0) {
      const { free: balanceUsdt } = await BinanceRepository.getBalances('USDT');

      if (balanceUsdt < 11) {
        await TelegramRepository.sendMessage(this.chatId, 'USDT < 10');
        throw new Error('USDT < 10');
      }

      const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

      const currentPrice = await BinanceRepository.getPrice(pair);

      const quantity = this.getQuantityForOrder(
        balanceUsdt / currentPrice,
        stepSize,
      );

      const order = await BinanceRepository.createOrder(
        pair,
        currentPrice,
        'BUY',
        quantity,
      );

      await TelegramRepository.sendMessage(this.chatId, `Buy ${pair}`);
      console.log(order);
      storage.targetPair = pair;
    }
  }

  private async sell(pair: Pair) {
    const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);
    const { free: balance } = await BinanceRepository.getBalances(
      pair.replace('USDT', ''),
    );

    const currentPrice = await BinanceRepository.getPrice(pair);

    const quantity = this.getQuantityForOrder(balance, stepSize);

    const order = await BinanceRepository.createOrder(
      pair,
      currentPrice,
      'SELL',
      quantity,
    );
    await TelegramRepository.sendMessage(this.chatId, `Sell ${pair}`);
    console.log(order);
    storage.targetPair = null;
  }
}
