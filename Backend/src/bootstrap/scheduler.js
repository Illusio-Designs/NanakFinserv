/**
 * Lightweight in-process scheduler (no external cron):
 *  - daily status refresh: re-run vehicle policy reconcile so Running/Closed stay
 *    accurate even with no writes;
 *  - renewal-due reminders: notify the consumer at 7/3/1/0 days before a vehicle
 *    policy's expiry (OD/Full first, else generic expiry).
 * Started from server.js after boot.
 */
const db = require("../../app/models");
const vehicleService = require("../modules/vehicle/vehicle.service");
const logger = require("../config/logger");

const DAY = 86400000;

function daysTo(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / DAY);
}

async function runStatusRefresh() {
  const ids = (await db.vehicleUser.findAll({ attributes: ["vehicle_user_id"], raw: true })).map((v) => v.vehicle_user_id);
  for (const id of ids) {
    try { await vehicleService.reconcileVehiclePolicies(id); } catch (e) { logger.error({ err: e, id }, "reconcile (scheduler) failed"); }
  }
  return ids.length;
}

async function runRenewalReminders() {
  const running = await db.vehcileRunningPolicy.findAll({ raw: true });
  let sent = 0;
  for (const rp of running) {
    // OD/Full (the yearly renewal) and TP (long-term) expire on different dates —
    // remind on each independently so a valid long-term TP doesn't hide a due OD.
    const parts = [
      { kind: "OD/Full cover", exp: rp.od_expiry_date || rp.ExpiryDate || rp.PolicyTo },
      { kind: "TP cover", exp: rp.tp_expiry_date },
    ];
    let veh = null;
    for (const part of parts) {
      const dleft = daysTo(part.exp);
      if (dleft === null || ![7, 3, 1, 0].includes(dleft)) continue;
      try {
        if (!veh) veh = await db.vehicleUser.findOne({ where: { vehicle_user_id: rp.vehicle_user_id }, raw: true });
        if (!veh) break;
        await db.notification.create({
          title: dleft <= 0 ? `Vehicle ${part.kind} expires today` : `Vehicle ${part.kind} due in ${dleft} day(s)`,
          message: `${veh.vehicle_number || "Vehicle"} — renew before ${part.exp}`,
          type: "vehicle",
          category: "renewal_due",
          user_id: null,
          target_user_id: veh.user_id || null,
          is_read: false,
        });
        sent++;
      } catch (e) { logger.error({ err: e }, "renewal reminder failed"); }
    }
  }
  return sent;
}

// Mediclaim policy renewal reminders (ExpiryDate on the running policy).
async function runMediclaimReminders() {
  let sent = 0;
  const running = await db.runningPolicyMediclaim.findAll({ raw: true });
  for (const rp of running) {
    const dleft = daysTo(rp.ExpiryDate || rp.PolicyTo);
    if (dleft === null || ![7, 3, 1, 0].includes(dleft)) continue;
    try {
      const mu = await db.medicliamuser.findByPk(rp.mediclaim_id, { raw: true });
      if (!mu) continue;
      await db.notification.create({
        title: dleft <= 0 ? "Mediclaim policy expires today" : `Mediclaim policy due in ${dleft} day(s)`,
        message: "Mediclaim renewal due",
        type: "mediclaim", category: "renewal_due",
        user_id: null, target_user_id: mu.user_id || null, is_read: false,
      });
      sent++;
    } catch (e) { logger.error({ err: e }, "mediclaim reminder failed"); }
  }
  return sent;
}

// Life insurance premium-due reminders (due_date_of_premium).
async function runLifeReminders() {
  let sent = 0;
  const policies = await db.lifeInsurance.findAll({ raw: true });
  for (const p of policies) {
    const dleft = daysTo(p.due_date_of_premium);
    if (dleft === null || ![7, 3, 1, 0].includes(dleft)) continue;
    try {
      await db.notification.create({
        title: dleft <= 0 ? "Life premium due today" : `Life premium due in ${dleft} day(s)`,
        message: `${p.proposer_name || "Policy"} — premium due`,
        type: "life_insurance", category: "renewal_due",
        user_id: null, target_user_id: p.user_id || null, is_read: false,
      });
      sent++;
    } catch (e) { logger.error({ err: e }, "life reminder failed"); }
  }
  return sent;
}

async function runDaily() {
  try {
    const refreshed = await runStatusRefresh();
    const reminders = await runRenewalReminders();
    let medi = 0, life = 0;
    try { medi = await runMediclaimReminders(); } catch (e) { logger.error({ err: e }, "mediclaim reminders failed"); }
    try { life = await runLifeReminders(); } catch (e) { logger.error({ err: e }, "life reminders failed"); }
    logger.info({ refreshed, reminders, medi, life }, "daily scheduler complete");
  } catch (e) {
    logger.error({ err: e }, "daily scheduler failed");
  }
}

function startScheduler() {
  // run shortly after boot, then once a day
  setTimeout(runDaily, 60 * 1000).unref?.();
  setInterval(runDaily, 24 * 60 * 60 * 1000).unref?.();
  logger.info("Scheduler started (daily status refresh + renewal reminders)");
}

module.exports = { startScheduler, runDaily };
