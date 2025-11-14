module.exports = (sequelize, Sequelize) => {
    const MediclaimProductPDF = sequelize.define('mediclaimproductpdf', {
        mediclaim_pdf_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        mediclaim_product_id: {
            type: Sequelize.INTEGER,
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
