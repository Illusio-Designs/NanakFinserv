#!/usr/bin/env node
/**
 * db-bootstrap.js — one-time schema bootstrap for a FRESH database.
 *
 * The app does NOT create tables on boot (server.js only authenticates), and
 * the two migration files assume the base tables already exist. On a brand-new
 * database (e.g. production's nanakfinserv_db) nothing has created the schema
 * yet — that's what this script does, idempotently:
 *
 *   1. Create every table from the Sequelize models (sequelize.sync) and apply
 *      the idempotent baseline column additions (app/config/db.migration.js).
 *   2. Seed the `verticals` row in app_setting (loan/vehicle/mediclaim/life on).
 *   3. Mark both migration files as already-applied in SequelizeMeta, so a later
 *      `npm run db:migrate` is a clean no-op instead of colliding on app_setting.
 *
 * Safe to run more than once. Must be run ON THE SERVER (DB host is localhost).
 *
 *   source /home/nanakfinserv/nodevenv/Backend/20/bin/activate
 *   cd /home/nanakfinserv/Backend
 *   node scripts/db-bootstrap.js
 */
const db = require("../app/models");
const alterTables = require("../app/config/db.migration");

const APPLIED_MIGRATIONS = [
  "20260603000000-baseline-column-additions.js",
  "20260605000000-create-app-setting.js",
];

async function main() {
  const { sequelize } = db;

  await sequelize.authenticate();
  console.log("✓ DB connection OK");

  // 1) Create all tables from models + apply idempotent baseline column tweaks.
  //    alterTables() runs sequelize.sync({force:false}) internally when the base
  //    schema is missing, so this both creates and back-fills.
  await sequelize.sync({ force: false });
  console.log("✓ sequelize.sync complete (tables created)");
  await alterTables();
  console.log("✓ baseline column additions applied");

  // 2) Seed the verticals toggle row (idempotent).
  if (db.appSetting) {
    const [, created] = await db.appSetting.findOrCreate({
      where: { setting_key: "verticals" },
      defaults: {
        setting_value: JSON.stringify({
          loan: true,
          vehicle: true,
          mediclaim: true,
          life: true,
        }),
      },
    });
    console.log(created ? "✓ seeded verticals setting" : "• verticals setting already present");
  }

  // 3) Record migrations as applied so sequelize-cli won't re-run them.
  await sequelize.query(
    "CREATE TABLE IF NOT EXISTS `SequelizeMeta` (`name` VARCHAR(255) NOT NULL, PRIMARY KEY (`name`), UNIQUE KEY `name` (`name`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
  );
  for (const name of APPLIED_MIGRATIONS) {
    await sequelize.query("INSERT IGNORE INTO `SequelizeMeta` (`name`) VALUES (?)", {
      replacements: [name],
    });
  }
  console.log("✓ SequelizeMeta marked:", APPLIED_MIGRATIONS.join(", "));

  // Report a table count for confirmation.
  const [rows] = await sequelize.query(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()"
  );
  console.log(`\n✅ Bootstrap done. Tables in database: ${rows[0].n}`);
  await sequelize.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Bootstrap failed:", e.message);
  process.exit(1);
});
