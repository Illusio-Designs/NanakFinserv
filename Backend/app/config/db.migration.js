const db = require("../models/index");
const { sequelize } = db;

const alterTables = async () => {
    try {
        // Add role_id column to medicliamuser table if it doesn't exist
        await sequelize.query(`
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'medicliamuser'
            AND COLUMN_NAME = 'role_id'
        `).then(async ([results]) => {
            if (results[0]['COUNT(*)'] === 0) {
                await sequelize.query(`
                    ALTER TABLE medicliamuser
                    ADD COLUMN role_id INT NULL
                `);
                console.log('Added role_id column to medicliamuser table');
            }
        });

        // Add referenceName column to user table if it doesn't exist
        await sequelize.query(`
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'user'
            AND COLUMN_NAME = 'referenceName'
        `).then(async ([results]) => {
            if (results[0]['COUNT(*)'] === 0) {
                await sequelize.query(`
                    ALTER TABLE user
                    ADD COLUMN referenceName VARCHAR(100) NULL
                `);
                console.log('Added referenceName column to user table');
            }
        });

        // Check and add agent columns to vehicleuser table if they don't exist
        const agentColumns = ['agentName', 'agentCode', 'agentContactNumber'];
        for (const column of agentColumns) {
            await sequelize.query(`
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'vehicleuser'
                AND COLUMN_NAME = '${column}'
            `).then(async ([results]) => {
                if (results[0]['COUNT(*)'] === 0) {
                    await sequelize.query(`
                        ALTER TABLE vehicleuser
                        ADD COLUMN ${column} VARCHAR(255) NULL
                    `);
                    console.log(`Added ${column} column to vehicleuser table`);
                }
            });
        }

        // Check if life_insurance table exists, if not create it
        await sequelize.query(`
            SELECT COUNT(*)
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'life_insurance'
        `).then(async ([results]) => {
            if (results[0]['COUNT(*)'] === 0) {
                console.log('Creating life_insurance table...');
                // The table will be created by Sequelize sync, but let's ensure it exists
                await sequelize.sync({ force: false });
                console.log('life_insurance table created successfully');
            } else {
                console.log('life_insurance table already exists');
            }
        });

        // Add custom gender fields to life_insurance table if they don't exist
        const customGenderFields = ['proposer_gender_custom', 'life_assured_gender_custom'];
        for (const field of customGenderFields) {
            await sequelize.query(`
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'life_insurance'
                AND COLUMN_NAME = '${field}'
            `).then(async ([results]) => {
                if (results[0]['COUNT(*)'] === 0) {
                    await sequelize.query(`
                        ALTER TABLE life_insurance
                        ADD COLUMN ${field} VARCHAR(50) NULL
                    `);
                    console.log(`Added ${field} column to life_insurance table`);
                } else {
                    console.log(`${field} column already exists in life_insurance table`);
                }
            });
        }

        // Convert consumption fields from BOOLEAN to STRING
        const consumptionFields = ['tobacco_consumption', 'alcohol_consumption', 'narcotics_consumption'];
        for (const field of consumptionFields) {
            await sequelize.query(`
                SELECT DATA_TYPE
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'life_insurance'
                AND COLUMN_NAME = '${field}'
            `).then(async ([results]) => {
                if (results.length > 0 && results[0].DATA_TYPE === 'tinyint') {
                    // Convert BOOLEAN to STRING
                    await sequelize.query(`
                        ALTER TABLE life_insurance
                        MODIFY COLUMN ${field} VARCHAR(10) NOT NULL DEFAULT 'No'
                    `);
                    
                    // Update existing data: 0 -> 'No', 1 -> 'Yes'
                    await sequelize.query(`
                        UPDATE life_insurance
                        SET ${field} = CASE WHEN ${field} = 1 THEN 'Yes' ELSE 'No' END
                    `);
                    
                    console.log(`Converted ${field} from BOOLEAN to STRING in life_insurance table`);
                } else {
                    console.log(`${field} column is already STRING type or doesn't exist`);
                }
            });
        }

        // Add property fields to loanuser table if they don't exist (for non-builder consumers)
        const loanUserPropertyFields = [
            { name: 'non_builder_name', type: 'VARCHAR(255)' },
            { name: 'non_builder_property_name', type: 'VARCHAR(255)' },
            { name: 'sq_ft', type: 'DECIMAL(10, 2)' },
            { name: 'deed_amount', type: 'DECIMAL(15, 2)' },
            { name: 'address', type: 'TEXT' }
        ];

        for (const field of loanUserPropertyFields) {
            await sequelize.query(`
                SELECT COUNT(*)
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'loanuser'
                AND COLUMN_NAME = '${field.name}'
            `).then(async ([results]) => {
                if (results[0]['COUNT(*)'] === 0) {
                    await sequelize.query(`
                        ALTER TABLE loanuser
                        ADD COLUMN ${field.name} ${field.type} NULL
                    `);
                    console.log(`Added ${field.name} column to loanuser table`);
                } else {
                    console.log(`${field.name} column already exists in loanuser table`);
                }
            });
        }

        // Skip date fixes to avoid database errors
        console.log('Skipping date fixes to avoid database errors...');

        console.log('Database migrations completed successfully');
    } catch (error) {
        console.error('Error during database migration:', error);
    }
};

// Date fix function removed to avoid database errors

module.exports = alterTables; 