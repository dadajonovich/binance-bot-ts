import { BinanceRepository } from '../repositories/binance';
import { TelegramRepository } from '../repositories/telegram';
import { Pair, pairs } from '../config';
import { Graph } from '../entities/Graph';

import { sleep } from '../includes/utils/sleep';
import { Spot } from '../entities/Spot';
import { storage } from '../entities/Storage';
import { OrderService } from '../entities/Order/OrderService';

export class TelegramCycle {
  public async start() {
    while (true) {
      try {
        await this.run();
      } catch (error) {
        console.log(error);
      }
      await sleep(1000);
    }
  }

  private async run() {
    const result = await TelegramRepository.getUpdates();

    await Promise.all(
      result.map(async (updateObject) => {
        console.log(updateObject.message.text);
        switch (updateObject.message.text) {
          case '/tellme':
            await this.tellme(updateObject.message.chat.id);
            break;

          case '/balance':
            await this.balance(updateObject.message.chat.id);
            break;

          case '/orders':
            await this.getOpenOrders(updateObject.message.chat.id);
            break;

          case '/cancel':
            break;

          case '/start':
            await this.commandStart(updateObject.message.chat.id);
            break;

          default:
            break;
        }
      }),
    );
  }

  private async balance(chatId: number) {
    const balance = await BinanceRepository.getBalances();

    const message = balance
      .slice(0, 5)
      .map(
        (coin) => `\nCoin: ${coin.asset}
  - Free balance: ${coin.free}
  - Locked balance: ${coin.locked}
    `,
      )
      .join('');
    console.log(message);
    await TelegramRepository.sendMessage(chatId, message);
  }

  private async tellme(chatId: number) {
    const strongCoins = [];
    for (const pair of pairs) {
      const candles = await BinanceRepository.getKlines(pair);

      const graph = new Graph(pair, candles);
      if (graph.buySignal) {
        strongCoins.push(pair);
      }
    }
    console.log(strongCoins);
    const message =
      strongCoins.length > 0
        ? strongCoins.map((pair) => `\n${pair}`).join('')
        : 'Отсутствуют монеты для покупки';

    await TelegramRepository.sendMessage(chatId, message);
  }

  private async commandStart(chatId: number) {
    await TelegramRepository.sendMessage(chatId, 'Запуск алгоритма');
    const trader = new Spot(chatId);
    await trader.start();
  }

  private async getOpenOrders(chatId: number) {
    const orders = await OrderService.getOpen();
    console.log(orders);
  }
}
