/**
 * Prometheus metrics (prom-client).
 *
 * - Default Node/process metrics (event loop, memory, GC, ...).
 * - An HTTP request-duration histogram labelled by method/route/status.
 * - A /metrics handler, optionally guarded by METRICS_TOKEN.
 */
const client = require("prom-client");

const register = new client.Registry();
register.setDefaultLabels({ app: "nanakfinserv-api" });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestsTotal);

/** Records duration + count for every request. */
function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    // Prefer the matched route pattern (low cardinality) over the raw path.
    const route = (req.route && req.route.path) || req.path || "unknown";
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
}

/** GET /metrics handler (Prometheus exposition format). */
async function metricsHandler(req, res) {
  // Optional shared-secret guard so the endpoint isn't world-readable.
  const required = process.env.METRICS_TOKEN;
  if (required) {
    const provided = (req.query && req.query.token) || req.headers["x-metrics-token"];
    if (provided !== required) {
      return res.status(401).json({ message: "Unauthorized", status: false });
    }
  }
  res.set("Content-Type", register.contentType);
  return res.end(await register.metrics());
}

module.exports = { register, metricsMiddleware, metricsHandler };
