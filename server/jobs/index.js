import { expireQuotationsJob } from '../controllers/quotation.controller.js';
import { retentionJob, orphanCleanupJob } from '../controllers/file.controller.js';
import Order from '../models/Order.js';
import { notify } from '../services/notify.js';
import { ORDER_STATUS } from '../utils/constants.js';
import { purgeExpiredSessions } from '../services/sessions.js';

async function deadlineReminders() {
  const soon = new Date(Date.now() + 48 * 3600000);
  const orders = await Order.find({
    deadline: { $lte: soon, $gte: new Date() },
    status: { $in: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.AWAITING_INFO, ORDER_STATUS.READY_FOR_REVIEW] },
  });
  for (const o of orders) {
    await notify({ recipient: o.student, type: 'deadline', title: `Deadline approaching for ${o.reference}`, body: `Agreed deadline: ${new Date(o.deadline).toDateString()}.`, link: `/dashboard/orders/${o._id}` });
  }
  return orders.length;
}

export function startJobs() {
  const run = async () => {
    try {
      await expireQuotationsJob();
      await deadlineReminders();
      await retentionJob();
      await orphanCleanupJob(); // retry any asset whose deletion failed earlier
      const purged = await purgeExpiredSessions();
      if (purged) console.log(`[jobs] purged ${purged} expired session(s)`);
    } catch (err) {
      console.error('[jobs] error', err.message);
    }
  };
  run();
  const timer = setInterval(run, 1000 * 60 * 60); // hourly
  timer.unref();
}
