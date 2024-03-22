import { telegramUrl } from '../config';
import { Repository } from '../includes/Repository';

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

export class TelegramRepository extends Repository<TelegramError> {
  private static lastUpdateId = 0;
  private static firstUpdate = true;

  constructor() {
    super(telegramUrl);
  }

  protected errorHandler<T extends object>(
    responce: T | TelegramError,
  ): responce is T {
    if (responce.ok === true) return responce.result;
    throw new Error(`${responce.description}`);
  }

  private static async request<T extends object>(
    url: string,
  ): Promise<T | Error> {
    try {
      const responce = (await fetch(`${telegramUrl}/${url}`).then((responce) =>
        responce.json(),
      )) as TelegramSuccess<T> | TelegramError;
      if (responce.ok === true) return responce.result;
      throw new Error(`${responce.description}`);
    } catch (error) {
      return error as Error;
    }
  }

  public static async getUpdates(): Promise<UpdateObject[] | Error> {
    const result = await TelegramRepository.request<UpdateObject[]>(
      `getUpdates?offset=${TelegramRepository.lastUpdateId + 1}`,
    );

    if (result instanceof Error) return result;

    const lastUpdateId = result.at(-1)?.update_id;
    if (lastUpdateId) {
      TelegramRepository.lastUpdateId = lastUpdateId;
    }
    if (TelegramRepository.firstUpdate) {
      TelegramRepository.firstUpdate = false;
      return [];
    }
    return result;
  }
  public static async sendMessage(
    chatId: number,
    message: string,
  ): Promise<MessageObject | Error> {
    return await TelegramRepository.request<MessageObject>(
      `sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`,
    );
  }
}
