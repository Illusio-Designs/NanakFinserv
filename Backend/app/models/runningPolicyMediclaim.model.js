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
        // Unified policy table: true = current policy, false = history (merges in
        // the old previous_policies table).
        is_current: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        status: { type: DataTypes.STRING }, // derived: running / completed
        // History/claim fields carried over from previous_policies (kept nullable).
        mediclaim_product_id: { type: DataTypes.UUID },
        CompanyName: { type: DataTypes.STRING },
        SumInsured: { type: DataTypes.STRING },
        NoClaimBonus: { type: DataTypes.STRING },
        RenewDate: { type: DataTypes.STRING },
        PreviousPolicyNumber: { type: DataTypes.STRING },
        PreviousAgentName: { type: DataTypes.STRING },
        PreviousAgentCode: { type: DataTypes.STRING },
        PreviousAgentContactNumber: { type: DataTypes.STRING },
        ClaimStatementPDFfile: { type: DataTypes.STRING },
        ClaimStatementPDFfileName: { type: DataTypes.STRING },
        PdfFileName: { type: DataTypes.STRING },
    }, {
        tableName: 'running_policies',
        indexes: [
            // No two policies for the same mediclaim may share a policy number.
            // (MySQL treats NULLs as distinct, so policies without a number are fine.)
            { unique: true, fields: ['mediclaim_id', 'PolicyNumber'], name: 'uniq_mediclaim_policyno' },
        ],
    })
    return runningpolicies;
};
