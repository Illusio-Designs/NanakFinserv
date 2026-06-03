/** Tests for the inquiry module. */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => next());
jest.mock("../../../app/models", () => ({
  inqueryuser: { create: jest.fn(), findAll: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const inquiryRoutes = require("./inquiry.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", inquiryRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/public/inquiry", () => {
  it("creates an inquiry from valid input", async () => {
    db.inqueryuser.create.mockResolvedValue({ id: 1 });
    const res = await request(buildApp())
      .post("/api/public/inquiry")
      .send({ username: "Jo", email: "jo@x.com", phone_number: "9876543210", service: "loan" });
    expect(res.status).toBe(200);
    expect(db.inqueryuser.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_name: "Jo", email: "jo@x.com", mobile_no: "9876543210", services: "loan" })
    );
  });

  it("rejects invalid input (validator)", async () => {
    const res = await request(buildApp())
      .post("/api/public/inquiry")
      .send({ username: "Jo", email: "bad", phone_number: "1" });
    expect(res.status).toBe(400);
    expect(db.inqueryuser.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/user/data/inquiery", () => {
  it("lists inquiries", async () => {
    db.inqueryuser.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await request(buildApp()).get("/api/user/data/inquiery");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
