/**
 * Sequelize CLI database config (used by `sequelize-cli db:migrate`).
 * Reads the same env vars as app/models/index.js so migrations target the same DB.
 */
require("dotenv").config();

const common = {
  username: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
  host: process.env.HOST,
  port: process.env.DB_PORT || 3306,
  dialect: process.env.dialect || "mysql",
  logging: false,
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
