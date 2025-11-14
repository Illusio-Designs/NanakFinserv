const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Disburse = sequelize.define('disburse', {
        disburse_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.INTEGER,
        },
        user_id: {
            type: Sequelize.INTEGER,
        },
        pdfname: {
            type: Sequelize.TEXT,
        },
        categoryname:{
            type: Sequelize.TEXT,
        }
    }, {
        tableName: 'disburse',
        // timestamps: false
    });

    return Disburse;
};