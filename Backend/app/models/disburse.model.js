const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const Disburse = sequelize.define('disburse', {
        disburse_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.UUID,
        },
        user_id: {
            type: Sequelize.UUID,
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