/**
 * Fixed UUIDs for the seeded lookup tables (role, category, unit_category).
 *
 * These tables hold a small, fixed set of rows that the application logic and
 * the frontend reference by identity. Since every table now uses UUID primary
 * keys, we pin these rows to STABLE, well-known UUIDs (seeded in
 * src/bootstrap/seedDefaults.js) so the code can refer to them by name instead
 * of by the old magic numbers.
 *
 * The trailing digit of each UUID matches the historical numeric id, purely as
 * a readability aid (Super Admin was 1, Builder was 2, …).
 *
 * IMPORTANT: the frontend has a matching copy of these constants. Keep them in
 * sync (Frontend/src/constants/ids.js).
 */

const ROLE_IDS = {
  SUPER_ADMIN: "10000000-0000-4000-8000-000000000001",
  BUILDER: "10000000-0000-4000-8000-000000000002",
  CONSUMER: "10000000-0000-4000-8000-000000000003",
  STAFF: "10000000-0000-4000-8000-000000000004", // legacy — kept for back-compat, not seeded/offered
  BUILDER_CONSUMER: "10000000-0000-4000-8000-000000000005",
  BUILDING_MANAGER: "10000000-0000-4000-8000-000000000007",
  // Per-vertical managers (replace the generic Staff role).
  LOAN_MANAGER: "10000000-0000-4000-8000-000000000008",
  MEDICLAIM_MANAGER: "10000000-0000-4000-8000-000000000009",
  VEHICLE_MANAGER: "10000000-0000-4000-8000-00000000000a",
  LIFE_MANAGER: "10000000-0000-4000-8000-00000000000b",
};

// Vertical-manager roles + the category each manages.
const MANAGER_ROLE_IDS = [
  ROLE_IDS.LOAN_MANAGER,
  ROLE_IDS.MEDICLAIM_MANAGER,
  ROLE_IDS.VEHICLE_MANAGER,
  ROLE_IDS.LIFE_MANAGER,
];

const CATEGORY_IDS = {
  LOAN: "20000000-0000-4000-8000-000000000002",
  MEDICLAIM: "20000000-0000-4000-8000-000000000004",
  LIFE_INSURANCE: "20000000-0000-4000-8000-000000000005",
  VEHICLE: "20000000-0000-4000-8000-000000000006",
};

const UNIT_CATEGORY_IDS = {
  SHOWROOM: "30000000-0000-4000-8000-000000000001",
  OFFICE: "30000000-0000-4000-8000-000000000002",
  FLAT: "30000000-0000-4000-8000-000000000003",
  HOUSE: "30000000-0000-4000-8000-000000000004",
};

// Document types stored in the `documents` lookup table (FK target of
// vehicle_document.categoryId). Historically: Aadhar=1, PAN=2, GST=3, RC Book=4.
const DOCUMENT_IDS = {
  AADHAR: "40000000-0000-4000-8000-000000000001",
  PAN: "40000000-0000-4000-8000-000000000002",
  GST: "40000000-0000-4000-8000-000000000003",
  RC_BOOK: "40000000-0000-4000-8000-000000000004",
};

// Human-readable names for seeding (and any name-based UI lookups).
const ROLE_NAMES = {
  [ROLE_IDS.SUPER_ADMIN]: "Super Admin",
  [ROLE_IDS.BUILDER]: "Builder",
  [ROLE_IDS.CONSUMER]: "Consumer",
  [ROLE_IDS.BUILDER_CONSUMER]: "Builder Consumer",
  [ROLE_IDS.BUILDING_MANAGER]: "Building Manager",
  [ROLE_IDS.LOAN_MANAGER]: "Loan Manager",
  [ROLE_IDS.MEDICLAIM_MANAGER]: "Mediclaim Manager",
  [ROLE_IDS.VEHICLE_MANAGER]: "Vehicle Manager",
  [ROLE_IDS.LIFE_MANAGER]: "Life Insurance Manager",
};

// Which category each vertical-manager role is responsible for.
const MANAGER_CATEGORY = {
  [ROLE_IDS.LOAN_MANAGER]: CATEGORY_IDS.LOAN,
  [ROLE_IDS.MEDICLAIM_MANAGER]: CATEGORY_IDS.MEDICLAIM,
  [ROLE_IDS.VEHICLE_MANAGER]: CATEGORY_IDS.VEHICLE,
  [ROLE_IDS.LIFE_MANAGER]: CATEGORY_IDS.LIFE_INSURANCE,
};

const CATEGORY_NAMES = {
  [CATEGORY_IDS.LOAN]: "Loan",
  [CATEGORY_IDS.MEDICLAIM]: "Mediclaim",
  [CATEGORY_IDS.LIFE_INSURANCE]: "Life Insurance",
  [CATEGORY_IDS.VEHICLE]: "Vehicle",
};

const UNIT_CATEGORY_NAMES = {
  [UNIT_CATEGORY_IDS.SHOWROOM]: "Showroom",
  [UNIT_CATEGORY_IDS.OFFICE]: "Office",
  [UNIT_CATEGORY_IDS.FLAT]: "Flat",
  [UNIT_CATEGORY_IDS.HOUSE]: "House",
};

const DOCUMENT_NAMES = {
  [DOCUMENT_IDS.AADHAR]: "Aadhar",
  [DOCUMENT_IDS.PAN]: "PAN",
  [DOCUMENT_IDS.GST]: "GST",
  [DOCUMENT_IDS.RC_BOOK]: "RC Book",
};

module.exports = {
  ROLE_IDS,
  MANAGER_ROLE_IDS,
  MANAGER_CATEGORY,
  CATEGORY_IDS,
  UNIT_CATEGORY_IDS,
  DOCUMENT_IDS,
  ROLE_NAMES,
  CATEGORY_NAMES,
  UNIT_CATEGORY_NAMES,
  DOCUMENT_NAMES,
};
