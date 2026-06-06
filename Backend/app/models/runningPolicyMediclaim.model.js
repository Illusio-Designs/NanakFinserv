const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const runningpolicies = sequelize.define('runningpolicies', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        mediclaim_id: {
            type: DataTypes.UUID,
        },
        Zone: {
            type: DataTypes.STRING,
        },
        PolicyNumber: {
            type: DataTypes.STRING,
        },
        AdditionalSumInsured: {
            type: DataTypes.STRING,
        },
        AddOnCover: {
            type: DataTypes.STRING,
        },
        PolicyTenure: {
            type: DataTypes.INTEGER,
        },
        PremiumAmount: {
            type: DataTypes.FLOAT,
        },
        PolicyPlanType: {
            type: DataTypes.STRING,
        },
        NomineeName: {
            type: DataTypes.STRING,
        },
        NomineeRelation: {
            type: DataTypes.STRING,
        },
        PolicyFrom: {
            type: DataTypes.STRING,
        },
        PolicyTo: {
            type: DataTypes.STRING,
        },
        PolicyIssuedDate: {
            type: DataTypes.STRING,
        },
        ExpiryDate: {
            type: DataTypes.STRING,
        },
        NomineeDob: {
            type: DataTypes.STRING,
        },
        PreviousPolicyFlag: {
            type: DataTypes.STRING,
        },
        NomineeAge: {
            type: DataTypes.STRING,
        },
        PdfFile: {
            type: DataTypes.STRING,
        },
        CurrentPolicyFile: {
            type: DataTypes.STRING,
        },
        ClaimExpireInPolicy: {
            type: DataTypes.STRING,
        },
    }, {
        tableName: 'running_policies',
    })
    return runningpolicies;
};
