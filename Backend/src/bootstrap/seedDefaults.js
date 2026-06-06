/**
 * Default data seeded on boot (idempotent).
 *
 * Ensures the lookup tables (role, category, unit_category) and a default admin
 * user always exist, so the app is usable on a fresh database. Safe to run on
 * every start — uses findOrCreate, so it never duplicates rows.
 *
 * The lookup rows are pinned to the stable UUIDs in src/config/ids.js so the
 * application logic (and the frontend) can reference them by name.
 *
 * Overridable via env:
 *   DEFAULT_ADMIN_MOBILE  (default 7600046416)
 *   DEFAULT_ADMIN_NAME    (default "Admin")
 *   DEFAULT_ADMIN_EMAIL   (default "admin@nanakfinserv.com")
 *   SEED_DEFAULTS=off     to disable seeding entirely
 */
const db = require("../../app/models");
const {
  ROLE_IDS,
  ROLE_NAMES,
  CATEGORY_NAMES,
  UNIT_CATEGORY_NAMES,
  DOCUMENT_NAMES,
} = require("../config/ids");

const ADMIN_MOBILE = process.env.DEFAULT_ADMIN_MOBILE || "7600046416";
const ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || "Admin";
const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@nanakfinserv.com";

async function seedDefaults(logger) {
  const log = logger || console;

  // 1) Lookup tables — pinned UUID + name.
  for (const [id, name] of Object.entries(ROLE_NAMES)) {
    await db.role.findOrCreate({ where: { role_id: id }, defaults: { role_id: id, role_name: name } });
  }
  for (const [id, name] of Object.entries(CATEGORY_NAMES)) {
    await db.category.findOrCreate({ where: { category_id: id }, defaults: { category_id: id, category_name: name } });
  }
  for (const [id, name] of Object.entries(UNIT_CATEGORY_NAMES)) {
    await db.unit_category_list.findOrCreate({
      where: { unit_category_id: id },
      defaults: { unit_category_id: id, unit_category_name: name },
    });
  }
  for (const [id, name] of Object.entries(DOCUMENT_NAMES)) {
    await db.documents.findOrCreate({
      where: { categoryId: id },
      defaults: { categoryId: id, doc_name: name },
    });
  }
  log.info("Lookup tables seeded (roles, categories, unit categories, documents)");

  // 2) Default admin user (looked up by mobile, the login key).
  const [user, created] = await db.user.findOrCreate({
    where: { mobileNumber: ADMIN_MOBILE },
    defaults: {
      username: ADMIN_NAME,
      email: ADMIN_EMAIL,
      mobileNumber: ADMIN_MOBILE,
      role_id: ROLE_IDS.SUPER_ADMIN,
    },
  });

  // 3) Keep the configured number an admin even if it pre-existed.
  if (!created && user.role_id !== ROLE_IDS.SUPER_ADMIN) {
    await db.user.update(
      { role_id: ROLE_IDS.SUPER_ADMIN },
      { where: { user_id: user.user_id } }
    );
    log.info({ mobile: ADMIN_MOBILE }, "Promoted existing user to Super Admin");
  }

  log.info(
    { mobile: ADMIN_MOBILE, created },
    created ? "Default admin user created" : "Default admin user already present"
  );
}

module.exports = { seedDefaults };
