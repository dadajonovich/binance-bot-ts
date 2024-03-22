import {telegramUrl} from '../config';
import {Repository} from '../includes/Repository';

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

export const TelegramRepository = new (class TelegramRepository extends Repository<TelegramSuccess<object>, TelegramError> {
  private static lastUpdateId = 0;
  private static firstUpdate = true;

  constructor() {
    super(telegramUrl);
  }

  public async getUpdates(): Promise<UpdateObject[] | Error> {
    const response = await this.request<TelegramSuccess<UpdateObject[]>>(
      `getUpdates?offset=${TelegramRepository.lastUpdateId + 1}`,
    );

    if (response instanceof Error) return response;

    const result = response.result;

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

  public async sendMessage(
    chatId: number,
    message: string,
  ): Promise<MessageObject | Error> {
    const response = await this.request<TelegramSuccess<MessageObject>>(
      `sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`,
    );

    if (response instanceof Error) return response;

    return response.result;
  }

  protected errorHandler(
    responce: TelegramSuccess<object> | TelegramError,
  ): responce is TelegramSuccess<object> {
    if (responce.ok) return true;
    throw new Error(`${responce.description}`);
  }
})();
