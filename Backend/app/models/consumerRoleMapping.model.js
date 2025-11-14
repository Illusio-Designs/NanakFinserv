const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const ConsumerRoleMapping = sequelize.define('consumerrolemapping', {
        consumer_role_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_role_id: {
            type: Sequelize.INTEGER,
        },
        user_consumer_id: {
            type: Sequelize.INTEGER,
        },
        category_id: {
            type: Sequelize.INTEGER,
        },
    }, {
        tableName: 'consumerrolemapping',
        // timestamps: false
    });

    return ConsumerRoleMapping;
};