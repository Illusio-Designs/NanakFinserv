const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const codeDetail = sequelize.define('codedetail', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        code_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'codedetail',
        // timestamps: false
    });

    return codeDetail;
};