const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Category = sequelize.define('category', {
        category_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        category_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'category',
        // timestamps: false
    });

    return Category;
};