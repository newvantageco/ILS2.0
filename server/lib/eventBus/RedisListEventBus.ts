import IORedis from 'ioredis';
import { createLogger } from "../../utils/logger";

type EventHandler = (payload: any) => Promise<void> | void;

export class RedisListEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private redis: any;
  private running: Map<string, boolean> = new Map();
  private logger = createLogger("RedisListEventBus");

  constructor(redisUrl: string) {
    this.redis = new IORedis(redisUrl);
  }

  subscribe(eventName: string, handler: EventHandler) {
    const list = this.handlers.get(eventName) || [];
    list.push(handler);
    this.handlers.set(eventName, list);
    this.logger.debug("handler subscribed", { eventName });

    // Start background consumer for this event if not already running
    if (!this.running.get(eventName)) {
      this.running.set(eventName, true);
      this.startConsumerLoop(eventName).catch((err) => {
        this.logger.error('Redis consumer loop error', err as Error, { eventName });
        this.running.set(eventName, false);
      });
    }

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

  async publish(eventName: string, payload: any) {
    const key = `events:${eventName}`;
    try {
      // Push JSON payload to the list (durable until popped)
      await this.redis.rpush(key, JSON.stringify(payload));
      this.logger.debug('published to redis list', { eventName });
    } catch (err) {
      this.logger.error('Failed to publish to redis', err as Error, { eventName });
    }
  }

  private async startConsumerLoop(eventName: string) {
    const key = `events:${eventName}`;
    this.logger.info('Starting redis consumer loop', { eventName });

    while (this.running.get(eventName)) {
      try {
        // BRPOP blocks until an item is available (timeout 5s to allow graceful shutdown)
        const res = await this.redis.brpop(key, 5);
        if (!res) {
          continue;
        }
        // res = [ key, value ]
        const value = res[1];
        let payload: any = null;
        try {
          payload = JSON.parse(value);
        } catch (e) {
          payload = value;
        }

        const handlers = this.handlers.get(eventName) || [];
        for (const handler of handlers) {
          Promise.resolve()
            .then(() => handler(payload))
            .catch((err) => this.logger.error('event handler error', err as Error, { eventName }));
        }
      } catch (err) {
        this.logger.error('Redis consumer loop exception', err as Error, { eventName });
        // Backoff a bit to avoid busy-looping on fatal Redis errors
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    this.logger.info('Consumer loop exiting', { eventName });
  }
}
