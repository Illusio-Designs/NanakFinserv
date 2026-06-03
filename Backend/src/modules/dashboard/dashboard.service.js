/**
 * dashboard service — aggregation queries for the dashboard domain.
 */
const { Op } = require("sequelize");
const db = require("../../../app/models");

/** Sum loaned / disbursed / part-payment amounts within a date range. */
async function sumLoanAmounts(startOfDay, endOfDay) {
  const [totalDisbursedAmount, totalLoandAmount, totalPartPaymentAmount] =
    await Promise.all([
      db.disbursementLoan.sum("disbursementAmount", {
        where: { disbursementDate: { [Op.between]: [startOfDay, endOfDay] } },
      }),
      db.loginLoan.sum("loanAmount", {
        where: { loanDate: { [Op.between]: [startOfDay, endOfDay] } },
      }),
      db.partPaymentLoan.sum("part_amount", {
        where: { part_date: { [Op.between]: [startOfDay, endOfDay] } },
      }),
    ]);

  return { totalLoandAmount, totalDisbursedAmount, totalPartPaymentAmount };
}

module.exports = { sumLoanAmounts };
