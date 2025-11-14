const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const floor = sequelize.define('floor', {
        floor_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        floor_start: {
            type: Sequelize.INTEGER,
        },
        floorNumber: {
            type: Sequelize.INTEGER,
        },
        unit_id: {
            type: Sequelize.INTEGER,
        },
        wing_id: {
            type: Sequelize.INTEGER,
        },
        unit_category_detail_id: {
            type: Sequelize.INTEGER,
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