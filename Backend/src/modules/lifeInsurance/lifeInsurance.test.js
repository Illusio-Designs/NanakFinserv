/** Tests for the lifeInsurance module (delete + status validator). */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  lifeInsurance: { destroy: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const liRoutes = require("./lifeInsurance.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", liRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("DELETE /api/user/life-insurance/delete/:id", () => {
  it("deletes an existing policy", async () => {
    db.lifeInsurance.destroy.mockResolvedValue(1);
    const res = await request(buildApp()).delete("/api/user/life-insurance/delete/3");
    expect(res.status).toBe(200);
    expect(db.lifeInsurance.destroy).toHaveBeenCalledWith({ where: { id: "3" } });
  });

  it("returns 404 when nothing is deleted", async () => {
    db.lifeInsurance.destroy.mockResolvedValue(0);
    const res = await request(buildApp()).delete("/api/user/life-insurance/delete/3");
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/user/life-insurance/status/:id (validator)", () => {
  it("rejects when status is missing", async () => {
    const res = await request(buildApp()).put("/api/user/life-insurance/status/3").send({});
    expect(res.status).toBe(400);
  });
});
