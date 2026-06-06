const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const wing = sequelize.define('wing', {
        wing_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        unit_id: {
            type: Sequelize.UUID,
        },
        unit_category_detail_id: {
            type: Sequelize.UUID,
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