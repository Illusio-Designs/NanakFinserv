/**
 * consumer service — data-access helpers for the consumer domain.
 * (Used by the large addConsumer flow for its foreign-key and duplicate checks.)
 */
const db = require("../../../app/models");

/** True only if the role, unit and category all exist. */
async function checkForeignKeys(role_id, unit_id, category_id) {
  const [roleExists, unitExists, categoryExists] = await Promise.all([
    db.role.findByPk(role_id),
    db.unit.findByPk(unit_id),
    db.unit_category_list.findByPk(category_id),
  ]);
  return Boolean(roleExists && unitExists && categoryExists);
}

/** Find a builder-consumer matching the unique placement combination. */
function findDuplicate({ unit_id, office_no, category_id, floor_id, wing_id }) {
  return db.builderConsumer.findOne({
    where: { unit_id, office_no, category_id, floor_id, wing_id },
  });
}

module.exports = { checkForeignKeys, findDuplicate };
