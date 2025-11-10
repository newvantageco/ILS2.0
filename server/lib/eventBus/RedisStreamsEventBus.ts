import IORedis from 'ioredis';
import { createLogger } from '../../utils/logger';
import { incReclaimed, incDlq, incReclaimFailures, setPelSize } from '../metrics';

type EventHandler = (payload: any) => Promise<void> | void;

export class RedisStreamsEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private redis: any;
  private running: Map<string, boolean> = new Map();
  private logger = createLogger('RedisStreamsEventBus');
  private groupPrefix = 'events_stream_group';

  constructor(redisUrl: string, private groupName = 'ils_group', private consumerName = `consumer-${Math.random().toString(36).slice(2,8)}`) {
    this.redis = new IORedis(redisUrl);
    this.groupName = groupName;
  }

  subscribe(eventName: string, handler: EventHandler) {
    const list = this.handlers.get(eventName) || [];
    list.push(handler);
    this.handlers.set(eventName, list);
    this.logger.debug('handler subscribed', { eventName });

    if (!this.running.get(eventName)) {
      this.running.set(eventName, true);
      this.startConsumerLoop(eventName).catch((err) => {
        this.logger.error('Redis Streams consumer loop error', err as Error, { eventName });
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
    this.logger.debug('handler unsubscribed', { eventName });
  }

  async publish(eventName: string, payload: any) {
    const streamKey = `stream:${eventName}`;
    try {
      // XADD: add the payload as a field 'p' containing JSON
      await this.redis.xadd(streamKey, '*', 'p', JSON.stringify(payload));
      this.logger.debug('published to redis stream', { eventName });
    } catch (err) {
      this.logger.error('Failed to publish to redis stream', err as Error, { eventName });
    }
  }

  private async ensureGroup(streamKey: string) {
    try {
      // Attempt to create consumer group; ignore BUSYGROUP error
      await this.redis.xgroup('CREATE', streamKey, this.groupName, '$', 'MKSTREAM');
      this.logger.info('Created consumer group', { streamKey, group: this.groupName });
    } catch (err: any) {
      if (String(err).includes('BUSYGROUP')) {
        // already exists
        this.logger.debug('Consumer group already exists', { streamKey, group: this.groupName });
      } else {
        this.logger.error('Failed to create consumer group', err as Error, { streamKey });
        throw err;
      }
    }
  }

  private async startConsumerLoop(eventName: string) {
    const streamKey = `stream:${eventName}`;
    await this.ensureGroup(streamKey);
    this.logger.info('Starting redis streams consumer loop', { eventName, streamKey, group: this.groupName, consumer: this.consumerName });

    while (this.running.get(eventName)) {
      try {
        // Read pending entries first (0) and then new entries (>) using XREADGROUP
        // We'll request up to 10 entries at a time and block for 5s
        const res = await this.redis.xreadgroup('GROUP', this.groupName, this.consumerName, 'COUNT', 10, 'BLOCK', 5000, 'STREAMS', streamKey, '>');
        if (!res) {
          continue;
        }

        // res format: [ [ streamKey, [ [id, [field, value, ...]], ... ] ] ]
        for (const stream of res) {
          const entries = stream[1] as Array<any>;
          for (const entry of entries) {
            const id = entry[0];
            const fields = entry[1];
            // fields is [ 'p', '<json>' ]
            const raw = fields[1];
            let payload: any = null;
            try {
              payload = JSON.parse(raw);
            } catch (e) {
              payload = raw;
            }

            const handlers = this.handlers.get(eventName) || [];
            for (const handler of handlers) {
              try {
                await handler(payload);
              } catch (err) {
                this.logger.error('event handler error', err as Error, { eventName, id });
                // Do not ack so it stays in PEL for inspection/retry
              }
            }

            // Acknowledge the message after all handlers ran (best-effort)
            try {
              await this.redis.xack(streamKey, this.groupName, id);
            } catch (ackErr) {
              this.logger.error('Failed to ACK stream entry', ackErr as Error, { eventName, id });
            }
          }
        }
      } catch (err) {
        this.logger.error('Redis Streams consumer loop exception', err as Error, { eventName });
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    this.logger.info('Consumer loop exiting', { eventName });
  }

  // Attempt to claim pending entries older than minIdleMs and process them.
  // This helps recover messages that were delivered to a consumer which then crashed
  // and left entries in the PEL. The method is best-effort and will ACK entries
  // after successful processing.
  async reclaimAndProcess(eventName: string, minIdleMs = 60_000, maxCount = 100) {
    const streamKey = `stream:${eventName}`;
    try {
      // Sample pending count (XPENDING summary) and publish to metrics gauge if available
      try {
        // Best-effort: request XPENDING summary and parse first element as count
        const xpendingSummary: any = await this.redis.send_command?.('XPENDING', [streamKey, this.groupName]);
        if (xpendingSummary) {
          // xpendingSummary often is an array where index 0 is the total pending count
          const pendingCount = Number(xpendingSummary[0] ?? xpendingSummary.count ?? 0) || 0;
          try { setPelSize(streamKey, this.groupName, pendingCount); } catch (_) { /* ignore */ }
        }
      } catch (metricErr) {
        this.logger.debug('Failed to sample XPENDING summary for metrics', { eventName, err: metricErr as Error });
      }
      // Get up to maxCount pending entries
      const pending = await this.redis.xpending(streamKey, this.groupName, '-', '+', maxCount);
      if (!pending || pending.length === 0) {
        this.logger.debug('No pending entries to reclaim', { eventName });
        return;
      }

      for (const row of pending) {
        // row format: [id, consumer, idleMs, deliveredTimes]
        const id = row[0];
        const idle = Number(row[2] ?? 0);
        if (idle < minIdleMs) continue;

        // Claim the entry for this consumer
        let claimedEntries: any[] = [];
        try {
          // xclaim returns entries in form [id, [field, value, ...]]
          claimedEntries = await this.redis.xclaim(streamKey, this.groupName, this.consumerName, minIdleMs, id);
        } catch (err) {
          // xclaim may not be available in older redis/ioredis; fallback to xclaim via send_command
          try {
            // This is best-effort; if it fails we continue
            claimedEntries = await this.redis.send_command('XCLAIM', [streamKey, this.groupName, this.consumerName, String(minIdleMs), id]);
          } catch (inner) {
            this.logger.error('Failed to XCLAIM pending entry', inner as Error, { eventName, id });
            continue;
          }
        }

        if (!claimedEntries || claimedEntries.length === 0) continue;

        for (const entry of claimedEntries) {
          const entryId = entry[0];
          const fields = entry[1];
          const raw = fields[1];
          let payload: any = null;
          try { payload = JSON.parse(raw); } catch (e) { payload = raw; }

          const handlers = this.handlers.get(eventName) || [];
          let allOk = true;
          for (const handler of handlers) {
            try {
              await handler(payload);
            } catch (err) {
              allOk = false;
              this.logger.error('Handler failed while reclaim processing', err as Error, { eventName, id: entryId });
            }
          }

          if (allOk) {
            try {
              await this.redis.xack(streamKey, this.groupName, entryId);
              this.logger.info('Reclaimed entry processed and ACKed', { eventName, id: entryId });
              try { incReclaimed(1); } catch (_) { /* ignore metrics errors */ }
            } catch (ackErr) {
              this.logger.error('Failed to ACK reclaimed entry', ackErr as Error, { eventName, id: entryId });
            }
          } else {
            this.logger.warn('Reclaimed entry processing failed; moving to DLQ stream', { eventName, id: entryId });
            try {
              const dlqKey = `stream:dlq:${eventName}`;
              // Store original id, payload and marker about failure for manual inspection
              await this.redis.xadd(dlqKey, '*', 'originalId', entryId, 'p', JSON.stringify(payload), 'claimedBy', this.consumerName, 'failedAt', String(Date.now()));
              this.logger.info('Moved reclaimed entry to DLQ', { eventName, id: entryId, dlqKey });
              try { incDlq(1); } catch (_) { /* ignore metrics errors */ }
              // Acknowledge the original entry so it doesn't remain in PEL
              await this.redis.xack(streamKey, this.groupName, entryId);
            } catch (dlqErr) {
              this.logger.error('Failed to move reclaimed entry to DLQ', dlqErr as Error, { eventName, id: entryId });
              this.logger.warn('Leaving entry in PEL for manual inspection', { eventName, id: entryId });
            }
          }
        }
      }
    } catch (err) {
      try { incReclaimFailures(1); } catch (_) { /* ignore metrics errors */ }
      this.logger.error('Failed during reclaimAndProcess', err as Error, { eventName });
    }
  }
}
