const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const Document = sequelize.define('vehicle_documents', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.UUID,
        },
        vehicle_user_id: {
            type: DataTypes.UUID,
        },
        categoryId: {
            type: DataTypes.UUID,
        },
        file: {
            type: DataTypes.STRING,
        }
    }, {
        tableName: 'vehicle_documents',
    });
    return Document;
};