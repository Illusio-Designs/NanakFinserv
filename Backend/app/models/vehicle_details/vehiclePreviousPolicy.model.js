const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const previouspolicies_vehicle = sequelize.define('previouspolicies_vehicle', {
        vehicle_user_id: {
            type: DataTypes.INTEGER,
        },
        PolicyNumber: {
            type: DataTypes.STRING,
        },
        policy_type_id: {
            type: DataTypes.INTEGER,
        },
        policy_plan_id: {
            type: DataTypes.INTEGER,
        },
        company_id: {
            type: DataTypes.INTEGER,
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
        claim: {
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
        status: {
            type: DataTypes.STRING
        },
        agentName: {
            type: DataTypes.STRING,
        },
        agentCode: {
            type: DataTypes.STRING,
        },
        agentContactNumber: {
            type: DataTypes.STRING,
        }
    }, {
        tableName: 'previouspolicies_vehicle',
    })
    return previouspolicies_vehicle;
};
