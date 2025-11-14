const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const UnitCategory = sequelize.define('unitcategory', {
        unit_category_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        unit_category_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'unitcategory',
        // timestamps: false
    });

    return UnitCategory;
};