const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const vehicleuser = sequelize.define('vehicleuser', {
        vehicle_user_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        vehicle_policy_type: {
            type: DataTypes.STRING,
        },
        nominee_type: {
            type: DataTypes.STRING,
        },
        company_name: {
            type: DataTypes.STRING,
        },
        user_id: {
            type: DataTypes.INTEGER,
        },
        contact_person_name: {
            type: DataTypes.STRING,
        },
        remark:{
            type: DataTypes.STRING,
        },
        contact_person_no: {
            type: DataTypes.STRING,
        },
        vehicle_number: {
            type: DataTypes.STRING,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Vehicle number is required'
                }
            }
        },
        vehicle_id: {
            type: DataTypes.INTEGER,
        },
        reference_id: {
            type: DataTypes.INTEGER,
        },
        make: {
            type: DataTypes.STRING,
        },
        model: {
            type: DataTypes.STRING,
        },
        manufacturing_year: {
            type: DataTypes.STRING,
        },
        engine_number: {
            type: DataTypes.STRING,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
            allowNull: true,
        },
        chassis_number: {
            type: DataTypes.STRING,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
            allowNull: true,
        },
        consumer_role_id: {
            type: DataTypes.INTEGER,
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
        status: {
            type: DataTypes.STRING,
            defaultValue: "interested",
        },
        vehicle_type: {
            type: DataTypes.STRING,
        },
        vendor: {
            type: DataTypes.STRING,
        },
        policy_plan_type: {
            type: DataTypes.STRING,
        },
    }, {
        tableName: 'vehicleuser',
        // timestamps: true,
    });

    return vehicleuser;
};
