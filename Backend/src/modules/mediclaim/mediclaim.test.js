/**
 * Tests for the mediclaim module: company operations (controller -> service ->
 * mocked models) and validator rejections.
 */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  mediclaimCompany: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
}))
jest.mock("../../middleware/verticals", () => ({
  requireVerticalEnabled: () => (req, res, next) => next(),
}));;

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const mediclaimRoutes = require("./mediclaim.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", mediclaimRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/user/mediclaim/company", () => {
  it("lists companies", async () => {
    db.mediclaimCompany.findAll.mockResolvedValue([{ mediclaim_company_id: 1 }]);
    const res = await request(buildApp()).get("/api/user/mediclaim/company");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe("POST /api/user/mediclaim/company/add", () => {
  it("creates a new company", async () => {
    db.mediclaimCompany.findOne.mockResolvedValue(null);
    db.mediclaimCompany.create.mockResolvedValue({ mediclaim_company_id: 9, mediclaim_company_name: "Acme" });
    const res = await request(buildApp())
      .post("/api/user/mediclaim/company/add")
      .send({ mediclaim_company_name: "Acme" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(db.mediclaimCompany.create).toHaveBeenCalledWith({ mediclaim_company_name: "Acme" });
  });

  it("rejects a duplicate company name", async () => {
    db.mediclaimCompany.findOne.mockResolvedValue({ mediclaim_company_id: 1 });
    const res = await request(buildApp())
      .post("/api/user/mediclaim/company/add")
      .send({ mediclaim_company_name: "Acme" });
    expect(res.status).toBe(400);
    expect(db.mediclaimCompany.create).not.toHaveBeenCalled();
  });

  it("rejects a missing name (validator)", async () => {
    const res = await request(buildApp())
      .post("/api/user/mediclaim/company/add")
      .send({});
    expect(res.status).toBe(400);
    expect(db.mediclaimCompany.findOne).not.toHaveBeenCalled();
  });
});

describe("PUT /api/user/mediclaim/company/update", () => {
  it("updates when no name clash", async () => {
    db.mediclaimCompany.findOne.mockResolvedValue(null);
    db.mediclaimCompany.update.mockResolvedValue([1]);
    const res = await request(buildApp())
      .put("/api/user/mediclaim/company/update")
      .send({ mediclaim_company_id: 1, mediclaim_company_name: "Renamed" });
    expect(res.status).toBe(200);
    expect(db.mediclaimCompany.update).toHaveBeenCalled();
  });

  it("rejects when another company already has the name", async () => {
    db.mediclaimCompany.findOne.mockResolvedValue({ mediclaim_company_id: 2 });
    const res = await request(buildApp())
      .put("/api/user/mediclaim/company/update")
      .send({ mediclaim_company_id: 1, mediclaim_company_name: "Taken" });
    expect(res.status).toBe(400);
    expect(db.mediclaimCompany.update).not.toHaveBeenCalled();
  });

  it("rejects without an id (validator)", async () => {
    const res = await request(buildApp())
      .put("/api/user/mediclaim/company/update")
      .send({ mediclaim_company_name: "x" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/user/mediclaim/product/add/:id", () => {
  it("rejects without a product name (validator)", async () => {
    const res = await request(buildApp())
      .post("/api/user/mediclaim/product/add/5")
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("more mediclaim validators", () => {
  it("rejects user add without `data` (validator)", async () => {
    const res = await request(buildApp()).post("/api/user/mediclaim/user/add").send({});
    expect(res.status).toBe(400);
  });

  it("rejects product update without a name (validator)", async () => {
    const res = await request(buildApp()).put("/api/user/mediclaim/product/update/5").send({});
    expect(res.status).toBe(400);
  });
});
