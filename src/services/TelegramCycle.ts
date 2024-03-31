import { BinanceRepository } from '../repositories/binance';
import { TelegramRepository } from '../repositories/telegram';
import { pairs } from '../config';
import { Graph } from '../entities/Graph';
import { CronJob } from 'cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileReader } from '../includes/FileReader';
import { sleep } from '../includes/sleep';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    if (result instanceof Error) {
      console.log(result);
      return;
    }

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
    if (balance instanceof Error) {
      console.log(balance.message);
      return;
    }
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
    const responce = await TelegramRepository.sendMessage(chatId, message);
    if (responce instanceof Error) {
      console.log(responce);
    }
  }

  private async tellme(chatId: number) {
    const strongCoins = [];
    for (const pair of pairs) {
      const candles = await BinanceRepository.getKlines(pair);
      if (candles instanceof Error) {
        console.log(candles.message);
        continue;
      }
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

    const responce = await TelegramRepository.sendMessage(chatId, message);
    if (responce instanceof Error) {
      console.log(responce);
    }
  }

  private async commandStart(chatId: number) {
    enum Mode {
      buy = 'buy-signal',
      sell = 'sell-signal',
    }

    const searchCoins = new CronJob(
      '0 15 0 * * *',
      async () => {
        const storage: { mode: Mode } = JSON.parse(
          FileReader.read(path.join(__dirname, '../../', 'storage.json')),
        );
        if (storage.mode === Mode.buy) console.log(storage);

        for (const pair of pairs) {
          const candles = await BinanceRepository.getKlines(pair);
          if (candles instanceof Error) {
            console.log(candles.message);
            continue;
          }
          const graph = new Graph(pair, candles);
          if (graph.buySignal) {
            console.log(graph);
            const openOrders = await BinanceRepository.getOpenOrders();
            if (openOrders instanceof Error) {
              console.log(openOrders.message);
              // Отменить все сделки и продать все монеты в USDT
              searchCoins.stop();
              return;
            }

            if (openOrders.length === 0) {
              const balanceUsdt = await BinanceRepository.getBalances('USDT');
              if (balanceUsdt instanceof Error) {
                console.log(balanceUsdt.message);
                return;
              }
              if (balanceUsdt.free < 11) {
                await TelegramRepository.sendMessage(chatId, 'USDT < 10');
              }
            }
            searchCoins.stop();
          }
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
    searchCoins.start();
  }
}
