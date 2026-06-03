/**
 * loan service — data-access for the loan domain.
 * (Incremental extraction: the status-update write path lives here now; the
 * large list/detail queries still live in the controller.)
 */
const db = require("../../../app/models");

const LoanUser = db.loanUser;

/**
 * Update a consumer's loan status.
 * @returns {Promise<object|null>} the updated row, or null if nothing matched.
 */
async function updateLoanStatus({ userConsumerId, laonId, status, remarks, actorId }) {
  const where = { user_id: userConsumerId };
  if (laonId) where.laon_id = laonId;

  const updateData = {
    status,
    role_id: actorId,
    remarks: status === "notInterested" ? remarks : null,
  };

  const [updated] = await LoanUser.update(updateData, { where });
  if (!updated) return null;

  return LoanUser.findOne({ where });
}

module.exports = { updateLoanStatus };
