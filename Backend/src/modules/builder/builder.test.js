/** Tests for the builder module (unit-category add). */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  unit: { findOne: jest.fn() },
  unit_category_detail: { findOne: jest.fn(), create: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const builderRoutes = require("./builder.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", builderRoutes);
  return app;
}

const URL = "/api/user/data/add/builderUnitCategory";

beforeEach(() => jest.clearAllMocks());

describe("POST builderUnitCategory", () => {
  it("creates when unit exists and no duplicate", async () => {
    db.unit.findOne.mockResolvedValue({ unit_id: 1 });
    db.unit_category_detail.findOne.mockResolvedValue(null);
    db.unit_category_detail.create.mockResolvedValue({ id: 1 });
    const res = await request(buildApp()).post(URL).send({ unit_id: 1, unit_category_id: 2, count: 3 });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.text).status).toBe(true);
  });

  it("400 when the unit does not exist", async () => {
    db.unit.findOne.mockResolvedValue(null);
    const res = await request(buildApp()).post(URL).send({ unit_id: 9, unit_category_id: 2 });
    expect(res.status).toBe(400);
  });

  it("400 on duplicate unit category", async () => {
    db.unit.findOne.mockResolvedValue({ unit_id: 1 });
    db.unit_category_detail.findOne.mockResolvedValue({ id: 5 });
    const res = await request(buildApp()).post(URL).send({ unit_id: 1, unit_category_id: 2 });
    expect(res.status).toBe(400);
    expect(db.unit_category_detail.create).not.toHaveBeenCalled();
  });

  it("400 when unit_id is missing (validator)", async () => {
    const res = await request(buildApp()).post(URL).send({ unit_category_id: 2 });
    expect(res.status).toBe(400);
    expect(db.unit.findOne).not.toHaveBeenCalled();
  });
});
