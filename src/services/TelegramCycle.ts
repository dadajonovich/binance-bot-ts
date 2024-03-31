import { BinanceRepository } from '../repositories/binance';
import { TelegramRepository } from '../repositories/telegram';
import { Pair, pairs } from '../config';
import { Graph } from '../entities/Graph';
import { CronJob } from 'cron';

import { sleep } from '../includes/sleep';
import { storage } from '../entities/Storage';

export class TelegramCycle {
  public async start() {
    while (true) {
      try {
        await this.run();
      } catch (error) {
        console.log(error instanceof Error ? error.message : error);
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
        : 'Strong coins are missing';

    await TelegramRepository.sendMessage(chatId, message);
  }

  private async commandStart(chatId: number) {
    const searchCoins = new CronJob(
      // '0 15 0 * * *',
      '0 */1 * * * *',

      async () => {
        try {
          // Написать метод, который запускает продажу targetCoin
          if (storage.targetPair === null) console.log(storage);

          for (const pair of pairs) {
            const candles = await BinanceRepository.getKlines(pair);

            const graph = new Graph(pair, candles);
            if (graph.buySignal) {
              console.log(graph);
              const openOrders = await BinanceRepository.getOpenOrders();

              if (openOrders.length === 0) {
                const balanceUsdt = await BinanceRepository.getBalances('USDT');

                if (balanceUsdt.free < 11) {
                  await TelegramRepository.sendMessage(chatId, 'USDT < 10');
                  throw new Error('USDT < 10');
                }

                const { stepSize, tickSize } =
                  await BinanceRepository.getLotParams(pair);
              }
            }
          }
        } catch (error) {
          console.log(error instanceof Error ? error.message : error);
        }
        searchCoins.stop();
      },
      null,
      null,
      null,
      null,
      // true,
      null,
      0,
    );
    searchCoins.start();
  }
}
