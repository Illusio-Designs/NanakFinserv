/**
 * admin service — global settings (vertical toggles) and the data wipe.
 */
const { Op } = require("sequelize");
const db = require("../../../app/models");
const { ROLE_IDS } = require("../../config/ids");

const AppSetting = db.appSetting;
const VERTICAL_KEY = "verticals";
const VERTICALS = ["loan", "vehicle", "mediclaim", "life", "builder"];
const DEFAULT_VERTICALS = { loan: true, vehicle: true, mediclaim: true, life: true, builder: true };

// Short in-memory cache so the per-request "is this vertical enabled?" check
// doesn't hit the DB every time. Invalidated on update.
let cache = { value: null, ts: 0 };
const TTL_MS = 30 * 1000;

/** @returns {Promise<{loan,vehicle,mediclaim,life}>} */
async function getVerticals() {
  if (cache.value && Date.now() - cache.ts < TTL_MS) return cache.value;

  const row = await AppSetting.findByPk(VERTICAL_KEY);
  let value = { ...DEFAULT_VERTICALS };
  if (row && row.setting_value) {
    try {
      value = { ...DEFAULT_VERTICALS, ...JSON.parse(row.setting_value) };
    } catch (_) {
      value = { ...DEFAULT_VERTICALS };
    }
  }
  cache = { value, ts: Date.now() };
  return value;
}

/** Merge + persist toggles. @returns the full updated map. */
async function setVerticals(partial) {
  const current = await getVerticals();
  const next = { ...current };
  for (const key of VERTICALS) {
    if (typeof partial[key] === "boolean") next[key] = partial[key];
  }
  await AppSetting.upsert({
    setting_key: VERTICAL_KEY,
    setting_value: JSON.stringify(next),
  });
  cache = { value: next, ts: Date.now() }; // refresh cache
  return next;
}

// Tables that must NOT be wiped: accounts + roles/categories + settings.
// Tables never truncated: back-office users (handled separately below) + seeded
// reference data the app needs to keep working after a wipe.
const KEEP = new Set([
  "user",            // handled below — only consumer accounts are deleted
  "role",            // seeded roles
  "category",        // seeded verticals
  "userCategory",    // back-office user → vertical mappings
  "appSetting",      // settings / vertical toggles
  "documents",       // seeded KYC document types
  "unit_category_list", // seeded unit categories
]);

/**
 * Wipe business + master data (keeps user accounts, roles, categories, settings).
 * Truncates every other model. FK checks are disabled around the truncate.
 * @returns {Promise<string[]>} the cleared model names
 */
async function wipeData() {
  const targets = Object.entries(db).filter(
    ([name, model]) =>
      !KEEP.has(name) &&
      model &&
      typeof model.destroy === "function" &&
      typeof model.findAll === "function"
  );

  await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const [, model] of targets) {
      await model.destroy({ where: {}, truncate: true, force: true });
    }
    // Delete consumer accounts (keep back-office users: super admin, vertical
    // managers, builder, building manager).
    await db.user.destroy({
      where: { role_id: { [Op.in]: [ROLE_IDS.CONSUMER, ROLE_IDS.BUILDER_CONSUMER] } },
      force: true,
    });
  } finally {
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  return [...targets.map(([name]) => name), "user (consumers only)"];
}

function _resetCache() {
  cache = { value: null, ts: 0 };
}

module.exports = { getVerticals, setVerticals, wipeData, VERTICALS, _resetCache };
