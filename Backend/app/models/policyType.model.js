const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const policytype = sequelize.define('policytype', {
        policy_type_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        policy_type_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'policytype',
        // timestamps: false
    });

    return policytype;
};