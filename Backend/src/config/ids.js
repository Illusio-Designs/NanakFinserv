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
  STAFF: "10000000-0000-4000-8000-000000000004",
  BUILDER_CONSUMER: "10000000-0000-4000-8000-000000000005",
  BUILDING_MANAGER: "10000000-0000-4000-8000-000000000007",
};

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

// Human-readable names for seeding (and any name-based UI lookups).
const ROLE_NAMES = {
  [ROLE_IDS.SUPER_ADMIN]: "Super Admin",
  [ROLE_IDS.BUILDER]: "Builder",
  [ROLE_IDS.CONSUMER]: "Consumer",
  [ROLE_IDS.STAFF]: "Staff",
  [ROLE_IDS.BUILDER_CONSUMER]: "Builder Consumer",
  [ROLE_IDS.BUILDING_MANAGER]: "Building Manager",
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

module.exports = {
  ROLE_IDS,
  CATEGORY_IDS,
  UNIT_CATEGORY_IDS,
  ROLE_NAMES,
  CATEGORY_NAMES,
  UNIT_CATEGORY_NAMES,
};
