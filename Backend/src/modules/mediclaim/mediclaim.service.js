/**
 * mediclaim service — data-access for the mediclaim domain.
 * (Incremental extraction: company operations live here now; the large
 * product/user flows still live in the controller.)
 */
const { Op } = require("sequelize");
const db = require("../../../app/models");

const MediclaimCompany = db.mediclaimCompany;

function getCompanies() {
  return MediclaimCompany.findAll({ raw: true });
}

/** @returns {{conflict:true}|{created:object}} */
async function addCompany(name) {
  const existing = await MediclaimCompany.findOne({
    where: { mediclaim_company_name: name },
  });
  if (existing) return { conflict: true };
  const created = await MediclaimCompany.create({ mediclaim_company_name: name });
  return { created };
}

/** @returns {{conflict:true}|{result:any}} */
async function updateCompany(id, name) {
  const dupe = await MediclaimCompany.findOne({
    where: {
      mediclaim_company_id: { [Op.ne]: id },
      mediclaim_company_name: name,
    },
  });
  if (dupe) return { conflict: true };
  const result = await MediclaimCompany.update(
    { mediclaim_company_name: name },
    { where: { mediclaim_company_id: id } }
  );
  return { result };
}

// ── Date integrity ───────────────────────────────────────────────────────────
// Normalise policy dates to ISO (YYYY-MM-DD) on write + validate From < To.
const POLICY_DATE_FIELDS = ["PolicyFrom", "PolicyTo", "PolicyIssuedDate", "ExpiryDate", "RenewDate", "NomineeDob"];
function toISODate(v) {
  if (v == null || typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return v;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);            // already ISO
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);   // dd-mm-yyyy / dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? v : dt.toISOString().slice(0, 10);
}
function normalizePolicyDates(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const f of POLICY_DATE_FIELDS) if (obj[f] != null) obj[f] = toISODate(obj[f]);
  return obj;
}
/** @returns {string|null} an error message if the period is invalid, else null. */
function validatePolicyDates(obj) {
  if (!obj || typeof obj !== "object") return null;
  const f = obj.PolicyFrom, t = obj.PolicyTo || obj.ExpiryDate;
  if (f && t && String(f).slice(0, 10) > String(t).slice(0, 10)) {
    return "Policy 'from' date must be before the 'to' / expiry date";
  }
  return null;
}

/**
 * Keep a mediclaim's policy timeline consistent in the unified table: the policy
 * with the latest end date is the current one (is_current=true, status running);
 * all others are history (is_current=false, status completed). Mirrors the vehicle
 * reconcile. Safe to call after any add/update/renew.
 */
async function reconcileMediclaimPolicies(mediclaimId, opts = {}) {
  const { transaction } = opts;
  const Policy = db.runningPolicyMediclaim;
  const policies = await Policy.findAll({ where: { mediclaim_id: mediclaimId }, transaction });
  if (!policies.length) return;
  const endOf = (p) => String(p.PolicyTo || p.ExpiryDate || p.PolicyFrom || "");
  const sorted = [...policies].sort((a, b) => endOf(b).localeCompare(endOf(a)));
  const currentId = sorted[0].id;
  await Promise.all(sorted.map((p) =>
    Policy.update(
      { is_current: p.id === currentId, status: p.id === currentId ? "running" : "completed" },
      { where: { id: p.id }, transaction }
    )
  ));
}

module.exports = { getCompanies, addCompany, updateCompany, reconcileMediclaimPolicies, normalizePolicyDates, validatePolicyDates };
