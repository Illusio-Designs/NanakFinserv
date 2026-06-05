/* eslint-disable no-console */
/**
 * One-off migration script: mechanically split the monolithic
 * app/controllers/user.controller.js into per-domain modules under src/modules.
 *
 * It does NOT rewrite business logic — function bodies are copied verbatim, with
 * only two safe transforms:
 *   1. require("../models...") / require("../config...") paths are re-rooted.
 *   2. __dirname -> CTRL_DIR (a shared constant pointing at the original
 *      controllers dir) so upload/download paths resolve exactly as before.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_FILE = path.join(ROOT, "app/controllers/user.controller.js");
const MODULES_DIR = path.join(ROOT, "src/modules");

const raw = fs.readFileSync(SRC_FILE, "utf8");
const lines = raw.split("\n");

// ── 1. find function boundaries ────────────────────────────────────────────
const EXPORT_RE = /^\s*exports\.(\w+)\s*=/;
const MODEXPORTS_OBJ_RE = /^module\.exports\s*=\s*\{/;

const starts = [];
let endLine = lines.length; // default EOF
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(EXPORT_RE);
  if (m) starts.push({ name: m[1], line: i });
  if (MODEXPORTS_OBJ_RE.test(lines[i])) {
    endLine = i;
    break;
  }
}

const preamble = lines.slice(0, starts[0].line).join("\n");

const blocks = {}; // name -> body text (last definition wins, matching JS runtime)
for (let s = 0; s < starts.length; s++) {
  const from = starts[s].line;
  const to = s + 1 < starts.length ? starts[s + 1].line : endLine;
  let body = lines.slice(from, to).join("\n");
  // drop any stray `module.exports.x = ...` bookkeeping lines
  body = body
    .split("\n")
    .filter((l) => !/^\s*module\.exports\./.test(l))
    .join("\n");
  blocks[starts[s].name] = body;
}

// ── 2. domain map ──────────────────────────────────────────────────────────
const SKIP = new Set(["userChek", "verifyUser", "verifyUserLogin"]); // -> auth module

const DOMAINS = {
  user: [
    "getAllUsers", "getAllBuilderUsers", "getAllBuilderListUsers",
    "getCategoryById", "getAllRolesUsers", "getAllRoles", "addRoleWiseUser",
    "updateRoleWiseUser", "addData", "updateData", "getAllUnitVerticle",
    "getAllVerticleUser",
  ],
  dashboard: ["getUserCounts", "getLoanAmounFilterDate", "getConsumerDashboardData"],
  shared: [
    "downloadFile", "addCodeDetails", "getAllCodes", "addCompanyTypeDetails",
    "getAllCompanyTypes", "getAllLoanConfiguration", "addPolicyplanDetails",
    "addPolicyTypeDetails", "getAllPolicyPlans", "getAllPolicyTypes",
    "getAllVehicles", "getAllReferences", "getAllDocuments",
    "getAllUnitCatergory", "addVehicleDetails",
  ],
  inquiry: ["addInquieryUser", "getAllInqueryUser"],
  consumer: [
    "addConsumerData", "updateConsumerData", "addConsumer", "updateConsumer",
    "updateLoanConsumerData",
  ],
  builder: [
    "addBuilderData", "updateBuilderData", "getUnitsByBuilder",
    "getUintByConsumer", "getUnitsByBuilderCategory", "addBuilderUnit",
    "updateBuilderUnit", "addBuilderUnitCategory", "updateBuilderUnitCategory",
  ],
  loan: [
    "getAllLoanUser", "getAllLoanUserInterested", "getAllLoanUserDetail",
    "getAllLoanUserNotInterested", "getAllLoanUserDisburse", "updateLoanStatus",
    "updateWorkingLoanStatus", "addLoanCobfiguration", "addDisburse",
    "updateDisburse",
  ],
  mediclaim: [
    "getAllMediclaimUser", "getAllMediclaimCompany", "addMediclaimCompanyData",
    "updateMediclaimCompanyData", "getAllMediclaimProduct",
    "addMediclaimProductData", "updateMediclaimProductData",
    "addMediclaimUserData", "updateMediclaimUserData", "geteMediclaimUserData",
    "geteMediclaimUserRenewalData", "geteMediclaimProductData",
    "geteMediclaimCompanyData",
  ],
  lifeInsurance: [
    "getAllLifeInsUser", "createLifeInsurance", "getAllLifeInsurance",
    "getLifeInsuranceById", "updateLifeInsurance", "deleteLifeInsurance",
    "uploadLifeInsuranceDocument", "getLifeInsuranceDocuments",
    "deleteLifeInsuranceDocument", "updateLifeInsuranceStatus",
    "getLifeInsuranceByConsumer", "getLifeInsuranceRenewalData",
  ],
  vehicle: [
    "getAllVehicleInsUser", "addVehicleUserData", "updateVehicleUserData",
    "getVehicleUserData", "getVehicleUserRenewalData",
    "updateVehicleUserRemarkData", "getVehicleRenewalStats",
    "getVehicleRenewalSheet", "listAllVehicleUsersDebug", "getVehicleUserById",
    "renewVehiclePolicy",
  ],
  buildingManager: [
    "createBuildingManager", "assignBuildingManager", "getAllBuildingManagers",
    "getBuildingManagerStats", "getBuildingManagerDashboardStats",
    "updateBuildingManager", "removeBuildingManager",
  ],
  blog: ["addBlog", "updateBlog", "deleteBlog", "getAllBlogs", "getBlogById"],
  notification: [
    "getNotifications", "markNotificationAsRead", "markAllNotificationsAsRead",
    "getNotificationCount",
  ],
};

const fnToDomain = {};
for (const [domain, fns] of Object.entries(DOMAINS)) {
  for (const fn of fns) fnToDomain[fn] = domain;
}

// sanity: report unmapped extracted functions
const unmapped = Object.keys(blocks).filter(
  (n) => !SKIP.has(n) && !fnToDomain[n]
);
if (unmapped.length) {
  console.warn("⚠️  Unmapped functions (will be skipped):", unmapped);
}

// ── 3. transforms ──────────────────────────────────────────────────────────
function reRootRequires(text) {
  return text
    .replace(/require\((['"])\.\.\/models/g, 'require($1../../../app/models')
    .replace(/require\((['"])\.\.\/config/g, 'require($1../../../app/config')
    .replace(/require\((['"])\.\.\/middleware/g, 'require($1../../../app/middleware');
}
function rewriteDirname(text) {
  return text.replace(/__dirname/g, "CTRL_DIR");
}

// identifiers exported by the shared context (auto-detected from preamble)
function detectIdentifiers(text) {
  const ids = new Set();
  for (const line of text.split("\n")) {
    let m = line.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);
    if (m) ids.add(m[1]);
    m = line.match(/^const\s*\{([^}]+)\}\s*=/);
    if (m) {
      m[1].split(",").forEach((part) => {
        const name = part.includes(":") ? part.split(":")[1] : part;
        const clean = name.trim();
        if (clean) ids.add(clean);
      });
    }
  }
  return ids;
}

// ── 4. write shared/context.js ─────────────────────────────────────────────
let ctxBody = reRootRequires(preamble);
const ids = detectIdentifiers(ctxBody);
ids.add("CTRL_DIR");
const exportList = Array.from(ids).sort();

const contextFile = `/**
 * Shared controller context (generated by scripts/split-controller.js).
 *
 * Holds the common requires, Sequelize model handles and helper functions that
 * every domain controller extracted from the old monolith depends on. Domain
 * controllers destructure what they need from here.
 */
