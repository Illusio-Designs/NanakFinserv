/** Tests for the blog module. */
jest.mock("../../../app/middleware/JWTAuth", () => (req, res, next) => {
  req.user = { id: 1, Role: 1 };
  next();
});
jest.mock("../../../app/models", () => ({
  blog: { findByPk: jest.fn(), findAll: jest.fn() },
}));

const express = require("express");
const request = require("supertest");

const db = require("../../../app/models");
const blogRoutes = require("./blog.routes");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", blogRoutes);
  return app;
}

beforeEach(() => jest.clearAllMocks());

describe("DELETE /api/user/blog/delete/:id", () => {
  it("deletes an existing blog", async () => {
    const destroy = jest.fn().mockResolvedValue();
    db.blog.findByPk.mockResolvedValue({ id: 3, destroy });
    const res = await request(buildApp()).delete("/api/user/blog/delete/3");
    expect(res.status).toBe(200);
    expect(destroy).toHaveBeenCalled();
  });

  it("returns 404 when the blog is missing", async () => {
    db.blog.findByPk.mockResolvedValue(null);
    const res = await request(buildApp()).delete("/api/user/blog/delete/3");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/user/blog/add (validator)", () => {
  it("rejects when title/content are missing", async () => {
    const res = await request(buildApp()).post("/api/user/blog/add").send({ title: "only title" });
    expect(res.status).toBe(400);
  });
});
