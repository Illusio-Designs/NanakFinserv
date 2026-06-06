module.exports = (sequelize, Sequelize) => {
    const Sanction = sequelize.define('sanction', {
        sanction_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.UUID,
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
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'sanctionloan'
    });

    return Sanction;
};
