const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const LoanUser = sequelize.define('loanuser', {
        laon_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        status: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        role_id: {
            type: Sequelize.INTEGER,
        },
        remarks: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null
        },
        non_builder_name: {
            type: Sequelize.STRING(255),
            allowNull: true
        },
        non_builder_property_name: {
            type: Sequelize.STRING(255),
            allowNull: true
        },
        sq_ft: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        },
        deed_amount: {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: true
        },
        address: {
            type: Sequelize.TEXT,
            allowNull: true
        }
        // Removed the sanction fields to avoid migration
    }, {
        tableName: 'loanuser',
        // timestamps: false
    });
    return LoanUser;
};
