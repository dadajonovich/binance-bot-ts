export class ErrorInfo extends Error {
  public info: any;
  public sender: string;

  public constructor(
    sender: string,
    message: string,
    info?: any,
    stack?: string,
  ) {
    super(message);
    this.sender = sender;
    this.info = info;
    this.stack = stack || this.stack;
  }

  public static create(error: unknown): ErrorInfo {
    if (error instanceof ErrorInfo) return error;
    if (error instanceof Error)
      return new ErrorInfo(
        'ErrorInfo.create',
        error.message,
        undefined,
        error.stack,
      );

    if (typeof error === 'string')
      return new ErrorInfo('ErrorInfo.create', error);

    return new ErrorInfo('ErrorInfo.create', 'unknow error', error);
  }
}
