import { config } from './config';
import { TelegramRepository } from './repositories/telegram';

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

listenerResponce();
