import { toQuery } from './toQuery';

export abstract class Repository<
  ResponceObject extends object,
  ErrorObject extends object,
> {
  private baseUrl: string;
  private defaultOptions?: RequestInit;

  protected constructor(baseUrl: string, defaultOptions?: RequestInit) {
    this.baseUrl = baseUrl;
    this.defaultOptions = defaultOptions;
  }

  protected async request<T extends ResponceObject>(
    url: string,
    queryObject: Record<string, any> = {},
    options: RequestInit = {},
  ): Promise<T | Error> {
    try {
      const query = toQuery(queryObject);
      const responce = (await fetch(`${this.baseUrl}/${url}${query}`, {
        ...this.defaultOptions,
        ...options,
      }).then((responce) => responce.json())) as T | ErrorObject;
      if (this.errorHandler(responce)) return responce;
      throw new Error('Unhandled exception');
    } catch (error) {
      if (error instanceof Error) return error;

      return new Error('Unknown exception');
    }
  }

  protected abstract errorHandler(
    responce: ResponceObject | ErrorObject,
  ): responce is ResponceObject;
}
