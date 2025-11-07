Monitoring — Prometheus rules
=============================

What this contains
- `rules/redis_streams.rules.yml` — example alerting rules for Redis Streams-related metrics exported by the server (PEL size, DLQ spikes, reclaimer errors).

How to use
- Standalone Prometheus:
  1. Place `redis_streams.rules.yml` into a folder that Prometheus can read (for example `/etc/prometheus/rules/`).
  2. Add the folder or file to `prometheus.yml` under `rule_files:` and restart Prometheus.

    ```yaml
    rule_files:
      - /etc/prometheus/rules/redis_streams.rules.yml
    ```

- Prometheus Operator (k8s):
  - Convert the file into a `PrometheusRule` resource or include it in the operator's alerting config per your operator documentation. Many clusters keep rules in a dedicated repo or a `ConfigMap` that the Prometheus Operator watches.

Tips
- Tune thresholds before enabling on production. The repo examples use conservative defaults for demonstration.
- Pair these alerts with a dashboard (Grafana) that visualizes `redis_streams_pending_entries`, `redis_streams_dlq_total`, and `redis_streams_reclaimed_total`.

Support
- If you want, I can add a `kustomize` overlay or a `PrometheusRule` manifest for a typical Prometheus Operator installation as a follow-up.
