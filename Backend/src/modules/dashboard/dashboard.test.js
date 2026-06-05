/** Tests for the dashboard module (amount filter). */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  disbursementLoan: { sum: jest.fn() },
  loginLoan: { sum: jest.fn() },
  partPaymentLoan: { sum: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const dashboardRoutes = require("./dashboard.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", dashboardRoutes);
  return app;
}

const URL = "/api/user/data/filter/amount";

beforeEach(() => jest.clearAllMocks());

describe("POST /api/user/data/filter/amount", () => {
  it("returns aggregate sums for an admin", async () => {
    db.disbursementLoan.sum.mockResolvedValue(500);
    db.loginLoan.sum.mockResolvedValue(1000);
    db.partPaymentLoan.sum.mockResolvedValue(50);
    const res = await request(buildApp())
      .post(URL)
      .send({ start_date: "2026-01-01", end_date: "2026-01-31" });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalLoandAmount: 1000,
      totalDisbursedAmount: 500,
      totalPartPaymentAmount: 50,
    });
  });

  it("rejects when dates are missing (validator)", async () => {
    const res = await request(buildApp()).post(URL).send({});
    expect(res.status).toBe(400);
    expect(db.loginLoan.sum).not.toHaveBeenCalled();
  });
});
