module.exports = (sequelize, Sequelize) => {
    const propertyDetail = sequelize.define('propertydetail', {
        property_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.UUID,
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
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'propertydetail',
    });

    return propertyDetail;
};
