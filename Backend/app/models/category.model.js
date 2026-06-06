const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Category = sequelize.define('category', {
        category_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
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