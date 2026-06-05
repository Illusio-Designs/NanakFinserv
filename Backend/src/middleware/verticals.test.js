/** Tests for the requireVerticalEnabled middleware. */
jest.mock("../modules/admin/admin.service", () => ({
  getVerticals: jest.fn(),
}));

const express = require("express");
const request = require("supertest");

const adminService = require("../modules/admin/admin.service");
const { requireVerticalEnabled } = require("./verticals");

function buildApp(vertical) {
  const app = express();
  app.get("/loan", requireVerticalEnabled(vertical), (req, res) => res.json({ ok: true }));
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("requireVerticalEnabled", () => {
  it("allows the request when the vertical is enabled", async () => {
    adminService.getVerticals.mockResolvedValue({ loan: true });
    const res = await request(buildApp("loan")).get("/loan");
    expect(res.status).toBe(200);
  });

  it("returns 503 when the vertical is disabled", async () => {
    adminService.getVerticals.mockResolvedValue({ loan: false });
    const res = await request(buildApp("loan")).get("/loan");
    expect(res.status).toBe(503);
    expect(res.body.disabled).toBe(true);
  });
});
