const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Unit = sequelize.define('unit', {
        unit_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        unit_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        address: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        builder_id: {
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'unit',
        // timestamps: false
    });

    return Unit;
};