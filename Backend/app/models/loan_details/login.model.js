module.exports = (sequelize, Sequelize) => {
    const Login = sequelize.define('login', {
        login_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.INTEGER,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        loanAmount: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        loanDate: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        loanAccountNumber: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        bankName: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        product: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        smName: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        amName: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        remarks_loan: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        bankCode: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        dateOfBirth: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        disbursementDate: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        updated_by: {
            type: Sequelize.INTEGER,
        },
        code_id: {
            type: Sequelize.INTEGER,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
    }, {
        tableName: 'loginloan',
    });

    return Login;
};
