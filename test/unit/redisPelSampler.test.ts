import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startPelSampler } from '../../server/lib/redisPelSampler';
import * as metrics from '../../server/lib/metrics';

describe('redisPelSampler', () => {
  let spy: any;

  beforeEach(() => {
    spy = vi.spyOn(metrics, 'setPelSize').mockImplementation(() => undefined as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls setPelSize when XPENDING returns an array summary', async () => {
    const fakeRedis: any = {
      send_command: vi.fn().mockResolvedValue(['7']),
    };

    const stop = startPelSampler(fakeRedis, ['order.submitted'], 'grp-test', 100000);

    // wait for initial runOnce to complete
    await new Promise((r) => setTimeout(r, 50));

    expect(fakeRedis.send_command).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('stream:order.submitted', 'grp-test', 7);

    stop();
  });

  it('calls setPelSize when XPENDING returns an object with count', async () => {
    const fakeRedis: any = {
      send_command: vi.fn().mockResolvedValue({ count: 5 }),
    };

    const stop = startPelSampler(fakeRedis, ['order.submitted'], 'grp-test', 100000);
    await new Promise((r) => setTimeout(r, 50));

    expect(fakeRedis.send_command).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('stream:order.submitted', 'grp-test', 5);

    stop();
  });
});
