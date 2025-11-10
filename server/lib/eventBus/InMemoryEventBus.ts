import { createLogger } from "../../utils/logger";

type EventHandler = (payload: any) => Promise<void> | void;

export class InMemoryEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private logger = createLogger("EventBus");

  subscribe(eventName: string, handler: EventHandler) {
    const list = this.handlers.get(eventName) || [];
    list.push(handler);
    this.handlers.set(eventName, list);
    this.logger.debug("handler subscribed", { eventName });
    return () => this.unsubscribe(eventName, handler);
  }

  unsubscribe(eventName: string, handler: EventHandler) {
    const list = this.handlers.get(eventName) || [];
    this.handlers.set(
      eventName,
      list.filter((h) => h !== handler)
    );
    this.logger.debug("handler unsubscribed", { eventName });
  }

  // Fire-and-forget publishing to avoid blocking the caller (Order creation)
  publish(eventName: string, payload: any) {
    const list = this.handlers.get(eventName) || [];
    if (list.length === 0) {
      this.logger.debug("publish: no handlers registered", { eventName });
      return;
    }

    // Call handlers asynchronously and independently
    for (const handler of list) {
      Promise.resolve()
        .then(() => handler(payload))
        .catch((err) => {
          this.logger.error("event handler error", err as Error, { eventName });
        });
    }
  }
}
