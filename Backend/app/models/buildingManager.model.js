const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const BuildingManager = sequelize.define('buildingmanager', {
        building_manager_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        unit_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        assigned_by: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        status: {
            type: Sequelize.STRING(20),
            defaultValue: 'active'
        },
        assigned_date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        tableName: 'buildingmanager',
        timestamps: false
    });

    return BuildingManager;
};
