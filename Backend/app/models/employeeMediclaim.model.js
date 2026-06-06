const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const EmployeeMediclaim = sequelize.define('employeeMediclaim', {
        employee_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        mediclaim_id: {
            type: DataTypes.UUID,
        },
        EmployeeName: {
            type: DataTypes.STRING,
        },
        Gender: {
            type: DataTypes.STRING,
        },
        Age: {
            type: DataTypes.INTEGER,
        },
        DateOfBirth: {
            type: DataTypes.STRING,
        },
        RelationshipWithPolicyHolder: {
            type: DataTypes.STRING,
        },
        DateOfJoining: {
            type: DataTypes.STRING,
        },
        PreExistingIllness: {
            type: DataTypes.STRING,
        }
    }, {
        tableName: 'employeeMediclaim',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return EmployeeMediclaim;
}; 