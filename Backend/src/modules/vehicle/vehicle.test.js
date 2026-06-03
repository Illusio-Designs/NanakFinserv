/**
 * Tests for the vehicle module: the service-backed remark-update path
 * (controller -> service -> mocked models) and validator rejections.
 */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  vehicleUser: { findByPk: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const vehicleRoutes = require("./vehicle.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", vehicleRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

const REMARK_URL = "/api/user/vehicle/user/update/remark/55";

describe("PUT /user/vehicle/user/update/remark/:id", () => {
  it("updates the remark when the vehicle exists", async () => {
    const update = jest.fn().mockResolvedValue();
    db.vehicleUser.findByPk.mockResolvedValue({ vehicle_user_id: 55, update });

    const res = await request(buildApp()).put(REMARK_URL).send({ remark: "called customer" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(db.vehicleUser.findByPk).toHaveBeenCalledWith("55");
    expect(update).toHaveBeenCalledWith({ remark: "called customer" });
  });

  it("returns 404 when the vehicle does not exist", async () => {
    db.vehicleUser.findByPk.mockResolvedValue(null);
    const res = await request(buildApp()).put(REMARK_URL).send({ remark: "x" });
    expect(res.status).toBe(404);
  });

  it("rejects a missing remark (validator)", async () => {
    const res = await request(buildApp()).put(REMARK_URL).send({});
    expect(res.status).toBe(400);
    expect(db.vehicleUser.findByPk).not.toHaveBeenCalled();
  });

  it("rejects a remark over 1000 chars (validator)", async () => {
    const res = await request(buildApp())
      .put(REMARK_URL)
      .send({ remark: "a".repeat(1001) });
    expect(res.status).toBe(400);
    expect(db.vehicleUser.findByPk).not.toHaveBeenCalled();
  });
});
