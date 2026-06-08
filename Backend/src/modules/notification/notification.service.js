/**
 * notification service — data-access for the notification domain.
 */
const db = require("../../../app/models");

/** @returns {Promise<boolean>} true if the notification existed and was updated. */
async function markAsRead(notificationId) {
  const notification = await db.notification.findByPk(notificationId);
  if (!notification) return false;
  await notification.update({ is_read: true });
  return true;
}

async function getCounts(where = {}) {
  const [total, unread] = await Promise.all([
    db.notification.count({ where }),
    db.notification.count({ where: { ...where, is_read: false } }),
  ]);
  return { total, unread };
}

module.exports = { markAsRead, getCounts };
