/** Validators for the blog module. */
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

const validateAddBlog = (req, res, next) => {
  const b = req.body || {};
  const errors = [];
  if (!isNonEmptyString(b.title)) errors.push("title is required");
  if (!isNonEmptyString(b.content)) errors.push("content is required");
  if (errors.length) {
    return res.status(400).send({ message: errors.join("; "), status: false });
  }
  return next();
};

module.exports = { validateAddBlog };
