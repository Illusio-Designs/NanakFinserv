/**
 * dashboard service — aggregation queries for the dashboard domain.
 */
const { Op } = require("sequelize");
const db = require("../../../app/models");

/** Sum loaned / disbursed / part-payment amounts within a date range. */
async function sumLoanAmounts(startOfDay, endOfDay) {
  const [totalDisbursedAmount, totalLoandAmount, totalPartPaymentAmount] =
    await Promise.all([
      db.loanStage.sum("disbursementAmount", {
        where: { stage: "disbursement", disbursementDate: { [Op.between]: [startOfDay, endOfDay] } },
      }),
      db.loanStage.sum("loanAmount", {
        where: { stage: "login", loanDate: { [Op.between]: [startOfDay, endOfDay] } },
      }),
      db.loanStage.sum("part_amount", {
        where: { stage: "partPayment", part_date: { [Op.between]: [startOfDay, endOfDay] } },
      }),
    ]);

  return { totalLoandAmount, totalDisbursedAmount, totalPartPaymentAmount };
}

module.exports = { sumLoanAmounts };
