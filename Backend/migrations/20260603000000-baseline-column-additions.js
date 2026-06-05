"use strict";

/**
 * Baseline migration.
 *
 * Records, as a versioned migration, the idempotent column additions that were
 * previously applied on every server boot by app/config/db.migration.js
 * (`alterTables`). Boot no longer mutates the schema — run `npm run db:migrate`
 * as part of deploy instead.
 *
 * It reuses the existing idempotent logic so this migration is provably
 * equivalent to the prior behaviour. New schema changes should be added as
 * fresh migration files going forward.
 */
module.exports = {
  async up() {
    // eslint-disable-next-line global-require
    const alterTables = require("../app/config/db.migration");
    await alterTables();
  },

  async down() {
    // No-op: the baseline only adds nullable columns; reversing them would risk
    // data loss and is intentionally not automated.
  },
};
