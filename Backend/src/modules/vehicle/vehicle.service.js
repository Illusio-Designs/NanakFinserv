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

module.exports = { updateRemark, normalizePayload, parseUpdatePayload };
