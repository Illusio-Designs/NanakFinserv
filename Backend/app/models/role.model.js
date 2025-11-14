const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define('role', {
        role_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        role_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'role',
        // timestamps: false
    });

    return Role;
};