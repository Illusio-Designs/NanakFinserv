module.exports = (sequelize, Sequelize) => {
  // Simple key/value store for global app settings (e.g. vertical toggles).
  const AppSetting = sequelize.define(
    'app_setting',
    {
      setting_key: {
        type: Sequelize.STRING(100),
        primaryKey: true,
      },
      setting_value: {
        type: Sequelize.TEXT, // JSON-encoded
        allowNull: true,
      },
    },
    { tableName: 'app_setting' }
  );

  return AppSetting;
};
