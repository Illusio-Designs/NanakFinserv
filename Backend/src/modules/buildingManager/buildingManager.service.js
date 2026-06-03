/**
 * buildingManager service — data-access for the building-manager domain.
 */
const db = require("../../../app/models");

const BuildingManager = db.buildingManager;

/** Soft-remove a manager (status -> inactive). @returns {Promise<boolean>} */
async function removeById(id) {
  const manager = await BuildingManager.findByPk(id);
  if (!manager) return false;
  await manager.update({ status: "inactive" });
  return true;
}

module.exports = { removeById };
