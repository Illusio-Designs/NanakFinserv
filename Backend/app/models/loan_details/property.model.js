module.exports = (sequelize, Sequelize) => {
    const propertyDetail = sequelize.define('propertydetail', {
        property_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.INTEGER,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        address: {
            type: Sequelize.STRING(500),
            allowNull: true
        },
        sqFeet: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        deedAmount: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        updated_by: {
            type: Sequelize.INTEGER,
        },
    }, {
        tableName: 'propertydetail',
    });

    return propertyDetail;
};
