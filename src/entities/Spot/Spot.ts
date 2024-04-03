import { CronJob } from 'cron/dist/job';
import { storage } from '../Storage';
import { BinanceRepository } from '../../repositories/binance';
import { Graph } from '../Graph';
import { TelegramRepository } from '../../repositories/telegram';
import { pairs } from '../../config';

export class Spot {
  public async start(chatId: number) {
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
                const { free: balanceUsdt } =
                  await BinanceRepository.getBalances('USDT');
                storage.balanceUsdt = balanceUsdt;

                if (balanceUsdt < 11) {
                  await TelegramRepository.sendMessage(chatId, 'USDT < 10');
                  throw new Error('USDT < 10');
                }

                const { stepSize, tickSize } =
                  await BinanceRepository.getLotParams(pair);

                const currentPrice = await BinanceRepository.getPrice(pair);
                const quantity = this.getQuantityForOrder(
                  balanceUsdt,
                  currentPrice,
                  stepSize,
                );

                const order = await BinanceRepository.createOrder(
                  pair,
                  currentPrice,
                  'BUY',
                  quantity,
                );
                await TelegramRepository.sendMessage(chatId, `Buy ${pair}`);
                console.log(order);

                // Написать обработку ошибки, в случае неудачного ордера
                // Записать targetPair
              }
              break;
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

  public getQuantityForOrder(
    usdt: number,
    currentPrice: number,
    stepSize: number,
  ) {
    const canBuy = usdt / currentPrice;
    const quantityBuy = canBuy - (canBuy % stepSize);

    return quantityBuy;
  }
}
