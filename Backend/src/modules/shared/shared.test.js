/**
 * Tests for the shared module's downloadFile path-traversal guard.
 * The DB models are pulled in transitively via shared/context but are not hit
 * on these code paths, so no database is required.
 */
const fs = require("fs");
const path = require("path");
const express = require("express");
const request = require("supertest");

const sharedRoutes = require("./shared.routes");

const UPLOADS_DIR = path.resolve(__dirname, "../../../uploads");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", sharedRoutes);
  return app;
}

describe("GET /api/user/download/:filename", () => {
  const fixtureName = `jest-fixture-${Date.now()}.txt`;
  const fixturePath = path.join(UPLOADS_DIR, fixtureName);

  beforeAll(() => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(fixturePath, "hello");
  });
  afterAll(() => {
    if (fs.existsSync(fixturePath)) fs.unlinkSync(fixturePath);
  });

  it("downloads a file that exists inside the uploads dir", async () => {
    const res = await request(buildApp()).get(
      `/api/user/download/${fixtureName}`
    );
    expect(res.status).toBe(200);
    expect(res.text).toBe("hello");
  });

  it("does not escape the uploads dir on a traversal attempt", async () => {
    // ../../../etc/passwd style — must never serve a file outside uploads.
    const res = await request(buildApp()).get(
      `/api/user/download/${encodeURIComponent("../../../../../../etc/passwd")}`
    );
    expect(res.status).not.toBe(200);
    expect(res.text).not.toMatch(/root:.*:0:0:/);
  });

  it("rejects an empty filename", async () => {
    // a trailing-segment request that resolves to an empty basename
    const res = await request(buildApp()).get(
      `/api/user/download/${encodeURIComponent("..")}`
    );
    expect([400, 404]).toContain(res.status);
    expect(res.status).not.toBe(200);
  });
});
