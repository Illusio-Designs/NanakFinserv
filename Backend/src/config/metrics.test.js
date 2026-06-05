/** Tests for the Prometheus metrics middleware + handler. */
const express = require("express");
const request = require("supertest");

const { metricsMiddleware, metricsHandler } = require("./metrics");

function buildApp() {
  const app = express();
  app.use(metricsMiddleware);
  app.get("/ping", (req, res) => res.json({ ok: true }));
  app.get("/metrics", metricsHandler);
  return app;
}

describe("metrics", () => {
  it("exposes Prometheus metrics after a request", async () => {
    const app = buildApp();
    await request(app).get("/ping");
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/plain/);
    expect(res.text).toMatch(/http_requests_total/);
    expect(res.text).toMatch(/process_cpu_seconds_total|nodejs_/);
  });

  it("guards /metrics when METRICS_TOKEN is set", async () => {
    process.env.METRICS_TOKEN = "secret";
    const app = buildApp();
    const denied = await request(app).get("/metrics");
    expect(denied.status).toBe(401);
    const allowed = await request(app).get("/metrics?token=secret");
    expect(allowed.status).toBe(200);
    delete process.env.METRICS_TOKEN;
  });
});
