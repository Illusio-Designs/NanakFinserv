const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const FamilyMember = sequelize.define('familymember', {
        family_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        mediclaim_id: {
            type: DataTypes.INTEGER,
        },
        DateOfBirth: {
            type: DataTypes.STRING,
        },
        Age: {
            type: DataTypes.INTEGER,
        },
        Gender: {
            type: DataTypes.STRING,
        },
        RelationshipWithPolicyHolder: {
            type: DataTypes.STRING,
        },
        FamilyName:{
            type: DataTypes.STRING,
        },
        DateOfJoining: {
            type: DataTypes.STRING,
        },
        PreExistingIllness: {
            type: DataTypes.STRING,
        }
    }, {
        tableName: 'familymember',
        // timestamps: false
    });

    return FamilyMember;
};
