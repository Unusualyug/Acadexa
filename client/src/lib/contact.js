/**
 * Acadexa's public contact number, written once and reused everywhere.
 *
 * The same number answers consultancy questions and bulk-printing / delivery
 * enquiries, so it lives in one place: changing it here updates every call
 * button, WhatsApp link and footer label that imports it. The number is not
 * read from settings because the marketing copy quoting it must never drift
 * from the number that actually rings.
 */
export const SUPPORT_PHONE = {
  /** Shown to people: grouped the way it is dialled locally. */
  display: '+91 98257 51614',
  /** Bare ten digits, for tight spaces and aria labels. */
  compact: '9825751614',
  /** Click-to-call target: country code, no spaces or symbols. */
  tel: 'tel:+919825751614',
  /** wa.me expects country code + number without a leading plus. */
  waNumber: '919825751614',
};

/** Builds a wa.me deep link with a pre-filled first message. */
export function whatsappLink(message) {
  return `https://wa.me/${SUPPORT_PHONE.waNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Pre-filled WhatsApp messages, one per intent, so a message that arrives
 * already says what it is about and can be routed without a back-and-forth.
 */
export const CONTACT_LINKS = {
  consultancy: whatsappLink(
    'Hello Acadexa, I would like to enquire about consultancy services. Please share the details.'
  ),
  bulkPrinting: whatsappLink(
    'Hello Acadexa, I would like to enquire about bulk printing and doorstep delivery. Please share pricing, delivery details and timelines.'
  ),
  labManual: whatsappLink(
    'Hello Acadexa, I would like to know more about free lab manual creation with printing and binding.'
  ),
  general: whatsappLink('Hello Acadexa, I have a question about your services.'),
};
