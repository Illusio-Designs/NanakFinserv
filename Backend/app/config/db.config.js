const { Sequelize } = require('sequelize');
const config = {
    HOST: 'localhost',
    USER: 'root',
    PASSWORD: 'zymr@123',
    DB: 'wordstation_dev',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
};

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
    host: config.HOST,
    dialect: config.dialect,
    pool: config.pool
});

module.exports = sequelize;
