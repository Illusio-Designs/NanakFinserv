const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const LifeInsuranceDocument = sequelize.define('lifeInsuranceDocument', {
        document_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        life_insurance_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'life_insurance',
                key: 'id'
            }
        },
        document_name: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        document_type: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        original_filename: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mime_type: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        upload_status: {
            type: DataTypes.ENUM('Pending', 'Uploaded', 'Failed'),
            allowNull: false,
            defaultValue: 'Pending'
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        uploaded_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'user',
                key: 'user_id'
            }
        }
    }, {
        tableName: 'life_insurance_documents',
        timestamps: true
    });

    return LifeInsuranceDocument;
};
