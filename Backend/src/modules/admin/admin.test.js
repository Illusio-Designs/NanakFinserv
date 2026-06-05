/** Tests for the admin module: vertical settings + data wipe. */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 }; // super admin
  next();
});
jest.mock("../../../app/models", () => ({
  sequelize: { query: jest.fn().mockResolvedValue([]) },
  appSetting: { findByPk: jest.fn(), upsert: jest.fn().mockResolvedValue([{}, true]) },
  // wipe targets (have destroy + findAll, not in KEEP):
  loanUser: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn() },
  mediclaimCompany: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn() },
  // KEEP (must NOT be wiped):
  user: { destroy: jest.fn().mockResolvedValue(0), findAll: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const adminRoutes = require("./admin.routes");
const service = require("./admin.service");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", adminRoutes);
  return app;
}

beforeEach(() => {
  jest.clearAllMocks();
  service._resetCache();
});

describe("GET /api/admin/settings/verticals", () => {
  it("returns defaults (all enabled) when nothing is stored", async () => {
    db.appSetting.findByPk.mockResolvedValue(null);
    const res = await request(buildApp()).get("/api/admin/settings/verticals");
    expect(res.status).toBe(200);
    expect(res.body.verticals).toEqual({ loan: true, vehicle: true, mediclaim: true, life: true });
  });

  it("returns stored toggles", async () => {
    db.appSetting.findByPk.mockResolvedValue({
      setting_value: JSON.stringify({ loan: false, vehicle: true, mediclaim: false, life: true }),
    });
    const res = await request(buildApp()).get("/api/admin/settings/verticals");
    expect(res.body.verticals).toEqual({ loan: false, vehicle: true, mediclaim: false, life: true });
  });
});

describe("PUT /api/admin/settings/verticals", () => {
  it("updates a toggle", async () => {
    db.appSetting.findByPk.mockResolvedValue(null);
    const res = await request(buildApp())
      .put("/api/admin/settings/verticals")
      .send({ vehicle: true, loan: false });
    expect(res.status).toBe(200);
    expect(res.body.verticals.loan).toBe(false);
    expect(res.body.verticals.vehicle).toBe(true);
    expect(db.appSetting.upsert).toHaveBeenCalled();
  });

  it("rejects an empty body (validator)", async () => {
    const res = await request(buildApp()).put("/api/admin/settings/verticals").send({});
    expect(res.status).toBe(400);
  });

  it("rejects a non-boolean value (validator)", async () => {
    const res = await request(buildApp())
      .put("/api/admin/settings/verticals")
      .send({ loan: "yes" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/data/wipe", () => {
  it("requires the WIPE confirmation", async () => {
    const res = await request(buildApp()).post("/api/admin/data/wipe").send({});
    expect(res.status).toBe(400);
    expect(db.loanUser.destroy).not.toHaveBeenCalled();
  });

  it("wipes business+master tables but keeps users", async () => {
    const res = await request(buildApp()).post("/api/admin/data/wipe").send({ confirm: "WIPE" });
    expect(res.status).toBe(200);
    expect(db.loanUser.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ truncate: true })
    );
    expect(db.mediclaimCompany.destroy).toHaveBeenCalled();
    expect(db.user.destroy).not.toHaveBeenCalled(); // KEEP
    // FK checks toggled off then on
    expect(db.sequelize.query).toHaveBeenCalledWith("SET FOREIGN_KEY_CHECKS = 0");
    expect(db.sequelize.query).toHaveBeenCalledWith("SET FOREIGN_KEY_CHECKS = 1");
    expect(res.body.clearedTables).toEqual(expect.arrayContaining(["loanUser", "mediclaimCompany"]));
    expect(res.body.clearedTables).not.toContain("user");
  });
});
