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

const VehcileRunningPolicy = db.vehcileRunningPolicy;
const VehiclePreviousPolicy = db.vehiclePreviousPolicy;

/** "running" while within the period, "completed" once the expiry has passed. */
function policyStatus(p) {
  const end = p.od_expiry_date || p.ExpiryDate || p.PolicyTo;
  if (!end) return "running";
  const d = new Date(end);
  if (isNaN(d.getTime())) return "running";
  return d >= new Date() ? "running" : "completed";
}

/** Sort key: most recent policy start first. */
function policyStart(p) {
  const s = p.PolicyFrom || p.PolicyIssuedDate || p.PolicyTo || "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Auto-organize a vehicle's policy timeline year-by-year:
 *  - if more than one running policy exists, keep the most recent as running and
 *    archive the older ones into the previous-policies (history) table;
 *  - recompute every record's status (running/completed) from its expiry vs today.
 * Safe to call after any add/update/renew.
 */
async function reconcileVehiclePolicies(vehicleUserId) {
  if (!vehicleUserId) return;
  const running = await VehcileRunningPolicy.findAll({ where: { vehicle_user_id: vehicleUserId } });

  if (running.length > 1) {
    const sorted = [...running].sort((a, b) => policyStart(b.get({ plain: true })) - policyStart(a.get({ plain: true })));
    const keep = sorted[0];
    for (const old of sorted.slice(1)) {
      const o = old.get({ plain: true });
      delete o.id;
      await VehiclePreviousPolicy.create({ ...o, status: policyStatus(o) });
      await old.destroy();
    }
    await keep.update({ status: policyStatus(keep.get({ plain: true })) });
  } else if (running.length === 1) {
    await running[0].update({ status: policyStatus(running[0].get({ plain: true })) });
  }

  const previous = await VehiclePreviousPolicy.findAll({ where: { vehicle_user_id: vehicleUserId } });
  for (const pp of previous) {
    const next = policyStatus(pp.get({ plain: true }));
    if (pp.status !== next) await pp.update({ status: next });
  }
}

module.exports = { updateRemark, normalizePayload, parseUpdatePayload, reconcileVehiclePolicies };
