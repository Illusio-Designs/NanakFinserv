/**
 * Role-based access control.
 *
 * The JWT payload carries `Role` as the numeric role_id. `requireRole(...ids)`
 * allows the request only if the caller's role is in the list. Must be mounted
 * AFTER the auth middleware (which populates req.user).
 *
 * Applied conservatively to back-office config/management writes so that
 * consumers/builders/building-managers cannot reach them. Fine-grained,
 * per-record authorization still lives inside the handlers.
 */
const ROLES = {
  SUPER_ADMIN: 1,
  BUILDER: 2,
  CONSUMER: 3,
  STAFF: 4,
  BUILDER_CONSUMER: 5,
  BUILDING_MANAGER: 7,
};

// ── Role groups ───────────────────────────────────────────────────────────
// Inclusive by design: each group lists every role that legitimately uses the
// endpoints, so we block the clearly-wrong roles without locking out real
// users. Adjust per product sign-off.
//
// HQ back-office config / master data.
const ADMIN = [ROLES.SUPER_ADMIN, ROLES.STAFF];
// Internal + builders (builder data, units, consumer onboarding).
const BUILDER_OPS = [ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.BUILDER];
// Everyone who uses the management dashboard.
const PORTAL = [ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.BUILDER, ROLES.BUILDING_MANAGER];
// Consumer-facing views.
const CONSUMER_VIEW = [
  ROLES.SUPER_ADMIN, ROLES.STAFF, ROLES.CONSUMER,
  ROLES.BUILDER_CONSUMER, ROLES.BUILDING_MANAGER,
];

// Business verticals, gated by the JWT `categoryIds` (mirrors the frontend's
// PrivateLoan/PrivateMediclaim/... route guards). Super admin bypasses.
const CATEGORIES = {
  LOAN: 2,
  MEDICLAIM: 4,
  LIFE_INSURANCE: 5,
  VEHICLE: 6,
};

function requireRole(...allowed) {
  const allow = allowed.map(Number);
  return (req, res, next) => {
    const role = req.user && Number(req.user.Role);
    if (role && allow.includes(role)) return next();
    return res
      .status(403)
      .json({ message: "Forbidden: insufficient role", status: false });
  };
}

/**
 * Vertical access guard: super admin (role 1) passes; otherwise the caller must
 * carry the category in their JWT `categoryIds`. Matches the frontend's
 * category-based route guards.
 *   requireCategory(CATEGORIES.LOAN)
 */
function requireCategory(categoryId) {
  const cat = Number(categoryId);
  return (req, res, next) => {
    const role = req.user && Number(req.user.Role);
    if (role === ROLES.SUPER_ADMIN) return next();
    const cats = (req.user && req.user.categoryIds) || [];
    if (Array.isArray(cats) && cats.map(Number).includes(cat)) return next();
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
  const allow = allowedRoles.map(Number);
  return (req, res, next) => {
    const role = req.user && Number(req.user.Role);
    if (role && allow.includes(role)) return next();
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
