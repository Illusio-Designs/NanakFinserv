/** Tests for the /uploads access-control gate. */
process.env.JWT_SECRET = "test-secret";

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const uploadsAccess = require("./uploadsAccess");

function buildApp() {
  const app = express();
  // stand-in for express.static: if the gate calls next(), we 200.
  app.use("/uploads", uploadsAccess, (req, res) => res.status(200).send("file-bytes"));
  return app;
}

const validToken = jwt.sign({ id: 1 }, "test-secret");

describe("uploads access gate", () => {
  it("serves blog images without a token", async () => {
    const res = await request(buildApp()).get("/uploads/blog-12345.jpg");
    expect(res.status).toBe(200);
  });

  it("serves the default blog image without a token", async () => {
    const res = await request(buildApp()).get("/uploads/default-blog-image.jpg");
    expect(res.status).toBe(200);
  });

  it("blocks a customer document without a token", async () => {
    const res = await request(buildApp()).get("/uploads/abc-uuid-resume.pdf");
    expect(res.status).toBe(401);
  });

  it("allows a customer document with a valid header token", async () => {
    const res = await request(buildApp())
      .get("/uploads/abc-uuid-resume.pdf")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.status).toBe(200);
  });

  it("allows a customer document with a valid ?token= query", async () => {
    const res = await request(buildApp()).get(`/uploads/abc-uuid-resume.pdf?token=${validToken}`);
    expect(res.status).toBe(200);
  });

  it("rejects an invalid token", async () => {
    const res = await request(buildApp()).get("/uploads/abc-uuid-resume.pdf?token=garbage");
    expect(res.status).toBe(401);
  });
});
