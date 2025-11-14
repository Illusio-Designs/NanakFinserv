module.exports = (sequelize, Sequelize) => {
    const Sanction = sequelize.define('sanction', {
        sanction_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.INTEGER,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        amount: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        rate: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        tenure: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        sanctionDate: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        updated_by: {
            type: Sequelize.INTEGER,
        },
    }, {
        tableName: 'sanctionloan'
    });

    return Sanction;
};
