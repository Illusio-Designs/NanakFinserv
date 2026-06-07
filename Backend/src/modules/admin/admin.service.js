/**
 * admin service — global settings (vertical toggles) and the data wipe.
 */
const db = require("../../../app/models");

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
const KEEP = new Set(["user", "role", "category", "userCategory", "appSetting"]);

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
  } finally {
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  return targets.map(([name]) => name);
}

function _resetCache() {
  cache = { value: null, ts: 0 };
}

module.exports = { getVerticals, setVerticals, wipeData, VERTICALS, _resetCache };
