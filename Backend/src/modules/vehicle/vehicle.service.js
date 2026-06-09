/**
 * vehicle service — data-access for the vehicle domain.
 * (Incremental extraction: the remark-update path lives here now; the large
 * add/update/list flows still live in the controller.)
 */
const db = require("../../../app/models");

const VehicleUser = db.vehicleUser;

/**
 * Parse + normalize the add-vehicle request body (JSON under `data`, or
 * multipart FormData with JSON-string sub-objects), applying defensive defaults
 * for running/previous policy.
 * @returns {{error:string}|{Data,documentsData,runningPolicy,previousPolicy}}
 */
function normalizePayload(body, contentType) {
  let Data;
  if (body && body.data) {
    Data = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
  } else if (contentType && contentType.includes("multipart/form-data")) {
    Data = body || {};
    for (const field of ["runningPolicy", "previousPolicy", "documentsData"]) {
      if (Data[field] && typeof Data[field] === "string") {
        try {
          Data[field] = JSON.parse(Data[field]);
        } catch (e) {
          Data[field] = field === "documentsData" ? [] : {};
        }
      }
    }
  } else {
    return { error: "Data not found in request body" };
  }

  const documentsData =
    Data.documentsData ||
    (typeof (body && body.documentsData) === "string"
      ? JSON.parse(body.documentsData || "[]")
      : body && body.documentsData);

  const emptyPolicy = () => ({ PolicyTypeId: null, CompanyId: null, PolicyPlanTypeId: null });

  let runningPolicy = Data.runningPolicy;
  if (!runningPolicy || typeof runningPolicy !== "object") {
    runningPolicy = emptyPolicy();
    Data.runningPolicy = runningPolicy;
  }
  let previousPolicy = Data.previousPolicy;
  if (!previousPolicy || typeof previousPolicy !== "object") {
    previousPolicy = emptyPolicy();
    Data.previousPolicy = previousPolicy;
  }

  return { Data, documentsData, runningPolicy, previousPolicy };
}

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

/**
 * Parse the update-vehicle body (JSON under `data`, or multipart with
 * JSON-string running/previous policy). Unlike normalizePayload it does NOT
 * default the policies or parse documentsData — matching the update handler's
 * original behavior.
 * @returns {{error:string}|{Data:object}}
 */
function parseUpdatePayload(body, contentType) {
  let Data;
  if (body && body.data) {
    Data = typeof body.data === "string" ? JSON.parse(body.data) : body.data;
  } else if (contentType && contentType.includes("multipart/form-data")) {
    Data = body || {};
    for (const field of ["runningPolicy", "previousPolicy"]) {
      if (Data[field] && typeof Data[field] === "string") {
        try {
          Data[field] = JSON.parse(Data[field]);
        } catch (e) {
          Data[field] = {};
        }
      }
    }
  } else {
    return { error: "Data not found in request body" };
  }
  return { Data };
}

const VehcileRunningPolicy = db.vehcileRunningPolicy; // unified policy table (is_current flag)

/** "running" while within the period, "completed" once the expiry has passed. */
function policyStatus(p) {
  const end = p.od_expiry_date || p.ExpiryDate || p.PolicyTo;
  if (!end) return "running";
  const d = new Date(end);
  if (isNaN(d.getTime())) return "running";
  return d >= new Date() ? "running" : "completed";
}

/** End date used to order the timeline (latest policy = the current one). */
function policyEnd(p) {
  const s = p.od_expiry_date || p.ExpiryDate || p.PolicyTo || p.PolicyFrom || "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Auto-organize a vehicle's policy timeline year-by-year on the single policy
 * table, regardless of entry order:
 *  - the policy with the LATEST end date is flagged is_current = true (the
 *    current/running policy); every other policy is is_current = false (history);
 *  - each record's status is recomputed (running while active, completed once
 *    its expiry has passed).
 * Safe to call after any add/update/renew. Pass { transaction } to run inside a tx.
 */
async function reconcileVehiclePolicies(vehicleUserId, opts = {}) {
  if (!vehicleUserId) return;
  const transaction = opts.transaction;
  const all = await VehcileRunningPolicy.findAll({ where: { vehicle_user_id: vehicleUserId }, transaction });
  if (!all.length) return;

  // Latest end date first → that one is current; the rest are history.
  const sorted = [...all].sort((a, b) => policyEnd(b.get({ plain: true })) - policyEnd(a.get({ plain: true })));
  for (let i = 0; i < sorted.length; i++) {
    const inst = sorted[i];
    const isCurrent = i === 0;
    const status = policyStatus(inst.get({ plain: true }));
    if (inst.is_current !== isCurrent || inst.status !== status) {
      await inst.update({ is_current: isCurrent, status }, { transaction });
    }
  }
}

module.exports = { updateRemark, normalizePayload, parseUpdatePayload, reconcileVehiclePolicies };
