const { DataTypes } = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const notification = sequelize.define('notification', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: Sequelize.UUIDV4,},
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('vehicle', 'mediclaim', 'loan', 'builder', 'system'),
            allowNull: false
        },
        category: {
            type: DataTypes.ENUM('user_added', 'user_updated', 'user_deleted', 'policy_created', 'policy_updated', 'system_alert'),
            allowNull: false
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'ID of the user who performed the action'
        },
        target_user_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'ID of the user who was added/updated (for user notifications)'
        },
        record_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'ID of the record (vehicle_user_id, mediclaim_id, etc.)'
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_important: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional data like user details, policy details, etc.'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'notifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    
    return notification;
};
