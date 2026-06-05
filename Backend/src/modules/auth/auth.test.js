/**
 * Tests for the auth module.
 *
 * MSG91 (axios) and the DB models are mocked, so these run with no network and
 * no database. Covers: happy path, OTP-verification failure, unknown user,
 * validation failures, and that the legacy env-dump is gone.
 */

// Must be set before the config module is required.
process.env.JWT_SECRET = "test-secret";
process.env.MSG91_AUTH_KEY = "test-authkey";

jest.mock("axios");
jest.mock("../../../app/models", () => ({
  user: { findOne: jest.fn(), update: jest.fn() },
  builderUser: { findOne: jest.fn() },
  userCategory: { findAll: jest.fn() },
  category: {},
}));

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const db = require("../../../app/models");
const authRoutes = require("./auth.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", authRoutes);
  // minimal error handler so thrown errors surface as 500
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => res.status(500).send({ error: err.message }));
  return app;
}

const VALID_MOBILE = "9876543210";
const VALID_TOKEN = "msg91-access-token";

const sampleUser = {
  user_id: 42,
  username: "Jane",
  email: "jane@example.com",
  mobileNumber: VALID_MOBILE,
  role_id: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
  db.userCategory.findAll.mockResolvedValue([]);
  db.user.update.mockResolvedValue([1]);
});

describe("POST /api/user/login", () => {
  it("issues a JWT when OTP verifies and user exists", async () => {
    axios.post.mockResolvedValue({ data: { type: "success" } });
    db.user.findOne.mockResolvedValue(sampleUser);

    const res = await request(buildApp())
      .post("/api/user/login")
      .send({ mobileNumber: VALID_MOBILE, accessToken: VALID_TOKEN });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("valid");
    expect(res.body.user.user_id).toBe(42);

    const decoded = jwt.verify(res.body.token, "test-secret");
    expect(decoded.id).toBe(42);
    expect(decoded.mobileNumber).toBe(VALID_MOBILE);

    // token persisted with correct column + primary key
    expect(db.user.update).toHaveBeenCalledWith(
      { token: expect.any(String) },
      { where: { user_id: 42 } }
    );

    // and an httpOnly cookie is set
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.join(";")).toMatch(/token=.*HttpOnly/i);
  });

  it("rejects with 401 when MSG91 does not return success", async () => {
    axios.post.mockResolvedValue({ data: { type: "error" } });

    const res = await request(buildApp())
      .post("/api/user/login")
      .send({ mobileNumber: VALID_MOBILE, accessToken: VALID_TOKEN });

    expect(res.status).toBe(401);
    expect(db.user.findOne).not.toHaveBeenCalled();
  });

  it("returns 400 when OTP verifies but the user is unknown", async () => {
    axios.post.mockResolvedValue({ data: { type: "success" } });
    db.user.findOne.mockResolvedValue(null);

    const res = await request(buildApp())
      .post("/api/user/login")
      .send({ mobileNumber: VALID_MOBILE, accessToken: VALID_TOKEN });

    expect(res.status).toBe(400);
  });

  it("returns 400 when accessToken is missing (validation)", async () => {
    const res = await request(buildApp())
      .post("/api/user/login")
      .send({ mobileNumber: VALID_MOBILE });

    expect(res.status).toBe(400);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("returns 400 when mobileNumber is malformed (validation)", async () => {
    const res = await request(buildApp())
      .post("/api/user/login")
      .send({ mobileNumber: "123", accessToken: VALID_TOKEN });

    expect(res.status).toBe(400);
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe("POST /api/user/verfiy", () => {
  it("returns 200 when the user exists", async () => {
    db.user.findOne.mockResolvedValue({ user_id: 42 });
    const res = await request(buildApp())
      .post("/api/user/verfiy")
      .send({ mobileNumber: VALID_MOBILE });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
  });

  it("returns 400 when the user does not exist", async () => {
    db.user.findOne.mockResolvedValue(null);
    const res = await request(buildApp())
      .post("/api/user/verfiy")
      .send({ mobileNumber: VALID_MOBILE });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/user/logout", () => {
  it("clears the token cookie", async () => {
    const res = await request(buildApp()).post("/api/user/logout");
    expect(res.status).toBe(200);
    const setCookie = (res.headers["set-cookie"] || []).join(";");
    // clearCookie emits token=; with an expiry in the past
    expect(setCookie).toMatch(/token=/);
  });
});

describe("GET /api/user/check", () => {
  it("does not leak process.env", async () => {
    const res = await request(buildApp()).get("/api/user/check");
    expect(res.status).toBe(200);
    expect(res.body.env).toBeUndefined();
  });
});
