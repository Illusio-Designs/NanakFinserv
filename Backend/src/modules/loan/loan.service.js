/**
 * loan service — data-access for the loan domain.
 * (Incremental extraction: the status-update write path lives here now; the
 * large list/detail queries still live in the controller.)
 */
const db = require("../../../app/models");

const LoanUser = db.loanUser;
const LoanStage = db.loanStage;

// ── Unified loan-stage helpers (merge of the 10 per-stage tables) ─────────────
/** Upsert a single-instance stage row (one per stage-type per loan). */
async function upsertLoanStage(laonId, stage, data, opts = {}) {
  const { transaction, actorId } = opts;
  const clean = {};
  for (const [k, v] of Object.entries(data || {})) if (v !== undefined) clean[k] = v;
  const existing = await LoanStage.findOne({ where: { laon_id: laonId, stage }, transaction });
  if (existing) {
    await LoanStage.update({ ...clean, updated_by: actorId || null }, { where: { stage_id: existing.stage_id }, transaction });
    return existing.stage_id;
  }
  const created = await LoanStage.create({ ...clean, laon_id: laonId, stage, created_by: actorId || null, updated_by: actorId || null }, { transaction });
  return created.stage_id;
}

/** Replace all part-payment rows for a loan. */
async function setPartPayments(laonId, parts, opts = {}) {
  const { transaction, actorId } = opts;
  await LoanStage.destroy({ where: { laon_id: laonId, stage: "partPayment" }, transaction });
  if (Array.isArray(parts) && parts.length) {
    await LoanStage.bulkCreate(
      parts.map((p, i) => ({
        laon_id: laonId, stage: "partPayment",
        part_number: p.part_number != null ? p.part_number : i + 1,
        part_amount: p.part_amount, part_date: p.part_date,
        created_by: actorId || null, updated_by: actorId || null,
      })),
      { transaction }
    );
  }
}

/** Group a loan's `stages` array into named single stages + a partPayments[] list. */
function groupStages(stages = []) {
  const g = { partPayments: [] };
  for (const s of stages) {
    const plain = s.get ? s.get({ plain: true }) : s;
    if (plain.stage === "partPayment") g.partPayments.push(plain);
    else g[plain.stage] = plain;
  }
  return g;
}

/**
 * Update a consumer's loan status.
 * @returns {Promise<object|null>} the updated row, or null if nothing matched.
 */
async function updateLoanStatus({ userConsumerId, laonId, status, remarks, actorId }) {
  const where = { user_id: userConsumerId };
  if (laonId) where.laon_id = laonId;

  const updateData = {
    status,
    role_id: actorId,
    remarks: status === "notInterested" ? remarks : null,
  };

  const [updated] = await LoanUser.update(updateData, { where });
  if (!updated) return null;

  return LoanUser.findOne({ where });
}

module.exports = { updateLoanStatus, upsertLoanStage, setPartPayments, groupStages };
