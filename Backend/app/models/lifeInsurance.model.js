const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const LifeInsurance = sequelize.define('lifeInsurance', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        // Agent Details
        agent_code: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        agent_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        channel: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        channel_code: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        
        // Policy Numbers
        proposer_number: {
            type: DataTypes.STRING(50),
            allowNull: false
            // unique: true - temporarily disabled to avoid "too many keys" error
        },
        policy_numbers: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        
        // Proposer Details
        proposer_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        proposer_gender: {
            type: DataTypes.ENUM('Male', 'Female', 'Other'),
            allowNull: false
        },
        proposer_gender_custom: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        proposer_dob: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        proposer_married_status: {
            type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
            allowNull: false
        },
        proposer_father_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        proposer_mother_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        proposer_spouse_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        proposer_mobile_numbers: {
            type: DataTypes.STRING(20), // Single mobile number
            allowNull: false
        },
        proposer_email: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        proposer_nationality: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'Indian'
        },
        proposer_relationship_with_life_assured: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        proposer_residential_status: {
            type: DataTypes.ENUM('Resident', 'Non-Resident', 'Resident but Not Ordinarily Resident'),
            allowNull: false
        },
        proposer_pan_number: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        proposer_mailing_address: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        proposer_permanent_address: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        
        // Life Assured Details
        life_assured_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        life_assured_gender: {
            type: DataTypes.ENUM('Male', 'Female', 'Other'),
            allowNull: false
        },
        life_assured_gender_custom: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        life_assured_dob: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        life_assured_married_status: {
            type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
            allowNull: false
        },
        life_assured_father_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        life_assured_mother_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        life_assured_spouse_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        life_assured_mobile_numbers: {
            type: DataTypes.STRING(20), // Single mobile number
            allowNull: false
        },
        life_assured_email: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        life_assured_nationality: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'Indian'
        },
        life_assured_relationship_with_proposer: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        life_assured_residential_status: {
            type: DataTypes.ENUM('Resident', 'Non-Resident', 'Resident but Not Ordinarily Resident'),
            allowNull: false
        },
        life_assured_pan_number: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        life_assured_mailing_address: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        life_assured_permanent_address: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        life_assured_education: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        life_assured_occupation: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        life_assured_organization_name: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        life_assured_annual_income: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true
        },
        
        // Nominee Details
        nominee_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        nominee_mobile_numbers: {
            type: DataTypes.STRING(20), // Single mobile number
            allowNull: true
        },
        nominee_email: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        nominee_dob: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        nominee_pan_number: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        nominee_relationship_with_life_assured: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        nominee_gender: {
            type: DataTypes.ENUM('Male', 'Female', 'Other'),
            allowNull: false
        },
        
        // Product Details
        product_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        premium_payment_term: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        sum_assured: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        policy_term: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        
        // Health Details
        height: {
            type: DataTypes.DECIMAL(5, 2), // in cm
            allowNull: true
        },
        weight: {
            type: DataTypes.DECIMAL(5, 2), // in kg
            allowNull: true
        },
        tobacco_consumption: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'No'
        },
        tobacco_quantity: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        tobacco_days: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        alcohol_consumption: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'No'
        },
        alcohol_quantity: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        alcohol_days: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        narcotics_consumption: {
            type: DataTypes.STRING(10),
            allowNull: false,
            defaultValue: 'No'
        },
        narcotics_quantity: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        narcotics_days: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        health_remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        
        // Bank Details
        account_type: {
            type: DataTypes.ENUM('Savings', 'Current', 'Fixed Deposit', 'Recurring Deposit'),
            allowNull: false
        },
        bank_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        branch: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        account_number: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        micr_code: {
            type: DataTypes.STRING(9),
            allowNull: true
        },
        preferred_renewal_month: {
            type: DataTypes.ENUM('January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'),
            allowNull: true
        },
        
        // Policy Details
        policy_number: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        rcd: { // Risk Commencement Date
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        premium_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false
        },
        premium_payment_mode: {
            type: DataTypes.ENUM('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Single'),
            allowNull: false
        },
        policy_remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        policy_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true
        },
        date_of_maturity: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        due_date_of_premium: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        
        // User reference for integration
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'user',
                key: 'user_id'
            }
        },
        
        // Consumer reference for integration with consumer role mapping
        user_consumer_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'user',
                key: 'user_id'
            }
        },
        
        // Status and tracking
        status: {
            type: DataTypes.ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Active', 'Lapsed'),
            allowNull: false,
            defaultValue: 'Draft'
        },
        
        // Audit fields
        created_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'user',
                key: 'user_id'
            }
        },
        updated_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'user',
                key: 'user_id'
            }
        }
    }, {
        tableName: 'life_insurance',
        timestamps: true
    });

    return LifeInsurance;
};
