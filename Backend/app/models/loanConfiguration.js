const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const loanconfiguration = sequelize.define('loanconfiguration', {
        config_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        pdfname: {
            type: Sequelize.TEXT,
        },
        categoryname:{
            type: Sequelize.TEXT,
        }
    }, {
        tableName: 'loanconfiguration',
        // timestamps: false
    });

    return loanconfiguration;
};