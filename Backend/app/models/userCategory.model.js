const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const UserCategory = sequelize.define('usercategory', {
        user_category_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: Sequelize.UUID,
        },
        category_id: {
            type: Sequelize.UUID,
        },
    }, {
        tableName: 'usercategory',
        // timestamps: false
    });

    return UserCategory;
};