export type EntityEvent<T> = T;

export abstract class EntityWithEvents<
  EventMap extends Record<string, EntityEvent<unknown>>,
> {
  private handlers: {
    eventName: keyof EventMap;
    callback: (event: EntityEvent<any>) => Promise<void>;
  }[] = [];

  public addEventListener<EventName extends keyof EventMap>(
    eventName: EventName,
    callback: (event: EventMap[EventName]) => Promise<void>,
  ) {
    this.handlers.push({ eventName, callback });
  }

  protected async runEvent<EventName extends keyof EventMap>(
    eventName: EventName,
    event: EventMap[EventName],
  ) {
    for (const handle of this.handlers) {
      if (handle.eventName !== eventName) continue;
      await handle.callback(event);
    }
  }
}
