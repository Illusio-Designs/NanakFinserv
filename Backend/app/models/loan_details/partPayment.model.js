const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const PartPayment = sequelize.define('part_payment', {
        part_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        part_number: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        part_amount: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        part_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        updated_by: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
    }, {
        tableName: 'part_paymentsloan',
    });

    return PartPayment;
};
