module.exports = (sequelize, Sequelize) => {
    const MediclaimProductPDF = sequelize.define('mediclaimproductpdf', {
        mediclaim_pdf_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        mediclaim_product_id: {
            type: Sequelize.UUID,
            allowNull: false
        },
        pdf_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        pdf_path: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }, {
        tableName: 'mediclaimproductpdf',
    });

    return MediclaimProductPDF;
};
