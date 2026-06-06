const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const floor = sequelize.define('floor', {
        floor_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        floor_start: {
            type: Sequelize.INTEGER,
        },
        floorNumber: {
            type: Sequelize.INTEGER,
        },
        unit_id: {
            type: Sequelize.UUID,
        },
        wing_id: {
            type: Sequelize.UUID,
        },
        unit_category_detail_id: {
            type: Sequelize.UUID,
        },
        floor_end: {
            type: Sequelize.INTEGER,
        },
    }, {
        tableName: 'floor',
        // timestamps: false
    });

    return floor;
};