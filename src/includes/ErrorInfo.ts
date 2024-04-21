import { start } from 'repl';

export class ErrorInfo extends Error {
  public info: any;

  public constructor(
    sender: string,
    message: string,
    info?: any,
    stack?: string,
  ) {
    super(`${sender} ${message}`);
    this.info = info;
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
