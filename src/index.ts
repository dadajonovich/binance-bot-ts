import { config, pairs } from './config';
import { TelegramRepository } from './repositories/telegram';
import { BinanceRepository } from './repositories/binance';

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

const getCandles = async () => {
  const candles = await Promise.all(
    pairs.map(async (symbol) => await BinanceRepository.getCandles(symbol)),
  );
  console.log(candles);
};

getCandles();
// listenerResponce();
