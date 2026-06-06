const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Cancel = sequelize.define('cancel', {
        cancel_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.UUID,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        remarks_cancel: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        updated_by: {
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'cancelloan',
    });

    return Cancel;
};
