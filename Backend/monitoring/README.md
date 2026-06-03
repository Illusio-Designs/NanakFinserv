# Monitoring

The API exposes Prometheus metrics at **`GET /metrics`** (guard with `METRICS_TOKEN`
to require `?token=` / `X-Metrics-Token`). Liveness is **`/health`**, readiness
(checks the DB) is **`/ready`**.

## Files
- `prometheus-rules.yml` — alerting rules (ApiDown, HighErrorRate, ElevatedAuthFailures,
  HighRequestLatencyP95, EventLoopLagHigh, HighMemoryUsage).
- `prometheus-scrape.example.yml` — example scrape + rule_files + Alertmanager wiring.
- `alertmanager.example.yml` — example receivers routing critical→PagerDuty+Slack,
  warning→Slack (replace the placeholder webhook/routing-key with yours).

## Wire it up
1. Mount `prometheus-rules.yml` into Prometheus (e.g. `/etc/prometheus/rules/`).
2. Add the scrape job + `rule_files` from the example to your `prometheus.yml`.
3. Point `alerting.alertmanagers` at your Alertmanager, then define receivers/routes
   there (Slack/PagerDuty/email) for the `severity: critical|warning` labels.

## Key metrics
| Metric | Type | Labels |
|--------|------|--------|
| `http_requests_total` | counter | method, route, status_code |
| `http_request_duration_seconds` | histogram | method, route, status_code |
| `up`, `process_*`, `nodejs_*` | default | instance/job |
