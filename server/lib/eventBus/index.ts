import { InMemoryEventBus } from './InMemoryEventBus';
import { RedisListEventBus } from './RedisListEventBus';
import { RedisStreamsEventBus } from './RedisStreamsEventBus';

const backend = process.env.WORKERS_QUEUE_BACKEND || 'in-memory';

let instance: any;
if ((backend === 'redis' || backend === 'redis-list') && process.env.REDIS_URL) {
  instance = new RedisListEventBus(process.env.REDIS_URL);
} else if (backend === 'redis-streams' && process.env.REDIS_URL) {
  // Allow configuring group/consumer via envs if desired
  const group = process.env.REDIS_STREAMS_GROUP || 'ils_group';
  const consumer = process.env.REDIS_STREAMS_CONSUMER || undefined;
  instance = new RedisStreamsEventBus(process.env.REDIS_URL, group, consumer);
} else {
  instance = new InMemoryEventBus();
}

export default instance as {
  subscribe: (eventName: string, handler: (p: any) => Promise<void> | void) => () => void;
  publish: (eventName: string, payload: any) => void | Promise<void>;
};
