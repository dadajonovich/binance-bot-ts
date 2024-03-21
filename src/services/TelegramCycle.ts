import { BinanceRepository } from '../repositories/binance';
import { TelegramRepository, UpdateObject } from '../repositories/telegram';

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
            break;

          case '/balance':
            await this.balance(updateObject);
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

  private async balance(updateObject: UpdateObject) {
    const chatId = updateObject.message.chat.id;
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
    const responce = await TelegramRepository.sendMessage(chatId, message);
    if (responce instanceof Error) {
      console.log(responce);
    }
  }
}
