const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const vehicles = sequelize.define('vehicles', {
        vehicle_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        vehicle_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'vehicles',
        // timestamps: false
    });

    return vehicles;
};