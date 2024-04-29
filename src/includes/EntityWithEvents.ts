export abstract class EntityWithEvents<
  EventMap extends Record<string, unknown>,
> {
  private handlers: {
    eventName: keyof EventMap;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (event: any) => Promise<void>;
  }[] = [];

  public addEventListener<EventName extends keyof EventMap>(
    eventName: EventName,
    callback: (event: EventMap[EventName]) => Promise<void>,
  ) {
    this.handlers.push({ eventName, callback });
  }

  protected async runEvent<EventName extends keyof EventMap>(
    eventName: EventName,
    event: EventMap[EventName] extends void ? never : EventMap[EventName],
  ): Promise<void>;
  protected async runEvent<EventName extends keyof EventMap>(
    eventName: EventMap[EventName] extends void ? EventName : never,
  ): Promise<void>;
  protected async runEvent(
    eventName: keyof EventMap,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event?: any,
  ): Promise<void> {
    for (const handle of this.handlers) {
      if (handle.eventName !== eventName) continue;
      await handle.callback(event);
    }
  }
}
