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

module.exports = { requireRole, ROLES, ADMIN, BUILDER_OPS, PORTAL, CONSUMER_VIEW };
