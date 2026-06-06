const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const medicliamuser = sequelize.define('medicliamuser', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        medicliam_type: {
            type: DataTypes.STRING,
        },
        medicliam_policy_type: {
            type: DataTypes.STRING,
        },
        dob: {
            type: DataTypes.DATE,
        },
        mediclaim_company_id: {
            type: DataTypes.UUID,
        },
        mediclaim_product_id: {
            type: DataTypes.UUID,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        age: {
            type: DataTypes.INTEGER,
        },
        gender: {
            type: DataTypes.STRING,
        },
        relationshipWithPolicyHolder: {
            type: DataTypes.STRING,
        },
        insuredPersonName:{
            type: DataTypes.STRING,
        },
        insuredPersonRelationship: {
            type: DataTypes.STRING,
        },
        insuredPersonDateOfBirth: {
            type: DataTypes.DATE,
        },
        insuredPersonAge: {
            type: DataTypes.INTEGER,
        },
        insuredPersonGender: {
            type: DataTypes.STRING,
        },
        insuredPersonDateOfJoining: {
            type: DataTypes.DATE,
        },
        insuredPersonPreExistingIllness: {
            type: DataTypes.STRING,
        },
        referenceName: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        sumInsured: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        noClaimBonus: {
            type: DataTypes.STRING,
        },
        preExistingIllness: {
            type: DataTypes.STRING,
        },
        agentName: {
            type: DataTypes.STRING,
        },
        agentCode: {
            type: DataTypes.STRING,
        },
        agentContactNumber: {
            type: DataTypes.STRING,
        },
        AadharFileName: {
            type: DataTypes.STRING,
        },
        PanFileName: {
            type: DataTypes.STRING,
        },
        GstFileName: {
            type: DataTypes.STRING,
        },
        customDocuments: {
            type: DataTypes.TEXT,
        },
    }, {
        tableName: 'medicliamuser',
        // timestamps: true,
    });

    return medicliamuser;
};
