import { config, pairs } from './config';
import { TelegramRepository } from './repositories/telegram';
import { BinanceRepository } from './repositories/binance';
import { Candles } from './includes/Candles';
import { Indicator } from './includes/Indicator';

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
  for (const pair of pairs) {
    const candles = await BinanceRepository.getCandles(pair);
    const prices = Candles.getPrices(candles);
    const { close, high, low, open } = prices;
    const kama = Indicator.getKama(close);
    const atr = Indicator.getAtr(close, high, low);
    const filterKama = Indicator.getFilter(kama);
    const filterAtr = Indicator.getFilter(atr);
    console.log(pair, filterKama, filterAtr);
    const returnObj = { pair, kama, atr, filterKama, filterAtr };
  }
};

run();
listenerResponce();
