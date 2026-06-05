/**
 * Tests for the vehicle module: the service-backed remark-update path
 * (controller -> service -> mocked models) and validator rejections.
 */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  vehicleUser: { findByPk: jest.fn() },
}))
jest.mock("../../middleware/verticals", () => ({
  requireVerticalEnabled: () => (req, res, next) => next(),
}));;

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

describe("service.normalizePayload", () => {
  const service = require("./vehicle.service");

  it("parses a JSON request nested under `data`", () => {
    const out = service.normalizePayload({ data: { Name: "Car", runningPolicy: { CompanyId: 1 } } }, "application/json");
    expect(out.error).toBeUndefined();
    expect(out.Data.Name).toBe("Car");
    expect(out.runningPolicy).toEqual({ CompanyId: 1 });
    // previousPolicy defaulted
    expect(out.previousPolicy).toEqual({ PolicyTypeId: null, CompanyId: null, PolicyPlanTypeId: null });
  });

  it("parses multipart FormData with JSON-string sub-objects", () => {
    const out = service.normalizePayload(
      { Name: "Car", runningPolicy: '{"CompanyId":2}', documentsData: "[]" },
      "multipart/form-data; boundary=x"
    );
    expect(out.runningPolicy).toEqual({ CompanyId: 2 });
    expect(out.documentsData).toEqual([]);
  });

  it("falls back to {} on a malformed JSON string (matches legacy behavior)", () => {
    const out = service.normalizePayload(
      { Name: "Car", runningPolicy: "{not-json" },
      "multipart/form-data"
    );
    // malformed -> {} in the catch; {} is already an object so the defensive
    // check keeps it (it is not replaced by the null-filled default).
    expect(out.runningPolicy).toEqual({});
  });

  it("returns an error when no data is present", () => {
    const out = service.normalizePayload({}, "text/plain");
    expect(out.error).toMatch(/Data not found/);
  });
});

describe("service.parseUpdatePayload", () => {
  const service = require("./vehicle.service");

  it("parses JSON under `data` without defaulting policies", () => {
    const out = service.parseUpdatePayload({ data: { Name: "X" } }, "application/json");
    expect(out.Data.Name).toBe("X");
    expect(out.Data.runningPolicy).toBeUndefined(); // not defaulted (unlike add)
  });

  it("parses multipart policy strings", () => {
    const out = service.parseUpdatePayload(
      { previousPolicy: '{"CompanyId":9}' },
      "multipart/form-data"
    );
    expect(out.Data.previousPolicy).toEqual({ CompanyId: 9 });
  });

  it("errors when no data present", () => {
    expect(service.parseUpdatePayload({}, "text/plain").error).toMatch(/Data not found/);
  });
});
