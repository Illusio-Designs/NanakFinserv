const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const MediclaimProduct = sequelize.define('mediclaimproduct', {
        mediclaim_product_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        mediclaim_product_name: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        mediclaim_company_id: {
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'mediclaimproduct',
        // timestamps: false
    });

    return MediclaimProduct;
};