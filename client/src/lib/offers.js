/**
 * The Acadexa USP, written once and reused everywhere it is claimed.
 *
 * The condition is not decoration: lab manual *creation* is free only when the
 * same manual is printed and bound through Acadexa. Printing and binding are
 * always charged at actual cost. Any screen that mentions the offer imports
 * this object, so the wording cannot drift between pages.
 */
export const FREE_LAB_MANUAL = {
  badge: 'Free lab manual creation',
  headline: 'Your Lab Manual, Created Free!',
  supporting:
    'Get your lab manual created at no extra cost when you print and bind it through Acadexa.',
  condition:
    'Free creation applies only when you print and bind the same manual through Acadexa. Printing, binding and delivery are charged at actual cost — they are never free.',
  shortCondition: 'Free creation with a print & bind order. Printing and binding are charged separately.',
  primaryCta: { label: 'Create Your Lab Manual', to: '/services/practical-lab-manual-support' },
  secondaryCta: { label: 'Explore Printing Services', to: '/services/printing-binding' },
  /* Short line for compact placements. */
  oneLiner: 'Lab manual creation free when you print and bind with Acadexa.',
};
