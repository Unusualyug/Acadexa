export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const money = (amount, currency = 'INR') => {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString('en-IN')}`;
  }
};

export const formatDate = (value, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
  value ? new Date(value).toLocaleDateString('en-IN', opts) : '—';

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const relativeTime = (value) => {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return mins <= 0 ? 'just now' : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days} d ago`;
  return formatDate(value);
};

export const daysUntil = (date) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

export const fileSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const STATUS_STYLES = {
  'Pending Review': 'bg-amber/15 text-[#8a6a12] border-amber/30',
  'More Information Required': 'bg-orange-50 text-orange-700 border-orange-200',
  Rejected: 'bg-red-50 text-danger border-red-200',
  'Quotation Sent': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Awaiting Payment': 'bg-amber/15 text-[#8a6a12] border-amber/30',
  Confirmed: 'bg-mint text-forest border-emerald/30',
  'In Progress': 'bg-emerald/10 text-emerald-800 border-emerald/30',
  'Awaiting Student Information': 'bg-orange-50 text-orange-700 border-orange-200',
  'Ready for Review': 'bg-sky-50 text-sky-700 border-sky-200',
  Delivered: 'bg-emerald/15 text-forest border-emerald/40',
  'Revision Requested': 'bg-purple-50 text-purple-700 border-purple-200',
  Completed: 'bg-forest text-white border-forest',
  Cancelled: 'bg-slate-100 text-muted border-line',
  'Refund Pending': 'bg-amber/15 text-[#8a6a12] border-amber/30',
  Refunded: 'bg-slate-100 text-muted border-line',
  Paid: 'bg-emerald/15 text-forest border-emerald/30',
  Pending: 'bg-amber/15 text-[#8a6a12] border-amber/30',
  Verified: 'bg-emerald/15 text-forest border-emerald/30',
  Failed: 'bg-red-50 text-danger border-red-200',
  Sent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Accepted: 'bg-mint text-forest border-emerald/30',
  Expired: 'bg-slate-100 text-muted border-line',
  Superseded: 'bg-slate-100 text-muted border-line',
  Open: 'bg-sky-50 text-sky-700 border-sky-200',
  Resolved: 'bg-mint text-forest border-emerald/30',
  Closed: 'bg-slate-100 text-muted border-line',
  'Awaiting Student': 'bg-amber/15 text-[#8a6a12] border-amber/30',
  Requested: 'bg-amber/15 text-[#8a6a12] border-amber/30',
  Received: 'bg-sky-50 text-sky-700 border-sky-200',
  'In Review': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const statusStyle = (status) => STATUS_STYLES[status] || 'bg-slate-100 text-muted border-line';

export const ORDER_FILTERS = [
  'All Orders', 'Pending Review', 'Quotation Sent', 'Awaiting Payment', 'In Progress',
  'Delivered', 'Revision Requested', 'Completed', 'Cancelled',
];

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || 'SD';

/** Normalises a phone number to +CC... for tel: links; returns '' if unusable. */
export const telHref = (value = '') => {
  const digits = String(value).replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.length > 7 ? digits : '';
  const local = digits.replace(/^0/, '');
  if (/^[6-9]\d{9}$/.test(local)) return `+91${local}`;
  return digits.length >= 8 ? `+${digits}` : '';
};

/** Human-readable phone display, e.g. +91 98765 43210. */
export const formatPhone = (value = '') => {
  if (!value) return '';
  const e164 = telHref(value);
  if (!e164) return value;
  if (e164.startsWith('+91') && e164.length === 13) {
    const d = e164.slice(3);
    return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  }
  return e164;
};
