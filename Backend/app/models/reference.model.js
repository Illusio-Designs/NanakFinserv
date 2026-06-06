const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const references = sequelize.define('references', {
        reference_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        reference_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'references',
        // timestamps: false
    });

    return references;
};