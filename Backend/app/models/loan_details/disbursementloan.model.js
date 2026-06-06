module.exports = (sequelize, Sequelize) => {
    const DisbursementLoan = sequelize.define('disbursetb', {
        disbursement_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.UUID,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        disbursementAmount: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        disbursementRate: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        insurance: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        fileNumber: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        disbursementDate: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        remark_dis:{
            type: Sequelize.STRING(100),
            allowNull: true
        },
        insuranceBankName: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        insuranceAmount: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        insuranceType: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        updated_by: {
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'disburseloan',
    });

    return DisbursementLoan;
};
