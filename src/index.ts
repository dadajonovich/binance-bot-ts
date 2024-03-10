import { config, pairs } from './config';
import { TelegramRepository } from './repositories/telegram';
import { BinanceRepository } from './repositories/binance';
import { Candles } from './includes/Candles';
import { Indicator } from './includes/Indicator';
import { Forecast } from './includes/Forecast';
import { Coin } from './types';

console.log(config);

const listenerResponce = async () => {
  const result = await TelegramRepository.getUpdates();
  if (result instanceof Error) return;
  const chatIds = result.map((updateObject) => updateObject.message.chat.id);
  const responceSend = await Promise.all(
    chatIds.map((chatId) =>
      TelegramRepository.sendMessage(chatId, 'Hello world'),
    ),
  );
  console.log(responceSend);
  setTimeout(listenerResponce, 1000);
};

const run = async () => {
  const coins = await Promise.all(
    pairs.map(async (pair) => {
      const candles = await BinanceRepository.getCandles(pair);
      const prices = Candles.getPrices(candles);
      const { close, high, low, open } = prices;
      const kama = Indicator.getKama(close, 10, 2, 30);
      const atr = Indicator.getAtr(close, high, low, 10);
      const filterKama = Indicator.getFilter(kama);
      const filterAtr = Indicator.getFilter(atr);
      const coin: Coin = { pair, kama, atr, filterKama, filterAtr };

      console.log({ ...coin, close });
      return coin;
    }),
  );
  const buySignal = Forecast.calcBuySignal(coins);
  console.log(buySignal);
};

run();
listenerResponce();
