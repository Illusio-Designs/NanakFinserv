/** Tests for the consumer module (validators + service-backed FK checks). */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  role: { findByPk: jest.fn() },
  unit: { findByPk: jest.fn() },
  unit_category_list: { findByPk: jest.fn() },
  builderConsumer: { findOne: jest.fn(), create: jest.fn() },
  user: { findOne: jest.fn(), create: jest.fn(), update: jest.fn() },
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

describe("service.createBuilderConsumer", () => {
  const service = require("./consumer.service");

  it("creates a standalone builder-consumer when not interested", async () => {
    db.builderConsumer.create.mockResolvedValue({ builder_consumer_id: 1 });
    const result = await service.createBuilderConsumer(
      { status: "pending", unit_id: 1 },
      9
    );
    expect(result.isInterested).toBe(false);
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.builderConsumer.create).toHaveBeenCalled();
  });

  it("reuses an existing user when interested", async () => {
    db.user.findOne.mockResolvedValue({ user_id: 5, builder_user: null });
    db.builderConsumer.create.mockResolvedValue({ builder_consumer_id: 2 });
    const result = await service.createBuilderConsumer(
      { status: "interested", mobileNumber: "9876543210", builder_user_id: 3 },
      9
    );
    expect(result.isInterested).toBe(true);
    expect(result.user.user_id).toBe(5);
    expect(db.user.update).toHaveBeenCalled(); // links builder_user
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("creates a new user when interested and none exists", async () => {
    db.user.findOne.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ user_id: 8 });
    db.builderConsumer.create.mockResolvedValue({ builder_consumer_id: 3 });
    const result = await service.createBuilderConsumer(
      { status: "interested", mobileNumber: "9876543210", username: "Jo" },
      9
    );
    expect(result.user.user_id).toBe(8);
    expect(db.builderConsumer.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 8 })
    );
  });

  it("signals userCreateFailed when the user has no id", async () => {
    db.user.findOne.mockResolvedValue(null);
    db.user.create.mockResolvedValue({});
    const result = await service.createBuilderConsumer(
      { status: "interested", mobileNumber: "9876543210" },
      9
    );
    expect(result.userCreateFailed).toBe(true);
    expect(db.builderConsumer.create).not.toHaveBeenCalled();
  });
});
