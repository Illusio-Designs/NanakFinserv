/**
 * blog service — data-access for the blog domain.
 */
const db = require("../../../app/models");

const Blog = db.blog;

function getAll() {
  return Blog.findAll({ order: [["created_at", "DESC"]] });
}

function getById(id) {
  return Blog.findByPk(id);
}

/** @returns {Promise<boolean>} true if a row was deleted. */
async function deleteById(id) {
  const blog = await Blog.findByPk(id);
  if (!blog) return false;
  await blog.destroy();
  return true;
}

module.exports = { getAll, getById, deleteById };
