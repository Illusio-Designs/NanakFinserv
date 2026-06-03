/**
 * user service — data-access for the user domain.
 *
 * Controllers stay thin and call into here. (Extraction is incremental: the
 * simple read queries live here now; the larger create/update flows still live
 * in the controller and will move over as they get their own tests.)
 */
const { Op } = require("sequelize");
const db = require("../../../app/models");

const Category = db.category;
const UserCategory = db.userCategory;

/** All categories/roles. */
function getRoles() {
  return Category.findAll({ raw: true });
}

/** Categories assigned to a given user. */
function getCategoriesByUserId(userId) {
  return UserCategory.findAll({
    include: [Category],
    where: { user_id: userId },
    raw: true,
  });
}

/** Verticals = categories excluding the reserved ids (1, 3). */
function getUnitVerticals() {
  return Category.findAll({
    raw: true,
    where: { category_id: { [Op.ne]: [1, 3] } },
  });
}

module.exports = { getRoles, getCategoriesByUserId, getUnitVerticals };
