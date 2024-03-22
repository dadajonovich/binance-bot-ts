export abstract class Repository<
  ResponceObject extends object,
  ErrorObject extends object,
> {
  private baseUrl: string;
  private options?: RequestInit;

  constructor(baseUrl: string, options?: RequestInit) {
    this.baseUrl = baseUrl;
    this.options = options;
  }

  protected async request(url: string): Promise<ResponceObject | Error> {
    try {
      const responce = (await fetch(
        `${this.baseUrl}/${url}`,
        this.options,
      ).then((responce) => responce.json())) as ResponceObject | ErrorObject;
      if (this.errorHandler(responce)) return responce;
      throw new Error('Unhandled exception');
    } catch (error) {
      return error as Error;
    }
  }

  protected abstract errorHandler(
    responce: ResponceObject | ErrorObject,
  ): responce is ResponceObject;
}
