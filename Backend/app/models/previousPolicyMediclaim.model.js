const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const previouspolicies = sequelize.define('previouspolicies', {
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
        PolicyFrom: {
            type: DataTypes.STRING,
        },
        PolicyTo: {
            type: DataTypes.STRING,
        },
        PolicyTenure: {
            type: DataTypes.INTEGER,
        },
        PremiumAmount: {
            type: DataTypes.FLOAT,
        },
        SumInsured: {
            type: DataTypes.FLOAT,
        },
        NoClaimBonus: {
            type: DataTypes.STRING,
        },
        AddOnCover: {
            type: DataTypes.STRING,
        },
        NomineeName: {
            type: DataTypes.STRING,
        },
        NomineeRelation: {
            type: DataTypes.STRING,
        },
        PreviousPolicyNumber: {
            type: DataTypes.STRING,
        },
        CompanyName: {
            type: DataTypes.STRING,
        },
        ClaimStatementPDFfile: {
            type: DataTypes.STRING,
        },
        NomineeDob: {
            type: DataTypes.STRING,
        },
        NomineeAge: {
            type: DataTypes.STRING,
        },
        mediclaim_product_id: {
            type: DataTypes.UUID,
        },
        RenewDate: {
            type: DataTypes.STRING,
        },
        PdfFile: {
            type: DataTypes.STRING,
        },
        PdfFileName: {
            type: DataTypes.STRING,
        },
        ClaimStatementPDFfileName: {
            type: DataTypes.STRING,
        },
        ClaimExpireInPolicy: {
            type: DataTypes.STRING,
        },
        status: {
            type: DataTypes.STRING,
        },
        PreviousAgentName: {
            type: DataTypes.STRING,
        },
        PreviousAgentCode: {
            type: DataTypes.STRING,
        },
        PreviousAgentContactNumber: {
            type: DataTypes.STRING,
        },
    }, {
        tableName: 'previous_policies',
    })
    return previouspolicies;
};