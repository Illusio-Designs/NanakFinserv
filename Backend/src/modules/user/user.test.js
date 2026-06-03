/**
 * Tests for the user module: service-backed read endpoints (real
 * controller -> real service -> mocked models) and validator rejections.
 */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => next());
jest.mock("../../../app/models", () => ({
  category: { findAll: jest.fn() },
  userCategory: { findAll: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const userRoutes = require("./user.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", userRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/user/role/list", () => {
  it("returns roles from the service", async () => {
    db.category.findAll.mockResolvedValue([{ category_id: 2, category_name: "Loan" }]);
    const res = await request(buildApp()).get("/api/user/role/list");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(db.category.findAll).toHaveBeenCalled();
  });
});

describe("GET /api/user/list/verticle", () => {
  it("returns verticals (excludes reserved ids)", async () => {
    db.category.findAll.mockResolvedValue([{ category_id: 4 }]);
    const res = await request(buildApp()).get("/api/user/list/verticle");
    expect(res.status).toBe(200);
    expect(db.category.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.any(Object) })
    );
  });
});

describe("POST /api/user/list/categoriesById", () => {
  it("returns categories for a user_id", async () => {
    db.userCategory.findAll.mockResolvedValue([{ user_id: 5, category_id: 2 }]);
    const res = await request(buildApp())
      .post("/api/user/list/categoriesById")
      .send({ user_id: 5 });
    expect(res.status).toBe(200);
    expect(db.userCategory.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 5 } })
    );
  });

  it("rejects when user_id is missing (validator)", async () => {
    const res = await request(buildApp())
      .post("/api/user/list/categoriesById")
      .send({});
    expect(res.status).toBe(400);
    expect(db.userCategory.findAll).not.toHaveBeenCalled();
  });
});

describe("validator rejections on mutating routes", () => {
  it("rejects role/add with missing fields", async () => {
    const res = await request(buildApp())
      .post("/api/user/data/role/add")
      .send({ username: "x" });
    expect(res.status).toBe(400);
  });

  it("rejects role/add with a bad email", async () => {
    const res = await request(buildApp())
      .post("/api/user/data/role/add")
      .send({ username: "x", email: "not-an-email", phone_number: "9876543210", role: 4, roleId: "2" });
    expect(res.status).toBe(400);
  });

  it("rejects role/add with a short phone number", async () => {
    const res = await request(buildApp())
      .post("/api/user/data/role/add")
      .send({ username: "x", email: "a@b.com", phone_number: "123", role: 4, roleId: "2" });
    expect(res.status).toBe(400);
  });

  it("rejects data/update without user_id", async () => {
    const res = await request(buildApp())
      .put("/api/user/data/update")
      .send({ username: "x", email: "a@b.com", phone_number: "9876543210", role: 4 });
    expect(res.status).toBe(400);
  });
});
