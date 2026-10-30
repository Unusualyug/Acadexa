import { Link } from 'react-router-dom';
import { Phone, Sparkles, Info, Printer, Truck, Headset, ArrowRight } from 'lucide-react';
import { Reveal } from '../animations/Reveal';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { FREE_LAB_MANUAL as OFFER } from '../../lib/offers';
import { SUPPORT_PHONE, CONTACT_LINKS } from '../../lib/contact';
import { cn } from '../../lib/utils';
import { useI18n } from '../../i18n/I18nContext';

/**
 * "Contact & bulk printing" information, shown wherever the free lab manual
 * offer appears.
 *
 * The job of this block is to remove two ambiguities that cost enquiries:
 *   1. what exactly is free (manual *creation*, only with a print & bind job)
 *      versus what is always paid (printing, binding, delivery, consultancy);
 *   2. how to reach a human for the things the website cannot quote — a
 *      consultancy brief, or a bulk print run with doorstep delivery.
 *
 * Each card states its own charging rule and the two paid offers carry a
 * "Charged" chip, so the free card cannot be read as covering them. The number
 * is a real `tel:` link and a `wa.me` deep link with a pre-filled message, both
 * on the number itself and on the buttons, so it works from a keypad and from
 * WhatsApp alike.
 */
export function ContactPrintingInfo({ className, delay = 0, headingLevel: Heading = 'h2' }) {
  const { t } = useI18n();

  const cards = [
    {
      key: 'creation',
      icon: Sparkles,
      chip: t('common.free'),
      chipClass: 'bg-forest text-white',
      title: t('contactBlock.free.title'),
      body: t('contactBlock.free.body'),
      condition: t('contactBlock.free.condition'),
      cta: { label: t('contactBlock.free.cta'), to: OFFER.primaryCta.to, tone: 'soft' },
      footnote: { icon: Printer, text: t('contactBlock.free.footnote') },
    },
    {
      key: 'consultancy',
      icon: Headset,
      chip: t('common.charged'),
      chipClass: 'bg-white text-forest ring-1 ring-forest/25',
      title: t('contactBlock.consultancy.title'),
      body: t('contactBlock.consultancy.body', { phone: SUPPORT_PHONE.display }),
      condition: t('contactBlock.consultancy.condition'),
      cta: { label: t('contactBlock.consultancy.cta'), href: CONTACT_LINKS.consultancy, tone: 'forest', whatsapp: true },
    },
    {
      key: 'bulk',
      icon: Truck,
      chip: t('common.charged'),
      chipClass: 'bg-white text-forest ring-1 ring-forest/25',
      title: t('contactBlock.bulk.title'),
      body: t('contactBlock.bulk.body'),
      condition: t('contactBlock.bulk.condition', { phone: SUPPORT_PHONE.display }),
      cta: { label: t('contactBlock.bulk.cta'), href: CONTACT_LINKS.bulkPrinting, tone: 'forest', whatsapp: true },
    },
  ];

  return (
    <Reveal
      delay={delay}
      as="section"
      aria-labelledby="contact-printing-heading"
      className={cn(
        'overflow-hidden rounded-2xl border border-emerald/25 bg-white shadow-[0_22px_50px_-34px_rgba(20,83,45,0.55)]',
        className
      )}
    >
      {/* ---------- header ---------- */}
      <div className="border-b border-line bg-mint/60 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10.5px] font-bold tracking-[0.14em] text-forest uppercase">
              {t('contactBlock.eyebrow')}
            </span>
            <Heading
              id="contact-printing-heading"
              className="mt-1 font-display text-[1.05rem] leading-snug font-extrabold text-ink sm:text-[1.2rem]"
            >
              {t('contactBlock.heading')}
            </Heading>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-forest/80">
              {t('contactBlock.intro')}
            </p>
          </div>

          <a
            href={SUPPORT_PHONE.tel}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-forest/25 bg-white px-3 py-2 text-[13px] font-bold text-ink transition-colors hover:border-forest/50 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            aria-label={t('contactBlock.callAria', { phone: SUPPORT_PHONE.display })}
          >
            <Phone className="size-4 text-forest" aria-hidden />
            <span className="tabular-nums">{SUPPORT_PHONE.display}</span>
          </a>
        </div>
      </div>

      {/* ---------- three offers ---------- */}
      <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x lg:grid-cols-3 lg:divide-y-0">
        {cards.map((c) => (
          <div key={c.key} className="flex flex-col p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-forest ring-1 ring-emerald/20">
                <c.icon className="size-4.5" aria-hidden />
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase',
                  c.chipClass
                )}
              >
                {c.chip}
              </span>
            </div>

            <h3 className="mt-3 text-[13.5px] font-bold text-ink">{c.title}</h3>
            <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-muted">{c.body}</p>

            <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-forest/80">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              <span>{c.condition}</span>
            </p>

            <div className="mt-4">
              {c.cta.to ? (
                <CtaShell tone={c.cta.tone} to={c.cta.to} label={c.cta.label} />
              ) : (
                <CtaShell tone={c.cta.tone} href={c.cta.href} label={c.cta.label} whatsapp={c.cta.whatsapp} />
              )}
            </div>

            {c.footnote && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted">
                <c.footnote.icon className="size-3 shrink-0" aria-hidden />
                {c.footnote.text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ---------- footer: both channels, always reachable ---------- */}
      <div className="flex flex-col gap-2.5 border-t border-line bg-canvas px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[11.5px] leading-relaxed text-muted">
          {t('contactBlock.footerNote')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={CONTACT_LINKS.general}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-[11.5px] font-bold text-[#07301a] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:px-2.5 sm:py-1.5"
            aria-label={t('contactBlock.whatsappAria', { phone: SUPPORT_PHONE.display })}
          >
            <WhatsAppIcon className="size-3.5" />
            {t('contactBlock.whatsappBtn', { phone: SUPPORT_PHONE.display })}
          </a>
          <a
            href={SUPPORT_PHONE.tel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[11.5px] font-semibold text-ink transition-colors hover:border-forest/40 hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:px-2.5 sm:py-1.5"
            aria-label={t('contactBlock.callAria', { phone: SUPPORT_PHONE.display })}
          >
            <Phone className="size-3.5 text-forest" aria-hidden />
            {t('contactBlock.callBtn')}
          </a>
        </div>
      </div>
    </Reveal>
  );
}

/* Shared look for the three call-to-action buttons. `forest` is the paid,
   human-channel action; `soft` keeps the free offer visibly calmer. */
const ctaTones = {
  forest:
    'bg-forest text-white hover:bg-forest-700 shadow-[0_8px_20px_-12px_rgba(20,83,45,0.75)]',
  soft: 'bg-mint text-forest ring-1 ring-emerald/30 hover:bg-emerald/15',
};

function CtaShell({ tone = 'forest', to, href, label, whatsapp }) {
  const classes = cn(
    'inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold transition-colors sm:w-auto sm:py-2',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
    ctaTones[tone] || ctaTones.forest
  );
  const inner = (
    <>
      {whatsapp && <WhatsAppIcon className="size-3.5" />}
      {label}
      <ArrowRight className="size-3.5" aria-hidden />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {inner}
    </a>
  );
}

export default ContactPrintingInfo;
