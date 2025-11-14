const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const BuilderUser = sequelize.define('builderuser', {
        builder_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        company_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        created_by: {
            type: Sequelize.INTEGER,
        },
        updated_by: {
            type: Sequelize.INTEGER,
        }
    }, {
        tableName: 'builderuser',
        // timestamps: false
    });

    return BuilderUser;
};