/** Tests for asyncHandler / wrapController. */
const express = require("express");
const request = require("supertest");

const { asyncHandler, wrapController } = require("./asyncHandler");

describe("asyncHandler", () => {
  it("forwards a rejected promise to the error handler (no hang)", async () => {
    const app = express();
    app.get("/boom", asyncHandler(async () => {
      throw new Error("kaboom");
    }));
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

    const res = await request(app).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("kaboom");
  });

  it("passes through a successful handler", async () => {
    const app = express();
    app.get("/ok", asyncHandler(async (req, res) => res.json({ ok: true })));
    const res = await request(app).get("/ok");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("wrapController wraps every function and leaves non-functions alone", () => {
    const wrapped = wrapController({ a: () => 1, b: () => 2, note: "x" });
    expect(typeof wrapped.a).toBe("function");
    expect(typeof wrapped.b).toBe("function");
    expect(wrapped.note).toBe("x");
  });
});
