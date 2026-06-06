const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const loanconfiguration = sequelize.define('loanconfiguration', {
        config_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
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