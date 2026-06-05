"use strict";

/**
 * Creates the app_setting key/value table used for global settings
 * (e.g. the per-vertical on/off toggles in the admin panel).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("app_setting", {
      setting_key: {
        type: Sequelize.STRING(100),
        primaryKey: true,
      },
      setting_value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: { type: Sequelize.DATE, allowNull: true },
      updatedAt: { type: Sequelize.DATE, allowNull: true },
    });

    // Seed the vertical toggles (all enabled by default).
    await queryInterface.bulkInsert("app_setting", [
      {
        setting_key: "verticals",
        setting_value: JSON.stringify({
          loan: true,
          vehicle: true,
          mediclaim: true,
          life: true,
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("app_setting");
  },
};
