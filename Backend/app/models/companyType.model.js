const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const companytype = sequelize.define('companytype', {
        company_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        company_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'companytype',
        // timestamps: false
    });

    return companytype;
};