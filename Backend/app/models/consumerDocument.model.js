module.exports = (sequelize, Sequelize) => {
    // Consumer-level documents (KYC: Aadhar / PAN / GST ...). Stored ONCE per
    // consumer and reused across all verticals — vehicle/loan/mediclaim/life
    // policies reference these instead of re-uploading. One row per
    // (user_id, categoryId); a re-upload replaces the file.
    const ConsumerDocument = sequelize.define('consumer_document', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        user_id: {
            type: Sequelize.UUID,
            allowNull: false,
        },
        categoryId: {
            type: Sequelize.UUID,
            allowNull: false,
        },
        file: {
            type: Sequelize.STRING,
        },
    }, {
        tableName: 'consumer_document',
    });

    return ConsumerDocument;
};
