import client from 'prom-client';

const register = new client.Registry();

// Allow metrics to be disabled via env var
const enabled = process.env.METRICS_ENABLED === 'true';

if (enabled) {
  // Collect default Node metrics (CPU, heap, event loop) into our registry
  client.collectDefaultMetrics({ register });
}

// Counters
const reclaimedCounter = new client.Counter({
  name: 'redis_streams_reclaimed_total',
  help: 'Number of Redis Streams pending entries reclaimed and successfully processed',
  registers: enabled ? [register] : [],
});

const dlqCounter = new client.Counter({
  name: 'redis_streams_dlq_total',
  help: 'Number of Redis Streams entries moved to DLQ',
  registers: enabled ? [register] : [],
});

const reclaimerFailuresCounter = new client.Counter({
  name: 'redis_streams_reclaimer_failures_total',
  help: 'Number of failures encountered while running the reclaimer',
  registers: enabled ? [register] : [],
});

// Gauge for pending entries (PEL) per stream+group
const pelGauge = new client.Gauge({
  name: 'redis_streams_pending_entries',
  help: 'Current number of pending (un-ACKed) entries in the Redis Streams PEL by stream and group',
  labelNames: ['stream', 'group'],
  registers: enabled ? [register] : [],
});

// Export small helper API for the event bus
export function incReclaimed(n = 1) {
  if (!enabled) return;
  reclaimedCounter.inc(n);
}

export function incDlq(n = 1) {
  if (!enabled) return;
  dlqCounter.inc(n);
}

export function incReclaimFailures(n = 1) {
  if (!enabled) return;
  reclaimerFailuresCounter.inc(n);
}

// Set the pending-entry gauge for a given stream & group
export function setPelSize(stream: string, group: string, n: number) {
  if (!enabled) return;
  try {
    pelGauge.labels(stream, group).set(n);
  } catch (_) {
    // ignore metric errors
  }
}

export function metricsHandler(_: any, res: any) {
  if (!enabled) {
    res.status(404).send('Metrics disabled');
    return;
  }

  res.setHeader('Content-Type', register.contentType || client.register.contentType);
  register.metrics().then((m: string) => res.end(m)).catch((err: any) => {
    res.status(500).send(String(err));
  });
}

// Expose the register for programmatic access if needed
export { register };
