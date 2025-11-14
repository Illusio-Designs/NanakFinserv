module.exports = (sequelize, Sequelize) => {
    const DocumentSelected = sequelize.define('documentSelected', {
        document_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        laon_id: {
            type: Sequelize.INTEGER,
            // unique: true, // Temporarily disabled due to MySQL 64-key limit
        },
        updated_by: {
            type: Sequelize.INTEGER,
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
