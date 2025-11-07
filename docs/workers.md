# Workers, Event Bus, and Redis Streams — Operational Notes

This document explains runtime configuration, environment variables, and operational guidance for the background workers and event-bus used by ILS.

## Overview
- The server publishes domain events (e.g., `order.submitted`) and lightweight background workers subscribe to those events.
- The event-bus is pluggable. In development it defaults to an in-memory implementation. For production you can choose a Redis-backed adapter.
- Workers are designed to be idempotent, use retry/backoff, and persist failure metadata to order rows so operators can inspect and retry.

## Environment variables (key)
- WORKERS_QUEUE_BACKEND
  - `in-memory` (default) — fast, local, non-durable (good for development).
  - `redis` or `redis-list` — uses a durable list (RPUSH/BRPOP). Simpler durability, but lacks consumer-group semantics.
  - `redis-streams` — uses Redis Streams (XADD/XREADGROUP) with consumer-group semantics and PEL support (recommended for production with Redis).

- REDIS_URL
  - Required when using `redis`, `redis-list`, or `redis-streams` backends. Example: `redis://user:pass@redis.example.com:6379/0`.

- REDIS_STREAMS_GROUP
  - Optional. Default: `ils_group`. Controls the consumer-group name used by the Redis Streams adapter.

- REDIS_STREAMS_CONSUMER
  - Optional. Default: a generated consumer name per process. Use to identify specific consumers in Redis monitoring.

- REDIS_STREAMS_RECLAIM_STREAMS
  - CSV of stream names (event names) that the scheduled reclaimer should inspect for stuck messages.
  - Default: `order.submitted`.

- REDIS_STREAMS_RECLAIM_IDLE_MS
  - Idle threshold in milliseconds for claiming pending entries. Default: `60000` (60s).

- REDIS_STREAMS_RECLAIM_INTERVAL_MS
  - Interval in milliseconds for running the reclaimer across configured streams. Default: `300000` (5 minutes).

- REDIS_STREAMS_PEL_SAMPLER_INTERVAL_MS
  - Interval in milliseconds for the periodic PEL sampler that updates Prometheus gauge `redis_streams_pending_entries{stream,group}`. Default: `60000` (60 seconds).
  - When `METRICS_ENABLED=true` and `WORKERS_QUEUE_BACKEND=redis-streams`, the server will start a sampler that periodically runs `XPENDING` for configured streams and updates the gauge. This gives continuous visibility into backlog size without waiting for the reclaimer to run.

- ANALYTICS_WEBHOOK_URL
  - Optional: if set, the analytics worker will POST analytics events to this webhook.
  - If not set, analytics events are logged locally and a placeholder behavior is used.

- WORKERS_ENABLED
  - Controls whether opt-in workers are registered at startup. Defaults to `true` when Redis is connected, otherwise `false` unless explicitly set to `true`.

## Schema / Migrations
- The analytics worker persists failures to `orders.analytics_error_message` to allow inspection and retry.
- A migration file is included at: `migrations/2025-11-07-0001_add_order_analytics_error_column.sql`
  - Apply via your migration tooling (drizzle-kit or psql) in dev/staging before enabling analytics persistence in production.

## Reclaimer (Redis Streams)
- The Redis Streams adapter includes a `reclaimAndProcess(streamName, minIdleMs, maxCount)` helper that:
  - Uses XPENDING to find entries in the PEL (pending entries list).
  - XCLAIMs entries idle longer than `minIdleMs` to the current consumer.
  - Re-runs handlers and XACKs successful entries.
  - Leaves failed reclaims in the PEL for manual inspection.
- The server will schedule a periodic reclaimer automatically if `WORKERS_QUEUE_BACKEND=redis-streams` and `REDIS_URL` is set. Control streams / idle thresholds via the env vars above.

## Operational notes
- Idempotency: Workers must be idempotent. They should detect completed state (jobId, pdfUrl, etc.) and skip reprocessing.
- DLQ strategy: Workers mark order rows with an error message (e.g., `jobErrorMessage`, `pdfErrorMessage`, `analyticsErrorMessage`) on permanent failure. You can build a dashboard that lists these order rows for manual retry.
- Monitoring: Track the following metrics if possible:
  - Redis stream lag (length of PEL), pending count per group
  - Reclaimed entries count
  - Worker failure rate and permanent failure counts
