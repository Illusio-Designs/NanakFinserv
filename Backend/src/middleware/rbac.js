/**
 * Role-based access control.
 *
 * The JWT payload carries `Role` as the role's UUID (and `categoryIds` as an
 * array of category UUIDs + the caller's role UUID). `requireRole(...ids)`
 * allows the request only if the caller's role is in the list. Must be mounted
 * AFTER the auth middleware (which populates req.user).
 *
 * Roles/categories are identified by the stable seeded UUIDs in
 * src/config/ids.js (see ROLE_IDS / CATEGORY_IDS).
 */
const { ROLE_IDS, CATEGORY_IDS, MANAGER_ROLE_IDS } = require("../config/ids");

// Kept under the historical names so existing imports keep working; values are
// now UUID strings instead of numbers.
const ROLES = {
  SUPER_ADMIN: ROLE_IDS.SUPER_ADMIN,
  BUILDER: ROLE_IDS.BUILDER,
  CONSUMER: ROLE_IDS.CONSUMER,
  STAFF: ROLE_IDS.STAFF,
  BUILDER_CONSUMER: ROLE_IDS.BUILDER_CONSUMER,
  BUILDING_MANAGER: ROLE_IDS.BUILDING_MANAGER,
};

// Vertical managers (Loan/Mediclaim/Vehicle/Life) — back-office staff that
// replace the generic Staff role. STAFF kept in the groups for back-compat.
const MANAGERS = [...MANAGER_ROLE_IDS, ROLES.STAFF];

// ── Role groups ───────────────────────────────────────────────────────────
// Inclusive by design: each group lists every role that legitimately uses the
// endpoints, so we block the clearly-wrong roles without locking out real
// users. Adjust per product sign-off.
//
// HQ back-office config / master data.
const ADMIN = [ROLES.SUPER_ADMIN, ...MANAGERS];
// Internal + builders (builder data, units, consumer onboarding).
const BUILDER_OPS = [ROLES.SUPER_ADMIN, ...MANAGERS, ROLES.BUILDER];
// Everyone who uses the management dashboard.
const PORTAL = [ROLES.SUPER_ADMIN, ...MANAGERS, ROLES.BUILDER, ROLES.BUILDING_MANAGER];
// Consumer-facing views.
const CONSUMER_VIEW = [
  ROLES.SUPER_ADMIN, ...MANAGERS, ROLES.CONSUMER,
  ROLES.BUILDER_CONSUMER, ROLES.BUILDING_MANAGER,
];

// Business verticals, gated by the JWT `categoryIds` (mirrors the frontend's
// PrivateLoan/PrivateMediclaim/... route guards). Super admin bypasses.
const CATEGORIES = {
  LOAN: CATEGORY_IDS.LOAN,
  MEDICLAIM: CATEGORY_IDS.MEDICLAIM,
  LIFE_INSURANCE: CATEGORY_IDS.LIFE_INSURANCE,
  VEHICLE: CATEGORY_IDS.VEHICLE,
};

function requireRole(...allowed) {
  return (req, res, next) => {
    const role = req.user && req.user.Role;
    if (role && allowed.includes(role)) return next();
    return res
      .status(403)
      .json({ message: "Forbidden: insufficient role", status: false });
  };
}

/**
 * Vertical access guard: super admin passes; otherwise the caller must carry the
 * category in their JWT `categoryIds`. Matches the frontend's category-based
 * route guards.
 *   requireCategory(CATEGORIES.LOAN)
 */
function requireCategory(categoryId) {
  return (req, res, next) => {
    const role = req.user && req.user.Role;
    if (role === ROLES.SUPER_ADMIN) return next();
    const cats = (req.user && req.user.categoryIds) || [];
    if (Array.isArray(cats) && cats.includes(categoryId)) return next();
    return res
      .status(403)
      .json({ message: "Forbidden: missing category access", status: false });
  };
}

/**
 * Object-level guard: allow privileged roles through unconditionally, otherwise
 * only allow when the route param identifies the caller's own record.
 *   requireSelfOrRoles("consumerId", ADMIN)
 */
function requireSelfOrRoles(paramName, allowedRoles) {
  return (req, res, next) => {
    const role = req.user && req.user.Role;
    if (role && allowedRoles.includes(role)) return next();
    const target = req.params && req.params[paramName];
    if (
      target !== undefined &&
      req.user &&
      String(target) === String(req.user.id)
    ) {
      return next();
    }
    return res
      .status(403)
      .json({ message: "Forbidden: not your resource", status: false });
  };
}

module.exports = {
  requireRole,
  requireCategory,
  requireSelfOrRoles,
  ROLES,
  CATEGORIES,
  ADMIN,
  BUILDER_OPS,
  PORTAL,
  CONSUMER_VIEW,
};
