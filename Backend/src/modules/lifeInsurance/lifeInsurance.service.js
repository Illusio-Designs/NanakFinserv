/**
 * lifeInsurance service — data-access for the life-insurance domain.
 */
const db = require("../../../app/models");

const LifeInsurance = db.lifeInsurance;
const ConsumerRoleMapping = db.consumerRoleMapping;

/** @returns {Promise<boolean>} true if a policy was deleted. */
async function deleteById(id) {
  const count = await LifeInsurance.destroy({ where: { id } });
  return count > 0;
}

/**
 * Persist a life-insurance policy: ensure a unique proposer_number, create the
 * policy, and create the consumer-role mapping for the life-insurance vertical.
 * @param {object} data fully-shaped policy data (must include created_by)
 * @returns {Promise<object>} the created policy
 */
async function createPolicy(data) {
  // Ensure a unique proposer_number.
  if (!data.proposer_number) {
    data.proposer_number = `LI${Date.now()}`;
  } else {
    const existing = await LifeInsurance.findOne({
      where: { proposer_number: data.proposer_number },
    });
    if (existing) data.proposer_number = `LI${Date.now()}`;
  }

  const policy = await LifeInsurance.create(data);

  // Map the creating user to the life-insurance vertical (category 5).
  await ConsumerRoleMapping.create({
    user_role_id: data.created_by,
    user_consumer_id: data.created_by,
    category_id: 5,
  });

  return policy;
}

module.exports = { deleteById, createPolicy };
