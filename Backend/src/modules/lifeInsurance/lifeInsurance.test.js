/** Tests for the lifeInsurance module (delete + status validator). */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  lifeInsurance: { destroy: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  consumerRoleMapping: { create: jest.fn() },
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

describe("service.createPolicy", () => {
  const service = require("./lifeInsurance.service");

  it("generates a proposer_number, creates the policy and the role mapping", async () => {
    db.lifeInsurance.create.mockResolvedValue({ id: 1 });
    db.consumerRoleMapping.create.mockResolvedValue({});
    const data = { created_by: 7 };
    const policy = await service.createPolicy(data);

    expect(policy).toEqual({ id: 1 });
    expect(data.proposer_number).toMatch(/^LI\d+$/);
    expect(db.lifeInsurance.create).toHaveBeenCalledWith(expect.objectContaining({ created_by: 7 }));
    expect(db.consumerRoleMapping.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_role_id: 7, user_consumer_id: 7, category_id: 5 })
    );
  });

  it("regenerates proposer_number when it already exists", async () => {
    db.lifeInsurance.findOne.mockResolvedValue({ id: 99 }); // collision
    db.lifeInsurance.create.mockResolvedValue({ id: 2 });
    db.consumerRoleMapping.create.mockResolvedValue({});
    const data = { created_by: 7, proposer_number: "LI-existing" };
    await service.createPolicy(data);
    expect(data.proposer_number).not.toBe("LI-existing");
    expect(data.proposer_number).toMatch(/^LI\d+$/);
  });
});

describe("service.buildCreatePayload", () => {
  const service = require("./lifeInsurance.service");

  it("normalizes mobile arrays, coerces ints, stamps the actor", () => {
    const out = service.buildCreatePayload(
      {
        proposer_mobile_numbers: ["", "9876543210"],
        tobacco_days: "5",
        alcohol_days: "",
        life_assured_father_name: "  Bob  ",
        updated_by: "",
      },
      7
    );
    expect(out.proposer_mobile_numbers).toBe("9876543210");
    expect(out.tobacco_days).toBe(5);
    expect(out.alcohol_days).toBeNull();
    expect(out.life_assured_father_name).toBe("Bob");
    expect(out.user_id).toBe(7);
    expect(out.created_by).toBe(7);
    expect(out.status).toBe("Draft");
    expect(out.updated_by).toBeNull();
    expect(out.policy_numbers).toMatch(/^POL/);
  });

  it("reads an indexed FormData mobile key", () => {
    const out = service.buildCreatePayload(
      { "nominee_mobile_numbers[0]": "9999999999" },
      1
    );
    expect(out.nominee_mobile_numbers).toBe("9999999999");
  });
});
