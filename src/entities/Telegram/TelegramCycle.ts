import { BinanceRepository } from '../Binance/BinanceRepository';
import { TelegramRepository } from './TelegramRepository';
import { Pair, pairs } from '../../config';
import { Graph } from '../Graph';

import { sleep } from '../../includes/sleep';
import { Spot } from '../Spot';
import { BinanceService } from '../Binance/BinanceService';
import { ErrorInfo } from '../../includes/ErrorInfo';

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

          case '/sellAll':
            await this.sellAll(updateObject.message.chat.id);
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
    const orders = await BinanceRepository.getOpenOrders();
    console.log(orders);
  }

  private async sellAll(chatId: number) {
    const balances = await BinanceRepository.getBalances();
    for (const balance of balances) {
      if (balance.asset === 'USDT') continue;

      try {
        await BinanceService.sell(
          (balance.asset + 'USDT') as Pair,
          balance.free,
        );
      } catch (error) {
        if (error instanceof ErrorInfo && error.message === 'stepSize >= qty') {
          console.log('stepSize >= qty', balance);
          continue;
        }
        throw error;
      }

      await TelegramRepository.sendMessage(
        chatId,
        `Продажа ${balance.asset + 'USDT'} ${balance.free}`,
      );
    }
  }
}