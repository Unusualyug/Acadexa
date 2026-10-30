export const ROLES = { STUDENT: 'student', CONSULTANT: 'consultant', SUPPORT: 'support', ADMIN: 'admin', OWNER: 'owner' };
export const STAFF_ROLES = [ROLES.CONSULTANT, ROLES.SUPPORT, ROLES.ADMIN, ROLES.OWNER];
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.OWNER];

export const ORDER_STATUS = {
  PENDING_REVIEW: 'Pending Review',
  MORE_INFO: 'More Information Required',
  REJECTED: 'Rejected',
  QUOTATION_SENT: 'Quotation Sent',
  AWAITING_PAYMENT: 'Awaiting Payment',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  AWAITING_INFO: 'Awaiting Student Information',
  READY_FOR_REVIEW: 'Ready for Review',
  DELIVERED: 'Delivered',
  REVISION_REQUESTED: 'Revision Requested',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUND_PENDING: 'Refund Pending',
  REFUNDED: 'Refunded',
};

export const ORDER_STATUSES = Object.values(ORDER_STATUS);

// Allowed server-side status transitions. Not every order passes every stage.
export const ORDER_TRANSITIONS = {
  [ORDER_STATUS.PENDING_REVIEW]: [ORDER_STATUS.MORE_INFO, ORDER_STATUS.QUOTATION_SENT, ORDER_STATUS.REJECTED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.MORE_INFO]: [ORDER_STATUS.PENDING_REVIEW, ORDER_STATUS.QUOTATION_SENT, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.QUOTATION_SENT]: [ORDER_STATUS.AWAITING_PAYMENT, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.AWAITING_PAYMENT]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUND_PENDING],
  [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.AWAITING_INFO, ORDER_STATUS.READY_FOR_REVIEW, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.AWAITING_INFO]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY_FOR_REVIEW]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.IN_PROGRESS],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.REVISION_REQUESTED, ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.REVISION_REQUESTED]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.REFUND_PENDING],
  [ORDER_STATUS.REFUND_PENDING]: [ORDER_STATUS.REFUNDED, ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.REJECTED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.REFUNDED]: [],
};

export const FILE_PURPOSES = ['reference', 'deliverable', 'revision-reference', 'message-attachment', 'service-illustration'];
export const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'application/zip',
];
export const TICKET_STATUSES = ['Open', 'In Progress', 'Awaiting Student', 'Resolved', 'Closed'];
export const PRIVACY_REQUEST_TYPES = ['access', 'correction', 'deletion', 'export'];
