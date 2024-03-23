export abstract class Repository<
  ResponceObject extends object,
  ErrorObject extends object,
> {
  private baseUrl: string;
  private options?: RequestInit;

  protected constructor(baseUrl: string, options?: RequestInit) {
    this.baseUrl = baseUrl;
    this.options = options;
  }

  protected async request<T extends ResponceObject>(
    url: string,
  ): Promise<T | Error> {
    try {
      const responce = (await fetch(
        `${this.baseUrl}/${url}`,
        this.options,
      ).then((responce) => responce.json())) as T | ErrorObject;
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
