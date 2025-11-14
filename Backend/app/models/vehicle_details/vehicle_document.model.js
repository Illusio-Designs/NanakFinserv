const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const Document = sequelize.define('vehicle_documents', {
        user_id: {
            type: DataTypes.INTEGER,
        },
        vehicle_user_id: {
            type: DataTypes.INTEGER,
        },
        categoryId: {
            type: DataTypes.INTEGER,
        },
        file: {
            type: DataTypes.STRING,
        }
    }, {
        tableName: 'vehicle_documents',
    });
    return Document;
};