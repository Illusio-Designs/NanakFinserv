const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Cancel = sequelize.define('cancel', {
        cancel_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.INTEGER,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        remarks_cancel: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        updated_by: {
            type: Sequelize.INTEGER,
        },
    }, {
        tableName: 'cancelloan',
    });

    return Cancel;
};
