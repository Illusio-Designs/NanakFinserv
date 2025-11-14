const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Inqueryuser = sequelize.define('inqueryuser', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        email: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        mobile_no: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        services: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'inqueryuser',
        // timestamps: false
    });

    return Inqueryuser;
};