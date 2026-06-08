const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const runningpolicies_vehicle = sequelize.define('runningpolicies_vehicle', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        vehicle_user_id: {
            type: DataTypes.UUID,
        },
        PolicyNumber: {
            type: DataTypes.STRING,
        },
        policy_type_id: {
            type: DataTypes.UUID,
        },
        company_id: {
            type: DataTypes.UUID,
        },
        policy_plan_id: {
            type: DataTypes.UUID,
        },
        PolicyTenure: {
            type: DataTypes.INTEGER,
        },
        PremiumAmount: {
            type: DataTypes.FLOAT,
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
        // Indian market: long-term TP (3yr car / 5yr 2-wheeler) bundled with 1yr OD (Full).
        // Separate expiry timelines for the TP and OD/Comprehensive portions.
        tp_expiry_date: {
            type: DataTypes.STRING,
        },
        od_expiry_date: {
            type: DataTypes.STRING,
        },
        tp_tenure: {
            type: DataTypes.INTEGER,
        },
        od_tenure: {
            type: DataTypes.INTEGER,
        },
        // Derived from expiry vs today: "running" while active, "completed" once expired.
        status: {
            type: DataTypes.STRING,
        },
        NomineeDob: {
            type: DataTypes.STRING,
        },
        Vendor: {
            type: DataTypes.STRING,
        },
        IDV: {
            type: DataTypes.STRING,
        },
        isNomineeFlag: {
            type: DataTypes.STRING,
        },
        NCB: {
            type: DataTypes.STRING,
        },
        NomineeAge: {
            type: DataTypes.STRING,
        },
        CurrentPolicyFile: {
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
    }, {
        tableName: 'runningpolicies_vehicle',
    })
    return runningpolicies_vehicle;
};
