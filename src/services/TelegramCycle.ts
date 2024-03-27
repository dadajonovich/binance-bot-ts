import { BinanceRepository } from '../repositories/binance';
import { TelegramRepository } from '../repositories/telegram';
import { pairs } from '../config';
import { Graph } from '../entities/Graph/Graph';
import { CronJob } from 'cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileReader } from '../includes/FileReader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TelegramCycle {
  public async start() {
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
            await this.commandStart();
            break;

          default:
            break;
        }
      }),
    );

    // const chatIds = result.map((updateObject) => updateObject.message.chat.id);
    // const responceSend = await Promise.all(
    //   chatIds.map((chatId) =>
    //     TelegramRepository.sendMessage(chatId, 'Hello world'),
    //   ),
    // );
    // console.log(responceSend);

    setTimeout(this.start.bind(this), 1000);
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
      const candles = await BinanceRepository.getCandles(pair);
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

  private async commandStart() {
    enum Mode {
      buy = 'buy',
      sell = 'sell',
    }

    const storage: { mode: Mode } = JSON.parse(
      FileReader.read(path.join(__dirname, '../../', 'storage.json')),
    );

    if (storage.mode === Mode.buy) console.log(storage);
    // const searchCoins = new CronJob(
    //   '0 15 0 * * *',
    //   async () => {
    //     const storage = JSON.parse(
    //       FileReader.read(path.join(__dirname, '../', 'storage.json')),
    //     );
    //   },
    //   null,
    //   null,
    //   null,
    //   null,
    //   // true,
    //   null,
    //   0,
    // );
    // searchCoins.start();
  }
}
