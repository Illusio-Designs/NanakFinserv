const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Query = sequelize.define('query', {
        query_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.INTEGER,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        remarks: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        updated_by: {
            type: Sequelize.INTEGER,
        },
    }, {
        tableName: 'queryloan',
    });

    return Query;
};
