const { DataTypes } = require("sequelize");

/**
 * Unified loan-stage table — replaces the 10 per-stage tables (login, sanction,
 * disbursement, partPayment, query, cancel, documentSelected, property). One row
 * per stage entry, keyed by laon_id, tagged with `stage`; `is_current` marks the
 * active stage, the rest are history. Mirrors the vehicle/mediclaim merge.
 */
module.exports = (sequelize, Sequelize) => {
  const loanStage = sequelize.define("loan_stage", {
    stage_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    laon_id: { type: DataTypes.UUID },
    stage: { type: DataTypes.STRING },        // login | sanction | disbursement | partPayment | query | cancel | documentSelected | property
    is_current: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.UUID },
    updated_by: { type: DataTypes.UUID },

    // login
    loanAmount: { type: DataTypes.STRING(100) },
    loanDate: { type: DataTypes.STRING },
    loanAccountNumber: { type: DataTypes.STRING },
    bankName: { type: DataTypes.STRING },
    product: { type: DataTypes.STRING },
    smName: { type: DataTypes.STRING },
    amName: { type: DataTypes.STRING },
    remarks_loan: { type: DataTypes.TEXT },
    bankCode: { type: DataTypes.STRING },
    dateOfBirth: { type: DataTypes.STRING },
    code_id: { type: DataTypes.UUID },

    // sanction
    amount: { type: DataTypes.STRING(100) },
    rate: { type: DataTypes.STRING(100) },
    tenure: { type: DataTypes.STRING },
    sanctionDate: { type: DataTypes.STRING },

    // disbursement
    disbursementAmount: { type: DataTypes.STRING(100) },
    disbursementRate: { type: DataTypes.STRING },
    insurance: { type: DataTypes.STRING },
    fileNumber: { type: DataTypes.STRING },
    disbursementDate: { type: DataTypes.STRING },
    remark_dis: { type: DataTypes.TEXT },
    insuranceBankName: { type: DataTypes.STRING },
    insuranceAmount: { type: DataTypes.STRING(100) },
    insuranceType: { type: DataTypes.STRING },

    // partPayment
    part_number: { type: DataTypes.INTEGER },
    part_amount: { type: DataTypes.FLOAT },
    part_date: { type: DataTypes.STRING },

    // documentSelected
    loan_type: { type: DataTypes.STRING },
    loan_type_name: { type: DataTypes.STRING },
    remarks_docs: { type: DataTypes.TEXT },

    // property (non-builder)
    address: { type: DataTypes.TEXT },
    sqFeet: { type: DataTypes.STRING },
    deedAmount: { type: DataTypes.STRING },

    // query / cancel
    remarks: { type: DataTypes.TEXT },
    remarks_cancel: { type: DataTypes.TEXT },
  }, {
    tableName: "loan_stage",
    indexes: [{ fields: ["laon_id"] }, { fields: ["laon_id", "stage"] }],
  });
  return loanStage;
};
