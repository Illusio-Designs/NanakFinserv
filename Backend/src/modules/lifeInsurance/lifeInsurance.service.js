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

/**
 * Build the persisted life-insurance payload from a (possibly multipart) body:
 * normalizes mobile-number arrays, coerces numeric/string fields, generates a
 * policy_numbers fallback, nulls empty optional FKs, and stamps the actor.
 * Pure transform (no DB) — extracted from createLifeInsurance.
 */
function buildCreatePayload(body, actorId) {
  const processedData = { ...body };

  // Mobile-number fields -> a single trimmed string (FormData may send arrays
  // or indexed keys like field[0]).
  ["proposer_mobile_numbers", "life_assured_mobile_numbers", "nominee_mobile_numbers"].forEach((field) => {
    if (processedData[field]) {
      if (Array.isArray(processedData[field])) {
        const validMobile = processedData[field].find((m) => m && m.trim());
        processedData[field] = validMobile || "";
      } else if (typeof processedData[field] === "string") {
        processedData[field] = processedData[field].trim();
      }
    } else {
      let index = 0;
      while (processedData[`${field}[${index}]`]) {
        const value = processedData[`${field}[${index}]`];
        if (value && value.trim()) {
          processedData[field] = value.trim();
          break;
        }
        delete processedData[`${field}[${index}]`];
        index += 1;
      }
      if (!processedData[field]) processedData[field] = "";
    }
  });

  // Integer fields -> number or null.
  ["tobacco_days", "alcohol_days", "narcotics_days", "tobacco_quantity", "alcohol_quantity", "narcotics_quantity"].forEach((field) => {
    const val = processedData[field];
    if (val === "" || val === undefined) {
      processedData[field] = null;
    } else if (typeof val === "string" && val.trim() === "") {
      processedData[field] = null;
    } else if (typeof val === "string") {
      const num = parseInt(val, 10);
      processedData[field] = Number.isNaN(num) ? null : num;
    }
  });

  // String fields -> trimmed or null.
  [
    "life_assured_father_name", "life_assured_mother_name", "life_assured_spouse_name",
    "proposer_residential_status", "life_assured_residential_status",
    "nominee_relationship_with_life_assured", "policy_numbers", "user_consumer_id",
    "proposer_gender_custom", "life_assured_gender_custom",
    "tobacco_consumption", "alcohol_consumption", "narcotics_consumption",
  ].forEach((field) => {
    if (processedData[field] === "" || processedData[field] === undefined) {
      processedData[field] = null;
    } else if (typeof processedData[field] === "string") {
      processedData[field] = processedData[field].trim();
      if (processedData[field] === "") processedData[field] = null;
    }
  });

  if (!processedData.policy_numbers) {
    processedData.policy_numbers = `POL${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const lifeInsuranceData = {
    ...processedData,
    user_id: actorId,
    user_consumer_id: actorId,
    created_by: actorId,
    status: "Draft",
  };

  // Null empty optional FKs.
  if (!lifeInsuranceData.updated_by || lifeInsuranceData.updated_by === "") {
    lifeInsuranceData.updated_by = null;
  }

  return lifeInsuranceData;
}

module.exports = { deleteById, createPolicy, buildCreatePayload };
