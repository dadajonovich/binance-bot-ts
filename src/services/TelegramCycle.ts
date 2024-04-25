import { BinanceRepository } from '../repositories/binance';
import { TelegramRepository } from '../repositories/telegram';
import { Pair, pairs } from '../config';
import { Graph } from '../entities/Graph';

import { sleep } from '../includes/sleep';
import { Spot } from '../entities/Spot';
import { BinanceService } from '../entities/Spot/OperationService';
import { ErrorInfo } from '../includes/ErrorInfo';

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
            // await this.sellAll(updateObject.message.chat.id);
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

  // private async sellAll(chatId: number) {
  //   const balances = await BinanceRepository.getBalances();

  //   for (const balance of balances) {
  //     if (balance.asset === 'USDT') continue;

  //     const pair: Pair = `${balance.asset}USDT`;

  //     const { stepSize, tickSize } = await BinanceRepository.getLotParams(pair);

  //     if (stepSize >= balance.free) {
  //       throw new ErrorInfo('Order.sell', 'stepSize >= free', {
  //         stepSize,
  //         free: balance.free,
  //       });
  //     }

  //     const currentPrice = await BinanceRepository.getPrice(pair);

  //     const quantity = OrderService.getQuantity(balance.free, stepSize);

  //     const responce = await BinanceRepository.createOrder(
  //       pair,
  //       currentPrice,
  //       'SELL',
  //       quantity,
  //       'LIMIT',
  //     );

  //     if (order.isFilled) return order;
  //     await sleep(1000 * 60 * 0.25);

  //     const currentOrder = await OrderService.get(order.orderId);

  //     if (currentOrder.isFilled) {
  //       return currentOrder;
  //     }
  //     return await OrderService.cancel(currentOrder.orderId);
  //   }
  // }
}
