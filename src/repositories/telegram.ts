import { telegramUrl } from '../config';

type MessageObject = {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    language_code: string;
  };
  chat: {
    id: number;
    first_name: string;
    username: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
  };
  date: number;
  text: string;
};

type TelegramReject = {
  ok: false;
  error_code: number;
  description: string;
};

type UpdateObject = {
  update_id: number;
  message: MessageObject;
};

type TelegramResponce<T> = {
  ok: true;
  result: T;
};

export class TelegramRepository {
  private static lastUpdateId = 0;
  private static firstUpdate = true;

  public static checkReject<T>(
    responce: TelegramResponce<T> | TelegramReject,
  ): T {
    if (responce.ok === true) return responce.result;
    throw new Error(`${responce.description}`);
  }

  public static async getUpdates(): Promise<UpdateObject[] | Error> {
    try {
      const result = TelegramRepository.checkReject<UpdateObject[]>(
        await fetch(
          `${telegramUrl}/getUpdates?offset=${
            TelegramRepository.lastUpdateId + 1
          }`,
        ).then((response) => response.json()),
      );
      const lastUpdateId = result.at(-1)?.update_id;
      if (lastUpdateId) {
        TelegramRepository.lastUpdateId = lastUpdateId;
      }
      if (TelegramRepository.firstUpdate) {
        TelegramRepository.firstUpdate = false;
        return [];
      }
      return result;
    } catch (error) {
      return error as Error;
    }
  }
  public static async sendMessage(
    chatId: number,
    message: string,
  ): Promise<MessageObject | Error> {
    try {
      return TelegramRepository.checkReject<MessageObject>(
        await fetch(
          `${telegramUrl}/sendMessage?chat_id=${chatId}&text=${message}`,
        ).then((response) => response.json()),
      );
    } catch (error) {
      return error as Error;
    }
  }
}
