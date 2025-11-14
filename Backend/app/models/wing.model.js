const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const wing = sequelize.define('wing', {
        wing_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        unit_id: {
            type: Sequelize.INTEGER,
        },
        unit_category_detail_id: {
            type: Sequelize.INTEGER,
        },
        wing_name: {
            type: Sequelize.STRING,
        },
    }, {
        tableName: 'wing',
        // timestamps: false
    });

    return wing;
};