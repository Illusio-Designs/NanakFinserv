const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const BuildingManager = sequelize.define('buildingmanager', {
        building_manager_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: Sequelize.UUID,
            allowNull: false
        },
        unit_id: {
            type: Sequelize.UUID,
            allowNull: false
        },
        assigned_by: {
            type: Sequelize.UUID,
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
