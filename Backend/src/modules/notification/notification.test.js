/** Tests for the notification module. */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  notification: { findByPk: jest.fn(), count: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const notificationRoutes = require("./notification.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", notificationRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("PUT /api/user/notifications/:id/read", () => {
  it("marks an existing notification read", async () => {
    const update = jest.fn().mockResolvedValue();
    db.notification.findByPk.mockResolvedValue({ id: 5, update });
    const res = await request(buildApp()).put("/api/user/notifications/5/read");
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ is_read: true });
  });

  it("returns 404 when not found", async () => {
    db.notification.findByPk.mockResolvedValue(null);
    const res = await request(buildApp()).put("/api/user/notifications/5/read");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/user/notifications/count", () => {
  it("returns total and unread counts", async () => {
    db.notification.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(4); // unread
    const res = await request(buildApp()).get("/api/user/notifications/count");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 10, unread: 4 });
  });
});
