const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Query = sequelize.define('query', {
        query_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.UUID,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        remarks: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        updated_by: {
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'queryloan',
    });

    return Query;
};
