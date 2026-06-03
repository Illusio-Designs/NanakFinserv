/** Tests for the requireRole RBAC middleware. */
const express = require("express");
const request = require("supertest");

const { requireRole, ROLES, ADMIN } = require("./rbac");

// Build an app where the "auth" step injects a given role.
function buildApp(role) {
  const app = express();
  app.use((req, res, next) => {
    req.user = role === undefined ? undefined : { id: 1, Role: role };
    next();
  });
  app.get("/admin", requireRole(...ADMIN), (req, res) => res.json({ ok: true }));
  return app;
}

describe("requireRole", () => {
  it("allows super admin (1)", async () => {
    const res = await request(buildApp(ROLES.SUPER_ADMIN)).get("/admin");
    expect(res.status).toBe(200);
  });

  it("allows staff (4)", async () => {
    const res = await request(buildApp(ROLES.STAFF)).get("/admin");
    expect(res.status).toBe(200);
  });

  it("forbids a consumer (3)", async () => {
    const res = await request(buildApp(ROLES.CONSUMER)).get("/admin");
    expect(res.status).toBe(403);
  });

  it("forbids a builder (2)", async () => {
    const res = await request(buildApp(ROLES.BUILDER)).get("/admin");
    expect(res.status).toBe(403);
  });

  it("forbids when no user/role is present", async () => {
    const res = await request(buildApp(undefined)).get("/admin");
    expect(res.status).toBe(403);
  });

  it("coerces string role ids", async () => {
    const res = await request(buildApp("1")).get("/admin");
    expect(res.status).toBe(200);
  });
});
