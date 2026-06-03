/** Tests for the consumer module (validators + service-backed FK checks). */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  role: { findByPk: jest.fn() },
  unit: { findByPk: jest.fn() },
  unit_category_list: { findByPk: jest.fn() },
  builderConsumer: { findOne: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const consumerRoutes = require("./consumer.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", consumerRoutes);
  return app;
}

const ADD_URL = "/api/user/data/consumer/add";

const validBody = {
  username: "Jo",
  email: "jo@x.com",
  mobileNumber: "9876543210",
  role_id: 3,
  unit_id: 1,
  category_id: 2,
};

beforeEach(() => jest.clearAllMocks());

describe("POST add consumer (validator)", () => {
  it("rejects missing required fields", async () => {
    const res = await request(buildApp()).post(ADD_URL).send({ username: "Jo" });
    expect(res.status).toBe(400);
    expect(db.role.findByPk).not.toHaveBeenCalled();
  });

  it("400 when a foreign key does not exist (service)", async () => {
    db.role.findByPk.mockResolvedValue(null);
    db.unit.findByPk.mockResolvedValue({ unit_id: 1 });
    db.unit_category_list.findByPk.mockResolvedValue({ id: 2 });
    const res = await request(buildApp()).post(ADD_URL).send(validBody);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Foreign Key Error/);
  });
});
