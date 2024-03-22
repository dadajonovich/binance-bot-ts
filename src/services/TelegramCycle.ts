import { BinanceRepository } from '../repositories/binance';
import { TelegramRepository } from '../repositories/telegram';
import { pairs } from '../config';
import { Graph } from '../entities/Graph/Graph';

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
}