${ctxBody}

// Original controllers directory, so __dirname-relative upload/download paths
// keep resolving to Backend/uploads exactly as before the split.
const CTRL_DIR = path.join(__dirname, "../../../app/controllers");

module.exports = { ${exportList.join(", ")} };
`;

fs.mkdirSync(path.join(MODULES_DIR, "shared"), { recursive: true });
fs.writeFileSync(path.join(MODULES_DIR, "shared", "context.js"), contextFile);
console.log("✅ wrote shared/context.js with", exportList.length, "exports");

// ── 5. write per-domain controllers ────────────────────────────────────────
const destructure = `const {\n  ${exportList.join(",\n  ")}\n} = require("../shared/context");`;

for (const [domain, fns] of Object.entries(DOMAINS)) {
  const present = fns.filter((fn) => blocks[fn]);
  const bodies = present
    .map((fn) => rewriteDirname(reRootRequires(blocks[fn])))
    .join("\n\n");

  const file = `/**
 * ${domain} controller — extracted from the legacy user.controller monolith.
 * Logic is preserved verbatim; shared dependencies come from shared/context.
 */
${destructure}

${bodies}
`;
  fs.mkdirSync(path.join(MODULES_DIR, domain), { recursive: true });
  fs.writeFileSync(
    path.join(MODULES_DIR, domain, `${domain}.controller.js`),
    file
  );
  console.log(`✅ ${domain}.controller.js (${present.length} handlers)`);
}

console.log("\nDone. Functions skipped (auth):", [...SKIP].join(", "));
