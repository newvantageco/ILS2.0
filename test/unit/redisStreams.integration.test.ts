import IORedis from 'ioredis';
import { RedisStreamsEventBus } from '../../server/lib/eventBus/RedisStreamsEventBus';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  // Provide a single skipped test so the suite doesn't fail when REDIS_URL is not set.
  test('skip redis integration tests when REDIS_URL is not set', () => {
    expect(true).toBe(true);
  });
} else {
  describe('Redis Streams integration (requires REDIS_URL)', () => {
    let redis: any;
    let consumerClient: any;
    let eventBus: RedisStreamsEventBus;

    beforeEach(async () => {
      redis = new IORedis(redisUrl);
      consumerClient = new IORedis(redisUrl);
    });

    afterEach(async () => {
      try { await redis.flushdb(); } catch { /* ignore cleanup errors */ }
      try { await redis.quit(); } catch { /* ignore cleanup errors */ }
      try { await consumerClient.quit(); } catch { /* ignore cleanup errors */ }
      try { if ((eventBus as any)?.redis) await (eventBus as any).redis.quit(); } catch { /* ignore cleanup errors */ }
    });

    it('reclaims a pending entry and processes it with the registered handler', async () => {
      const eventName = `integration.test.${Date.now()}`;
      const streamKey = `stream:${eventName}`;
  const group = `grp-${Math.random().toString(36).slice(2,6)}`;
  // create consumer group before starting the eventBus to avoid XREADGROUP NOGROUP races
  try { await redis.xgroup('CREATE', streamKey, group, '0', 'MKSTREAM'); } catch { /* group may exist */ }
  eventBus = new RedisStreamsEventBus(redisUrl, group, `consumer-${Math.random().toString(36).slice(2,6)}`);
      let processed: any = null;
      eventBus.subscribe(eventName, async (payload) => {
        processed = payload;
      });

      try { await redis.xgroup('CREATE', streamKey, group, '0', 'MKSTREAM'); } catch { /* group may exist */ }
      await redis.xadd(streamKey, '*', 'p', JSON.stringify({ foo: 'bar1' }));

      await consumerClient.xreadgroup('GROUP', group, `other-${Math.random().toString(36).slice(2,6)}`, 'COUNT', 1, 'BLOCK', 500, 'STREAMS', streamKey, '>');

      // Wait until the PEL reports at least one pending entry (or timeout)
      const start = Date.now();
      while (Date.now() - start < 10000) {
        const p = await redis.xpending(streamKey, group, '-', '+', 10);
        if (p && p.length > 0) break;
        await new Promise((r) => setTimeout(r, 150));
      }

      // Reclaim and process (minIdleMs=0 to claim immediately)
      await eventBus.reclaimAndProcess(eventName, 0, 10);

      // allow a short moment for handler to run
      await new Promise((r) => setTimeout(r, 300));

      expect(processed).toEqual({ foo: 'bar1' });

      const pending = await redis.xpending(streamKey, group, '-', '+', 10);
      expect(pending).toHaveLength(0);
  }, 60000);

    it('moves failed reclaimed entry to DLQ', async () => {
      const eventName = `integration.test.fail.${Date.now()}`;
      const streamKey = `stream:${eventName}`;
  const group = `grp-${Math.random().toString(36).slice(2,6)}`;
      // create consumer group before starting the eventBus
      try { await redis.xgroup('CREATE', streamKey, group, '0', 'MKSTREAM'); } catch { /* group may exist */ }
      await redis.xadd(streamKey, '*', 'p', JSON.stringify({ foo: 'bar2' }));

      // Consume into the PEL with another consumer so the eventBus's consumer hasn't processed it
      await consumerClient.xreadgroup('GROUP', group, `other-${Math.random().toString(36).slice(2,6)}`, 'COUNT', 1, 'BLOCK', 500, 'STREAMS', streamKey, '>');

      // instantiate eventBus after the entry is in the PEL and register failing handler
      eventBus = new RedisStreamsEventBus(redisUrl, group, `consumer-${Math.random().toString(36).slice(2,6)}`);
      eventBus.subscribe(eventName, async () => {
        throw new Error('handler-fail');
      });

      // Wait until entry shows in PEL
      const start2 = Date.now();
      while (Date.now() - start2 < 10000) {
        const p2 = await redis.xpending(streamKey, group, '-', '+', 10);
        if (p2 && p2.length > 0) break;
        await new Promise((r) => setTimeout(r, 150));
      }

      // Reclaim and process (handler will fail and code should move entry to DLQ)
      await eventBus.reclaimAndProcess(eventName, 0, 10);

      // allow propagation
      const start3 = Date.now();
      let dlq: any[] = [];
      while (Date.now() - start3 < 15000) {
        dlq = await redis.xrange(`stream:dlq:${eventName}`, '-', '+');
        if (dlq && dlq.length > 0) break;
        await new Promise((r) => setTimeout(r, 200));
      }

      expect(dlq.length).toBeGreaterThan(0);

      const pending = await redis.xpending(streamKey, group, '-', '+', 10);
      expect(pending).toHaveLength(0);
    }, 60000);
  });
}
