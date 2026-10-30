import { ORDER_TRANSITIONS, ORDER_STATUS } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';

export const TERMINAL_STATUSES = [ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED];

export function assertTransition(from, to) {
  const allowed = ORDER_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw ApiError.badRequest(`Status change from "${from}" to "${to}" is not permitted.`);
  }
}

export function pushActivity(order, { status, action, note, actor, actorRole, visibility = 'student' }) {
  order.activity.push({ status, action, note, actor, actorRole, visibility });
}
