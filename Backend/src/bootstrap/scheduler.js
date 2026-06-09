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
    const exp = rp.od_expiry_date || rp.ExpiryDate || rp.PolicyTo;
    const dleft = daysTo(exp);
    if (dleft === null) continue;
    // Remind only at these offsets to avoid daily spam.
    if (![7, 3, 1, 0].includes(dleft)) continue;
    try {
      const veh = await db.vehicleUser.findOne({ where: { vehicle_user_id: rp.vehicle_user_id }, raw: true });
      if (!veh) continue;
      await db.notification.create({
        title: dleft <= 0 ? "Vehicle policy expires today" : `Vehicle policy due in ${dleft} day(s)`,
        message: `${veh.vehicle_number || "Vehicle"} — renew before ${exp}`,
        type: "vehicle",
        category: "renewal_due",
        user_id: null,
        target_user_id: veh.user_id || null,
        is_read: false,
      });
      sent++;
    } catch (e) { logger.error({ err: e }, "renewal reminder failed"); }
  }
  return sent;
}

async function runDaily() {
  try {
    const refreshed = await runStatusRefresh();
    const reminders = await runRenewalReminders();
    logger.info({ refreshed, reminders }, "daily scheduler complete");
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
