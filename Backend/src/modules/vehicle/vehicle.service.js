/**
 * vehicle service — data-access for the vehicle domain.
 * (Incremental extraction: the remark-update path lives here now; the large
 * add/update/list flows still live in the controller.)
 */
const db = require("../../../app/models");

const VehicleUser = db.vehicleUser;

/**
 * Update the remark on a vehicle user record.
 * @returns {Promise<object|null>} the updated row, or null if not found.
 */
async function updateRemark(vehicleUserId, remark) {
  const user = await VehicleUser.findByPk(vehicleUserId);
  if (!user) return null;
  await user.update({ remark });
  return user;
}

module.exports = { updateRemark };
