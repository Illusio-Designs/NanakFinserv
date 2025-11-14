const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const documents = sequelize.define('documents', {
        categoryId: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        doc_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'documents',
        // timestamps: false
    });

    return documents;
};