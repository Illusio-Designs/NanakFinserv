/**
 * builder service — data-access for the builder domain.
 */
const { Op } = require("sequelize");
const db = require("../../../app/models");

const Unit = db.unit;
const UnitCategoryDetail = db.unit_category_detail;

/**
 * Add a unit-category detail row.
 * @returns {{noUnit:true}|{conflict:true}|{created:object}}
 */
async function addUnitCategory({ unit_id, unit_category_id, count }) {
  const unit = await Unit.findOne({ where: { [Op.or]: [{ unit_id }] } });
  if (!unit) return { noUnit: true };

  const dup = await UnitCategoryDetail.findOne({
    where: { unit_category_id, unit_id },
  });
  if (dup) return { conflict: true };

  const created = await UnitCategoryDetail.create({
    unit_category_id,
    unit_id,
    count,
  });
  return { created };
}

module.exports = { addUnitCategory };
