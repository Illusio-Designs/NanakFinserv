/** Tests for the buildingManager module. */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  buildingManager: { findByPk: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const bmRoutes = require("./buildingManager.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", bmRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("PUT /api/user/building-manager/remove/:id", () => {
  it("soft-removes an existing manager", async () => {
    const update = jest.fn().mockResolvedValue();
    db.buildingManager.findByPk.mockResolvedValue({ id: 8, update });
    const res = await request(buildApp()).put("/api/user/building-manager/remove/8");
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ status: "inactive" });
  });

  it("returns 404 when the manager is missing", async () => {
    db.buildingManager.findByPk.mockResolvedValue(null);
    const res = await request(buildApp()).put("/api/user/building-manager/remove/8");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/user/building-manager/create (validator)", () => {
  it("rejects missing required fields", async () => {
    const res = await request(buildApp())
      .post("/api/user/building-manager/create")
      .send({ username: "x", email: "x@y.com" });
    expect(res.status).toBe(400);
  });
});
