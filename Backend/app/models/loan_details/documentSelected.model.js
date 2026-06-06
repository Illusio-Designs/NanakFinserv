module.exports = (sequelize, Sequelize) => {
    const DocumentSelected = sequelize.define('documentSelected', {
        document_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.UUID,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        updated_by: {
            type: Sequelize.UUID,
        },
        loan_type: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        loan_type_name: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
        remarks_docs: {
            type: Sequelize.STRING(100),
            allowNull: true
        },
    }, {
        tableName: 'documentselectedloan',
    });

    return DocumentSelected;
};
