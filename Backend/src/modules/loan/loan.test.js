/**
 * Tests for the loan module: the service-backed status-update path
 * (controller -> service -> mocked models) and validator rejections.
 */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  loanUser: { update: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const loanRoutes = require("./loan.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", loanRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("PUT /api/user/list/loanUpdateStatus", () => {
  it("updates the loan status via the service", async () => {
    db.loanUser.update.mockResolvedValue([1]);
    db.loanUser.findOne.mockResolvedValue({ user_id: 7, status: "interested", role_id: 1 });

    const res = await request(buildApp())
      .put("/api/user/list/loanUpdateStatus")
      .send({ status: "interested", user_consumer_id: 7 });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(db.loanUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "interested", role_id: 1 }),
      { where: { user_id: 7 } }
    );
  });

  it("returns 404 when no row is updated", async () => {
    db.loanUser.update.mockResolvedValue([0]);
    const res = await request(buildApp())
      .put("/api/user/list/loanUpdateStatus")
      .send({ status: "interested", user_consumer_id: 7 });
    expect(res.status).toBe(404);
    expect(db.loanUser.findOne).not.toHaveBeenCalled();
  });

  it("clears remarks unless status is notInterested", async () => {
    db.loanUser.update.mockResolvedValue([1]);
    db.loanUser.findOne.mockResolvedValue({ user_id: 7 });
    await request(buildApp())
      .put("/api/user/list/loanUpdateStatus")
      .send({ status: "interested", user_consumer_id: 7, remarks: "ignore me" });
    expect(db.loanUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ remarks: null }),
      expect.any(Object)
    );
  });

  it("keeps remarks when status is notInterested and scopes by laon_id", async () => {
    db.loanUser.update.mockResolvedValue([1]);
    db.loanUser.findOne.mockResolvedValue({ user_id: 7 });
    await request(buildApp())
      .put("/api/user/list/loanUpdateStatus")
      .send({ status: "notInterested", user_consumer_id: 7, laon_id: 99, remarks: "not now" });
    expect(db.loanUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ remarks: "not now" }),
      { where: { user_id: 7, laon_id: 99 } }
    );
  });

  it("rejects when status is missing (validator)", async () => {
    const res = await request(buildApp())
      .put("/api/user/list/loanUpdateStatus")
      .send({ user_consumer_id: 7 });
    expect(res.status).toBe(400);
    expect(db.loanUser.update).not.toHaveBeenCalled();
  });
});

describe("validator rejections", () => {
  it("rejects working-status update without user_consumer_id", async () => {
    const res = await request(buildApp())
      .put("/api/user/list/loanUpdateWorkingStatus")
      .send({ status: "query" });
    expect(res.status).toBe(400);
  });

  it("rejects disburse/add without categoryname", async () => {
    const res = await request(buildApp())
      .post("/api/user/loan/disburse/add")
      .send({ user_id: 3 });
    expect(res.status).toBe(400);
  });
});
