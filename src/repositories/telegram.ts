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

type TelegramError = {
  ok: false;
  error_code: number;
  description: string;
};

export type UpdateObject = {
  update_id: number;
  message: MessageObject;
};

type TelegramSuccess<T> = {
  ok: true;
  result: T;
};

export class TelegramRepository {
  private static lastUpdateId = 0;
  private static firstUpdate = true;

  private static async request<T extends object>(url: string): Promise<T> {
    const responce = (await fetch(`${telegramUrl}/${url}`).then((responce) =>
      responce.json(),
    )) as TelegramSuccess<T> | TelegramError;
    if (responce.ok === true) return responce.result;
    throw new Error(`${responce.description}`);
  }

  public static async getUpdates(): Promise<UpdateObject[] | Error> {
    try {
      const result = await TelegramRepository.request<UpdateObject[]>(
        `getUpdates?offset=${TelegramRepository.lastUpdateId + 1}`,
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
      return await TelegramRepository.request<MessageObject>(
        `sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`,
      );
    } catch (error) {
      return error as Error;
    }
  }
}