- Redis Streams compatibility: `XAUTOCLAIM` / `XAUTOCLAIM` improvements require Redis >= 6.2. Current implementation uses XCLAIM for compatibility.

## Metrics (Prometheus)

The application can export Prometheus metrics for Redis Streams reclaiming and DLQ events. Metrics are only enabled when `METRICS_ENABLED=true`.

- Endpoint: `/metrics` — exposed only when `METRICS_ENABLED=true`.
- Dependency: `prom-client` (server must have this package installed).

Exported metrics (current):

- `redis_streams_reclaimed_total` (counter): number of pending entries reclaimed and successfully processed by the reclaimer.
- `redis_streams_dlq_total` (counter): number of entries moved to the DLQ stream by the reclaimer when processing failed.
- `redis_streams_reclaimer_failures_total` (counter): number of times the reclaimer encountered an internal error while running.

How to enable locally:

1. Install dependencies (if needed):

```bash
npm install
```

2. Start the server with metrics enabled:

```bash
export METRICS_ENABLED=true
npm run dev
```

3. Query metrics:

```bash
curl http://localhost:3000/metrics
```

Notes and recommendations:
- The current counters are coarse-grained. For production monitoring you may want to add labels (stream name, consumer group) and a gauge for PEL size that is updated when the reclaimer runs (or periodically by a metrics job).
- Suggested alerts:
  - PEL size > X for more than Y minutes (indicates backlog or crashed consumers)
  - `redis_streams_dlq_total` increases suddenly (indicates failing payloads)
  - `redis_streams_reclaimer_failures_total` increases (investigate reclaimer errors)

Example Prometheus alert rule (Prometheus alerting rule syntax):

```yaml
- alert: RedisStreamsHighPEL
  expr: redis_streams_pending_entries > 100
  for: 10m
  labels:
    severity: page
  annotations:
    summary: "High Redis Streams PEL size ({{ $labels.stream }})"
    description: "The pending-entry list for stream {{ $labels.stream }} and group {{ $labels.group }} has been >100 for 10 minutes. Investigate consumers and DLQ growth."
```

How to load the example rules
 - The repository includes a Prometheus rules file at `monitoring/prometheus/rules/redis_streams.rules.yml`.
 - To use it with a standalone Prometheus, add or import this file in your Prometheus `rule_files` configuration and restart Prometheus. Example `prometheus.yml` snippet:

```yaml
rule_files:
  - /etc/prometheus/rules/*.yml
```

- On Kubernetes with the Prometheus Operator, create a `PrometheusRule` custom resource that points to the rule content or add the file to your `prometheus` configmap as appropriate for your operator setup.

Note: The example thresholds are conservative. Tune `expr` and `for` values to match your environment and SLA.


## Quick dev tips
- To quickly test Redis Streams locally:
  - Run Redis (e.g., `docker run -p 6379:6379 redis:7`) and set `REDIS_URL=redis://localhost:6379`.
  - Set `WORKERS_QUEUE_BACKEND=redis-streams` and start the server.
- To apply the analytics migration locally:
  - psql "$DATABASE_URL" -f migrations/2025-11-07-0001_add_order_analytics_error_column.sql

## Next steps (suggested)
- Add Prometheus metrics and dashboards for Streams PEL size and reclaimer activity.
- Implement automated repair logic for problematic payloads (e.g., move to a separate DLQ stream with reason).
- Add integration tests that spin up a temporary Redis instance (testcontainers or docker) and assert Streams reclaimer behavior.

If you want, I can:
- Add integration tests that run a Redis container and test XADD/XREADGROUP/XACK flows.
- Switch the adapter to use `XAUTOCLAIM` for Redis >= 6.2 and add a feature-detect fallback.
- Add Prometheus metrics support (counters/gauges) and a basic README section on alerting thresholds.

Which of these would you like next?
