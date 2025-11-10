import IORedis from 'ioredis';
import { setPelSize } from './metrics';
import { createLogger } from '../utils/logger';

const logger = createLogger('redisPelSampler');

export function startPelSampler(redisClient: any, streams: string[], groupName = 'ils_group', intervalMs = 60_000) {
  if (!redisClient || !streams || streams.length === 0) return () => {};

  let stopped = false;

  const runOnce = async () => {
    for (const s of streams) {
      const streamKey = `stream:${s}`;
      try {
        // XPENDING <stream> <group> returns a summary array where index 0 is total pending
        // Use send_command to support older/newer ioredis variations
        const res: any = await (redisClient as any).send_command?.('XPENDING', [streamKey, groupName]);
        let pendingCount = 0;
        if (Array.isArray(res)) {
          pendingCount = Number(res[0] ?? 0) || 0;
        } else if (res && typeof res === 'object' && 'count' in res) {
          pendingCount = Number((res as any).count) || 0;
        }
        try { setPelSize(streamKey, groupName, pendingCount); } catch (_) {}
      } catch (err) {
        logger.debug({ stream: s, group: groupName, err }, 'Failed to sample XPENDING for stream');
      }
    }
  };

  const interval = setInterval(() => {
    if (stopped) return;
    runOnce().catch((err) => logger.error({ err }, 'PEL sampler run failed'));
  }, intervalMs);

  // Run immediately once
  runOnce().catch((err) => logger.error({ err }, 'Initial PEL sampler run failed'));

  return () => {
    stopped = true;
    clearInterval(interval);
  };
}
