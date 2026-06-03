/**
 * lifeInsurance service — data-access for the life-insurance domain.
 */
const db = require("../../../app/models");

const LifeInsurance = db.lifeInsurance;

/** @returns {Promise<boolean>} true if a policy was deleted. */
async function deleteById(id) {
  const count = await LifeInsurance.destroy({ where: { id } });
  return count > 0;
}

module.exports = { deleteById };
