const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const MediclaimCompany = sequelize.define('mediclaimcompany', {
        mediclaim_company_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        mediclaim_company_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
    }, {
        tableName: 'mediclaimcompany',
        // timestamps: false
    });

    return MediclaimCompany;
};