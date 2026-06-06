const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const ConsumerRoleMapping = sequelize.define('consumerrolemapping', {
        consumer_role_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        user_role_id: {
            type: Sequelize.UUID,
        },
        user_consumer_id: {
            type: Sequelize.UUID,
        },
        category_id: {
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'consumerrolemapping',
        // timestamps: false
    });

    return ConsumerRoleMapping;
};