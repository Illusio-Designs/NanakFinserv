const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const BuilderUser = sequelize.define('builderuser', {
        builder_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        company_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        user_id: {
            type: Sequelize.UUID,
        },
        created_by: {
            type: Sequelize.UUID,
        },
        updated_by: {
            type: Sequelize.UUID,
        }
    }, {
        tableName: 'builderuser',
        // timestamps: false
    });

    return BuilderUser;
};