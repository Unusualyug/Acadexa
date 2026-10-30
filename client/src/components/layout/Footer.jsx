import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useSettings } from '../../hooks/useSettings';
import { SUPPORT_PHONE, CONTACT_LINKS } from '../../lib/contact';
import { CookiePreferencesLink } from '../ui/CookieConsent';
import { useI18n } from '../../i18n/I18nContext';

const columns = [
  {
    key: 'company',
    links: [
      { to: '/about', key: 'about' },
      { to: '/how-it-works', key: 'howItWorks' },
      { to: '/faq', key: 'faq' },
      { to: '/contact', key: 'contact' },
      { to: '/login', key: 'login' },
      { to: '/register', key: 'register' },
    ],
  },
  {
    key: 'services',
    links: [
      { to: '/services', key: 'all' },
      { to: '/services?category=Practical%20%26%20Lab%20Manuals', key: 'labManual' },
      { to: '/services?category=Assignments%20%26%20Notes', key: 'assignments' },
      { to: '/services?category=Project%20Documentation', key: 'projects' },
      { to: '/services?category=Technical%20%26%20Research', key: 'technical' },
      { to: '/pricing', key: 'pricing' },
    ],
  },
  {
    key: 'legal',
    links: [
      { to: '/privacy-policy', key: 'privacy' },
      { to: '/terms-of-service', key: 'terms' },
      { to: '/refund-policy', key: 'refund' },
      { to: '/academic-integrity-policy', key: 'integrity' },
    ],
  },
];

export function Footer() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const business = settings?.business || {};
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
              {business.message || t('footer.tagline')}
            </p>
            <ul className="mt-5 space-y-2 text-[13px] text-muted">
              <li className="flex items-center gap-2"><Mail className="size-3.5 text-forest" aria-hidden />{business.email || 'hello@acadexa.example'}</li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0 text-forest" aria-hidden />
                <a href={SUPPORT_PHONE.tel} className="transition-colors hover:text-forest" aria-label={`Call Acadexa on ${SUPPORT_PHONE.display}`}>
                  {business.phone || SUPPORT_PHONE.display}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="size-3.5 shrink-0 text-forest" aria-hidden />
                <a href={CONTACT_LINKS.general} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-forest">
                  {t('footer.whatsappAvailable', { compact: SUPPORT_PHONE.compact })}
                </a>
              </li>
              <li className="flex items-center gap-2"><MapPin className="size-3.5 text-forest" aria-hidden />{business.address || 'Ahmedabad, India'}</li>
            </ul>
          </div>
          {columns.map((col) => (
            <div key={col.key}>
              <h2 className="text-[12px] font-bold tracking-[0.12em] text-ink uppercase">{t(`footer.columns.${col.key}`)}</h2>
              <ul className="mt-3.5 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.key}>
                    <Link to={l.to} className="text-[13px] text-muted transition-colors hover:text-forest">{t(`footer.links.${l.key}`)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span>{t('footer.copyright', { year, name: business.name || 'Acadexa' })}</span>
            <span aria-hidden className="text-line">·</span>
            <CookiePreferencesLink className="font-semibold text-forest transition-colors hover:underline">{t('footer.links.cookies')}</CookiePreferencesLink>
          </div>
          <p className="flex items-start gap-2 text-[12px] text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald" aria-hidden />
            {t('footer.integrityNote')}
          </p>
        </div>
      </div>
    </footer>
  );
}
