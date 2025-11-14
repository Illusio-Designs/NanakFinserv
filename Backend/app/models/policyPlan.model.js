const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const policyplan = sequelize.define('policyplan', {
        policy_plan_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        policy_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'policyplan',
        // timestamps: false
    });

    return policyplan;
};