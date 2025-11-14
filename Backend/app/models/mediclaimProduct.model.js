const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const MediclaimProduct = sequelize.define('mediclaimproduct', {
        mediclaim_product_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        mediclaim_product_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        mediclaim_company_id: {
            type: Sequelize.INTEGER,
        },
    }, {
        tableName: 'mediclaimproduct',
        // timestamps: false
    });

    return MediclaimProduct;
};