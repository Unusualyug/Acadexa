/**
 * Phone number rules shared by registration and profile updates.
 *
 * Accepts Indian mobile numbers in the forms people actually type:
 *   9876543210 · 09876543210 · +91 98765 43210 · +91-98765-43210
 * and international numbers with a country code.
 *
 * Stored in a single normalised form (+919876543210) so `tel:` links and
 * deduplication work, while the original spacing is not preserved.
 */

const STRIP = /[\s().-]/g;

/** Returns the normalised number, or null when it is not acceptable. */
export function normalisePhone(input) {
  if (typeof input !== 'string') return null;
  const raw = input.replace(STRIP, '').trim();
  if (!raw) return null;

  // +CC... (international)
  if (raw.startsWith('+')) {
    const digits = raw.slice(1);
    if (!/^\d{8,15}$/.test(digits)) return null;
    if (digits.startsWith('0')) return null; // country codes never start with 0
    return `+${digits}`;
  }

  // Local Indian mobile: 10 digits starting 6-9, optionally with a leading 0.
  const local = raw.startsWith('0') ? raw.slice(1) : raw;
  if (/^[6-9]\d{9}$/.test(local)) return `+91${local}`;

  // Anything else of plausible international length without a plus.
  if (/^\d{11,15}$/.test(raw)) return `+${raw}`;

  return null;
}

export const phoneSchema = (label = 'mobile number') => ({
  parse: (v) => v,
  validate: (v) => normalisePhone(v) !== null,
  message: `Enter a valid ${label} — 10 digits, or include your country code`,
});

/** Human-readable form for emails, receipts and the admin UI. */
export function formatPhone(value) {
  if (!value) return '';
  const n = normalisePhone(value);
  if (!n) return value;
  if (n.startsWith('+91') && n.length === 13) {
    const d = n.slice(3);
    return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  }
  return n;
}
