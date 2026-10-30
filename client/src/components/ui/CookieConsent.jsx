import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie, X, Check, ShieldCheck, BarChart3, Megaphone, Lock, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useConsent, CATEGORIES } from '../../context/ConsentContext';
import { useI18n } from '../../i18n/I18nContext';

const ICONS = { necessary: Lock, analytics: BarChart3, marketing: Megaphone };

function CategoryRow({ category, checked, onChange, expanded, onToggleExpand }) {
  const { t, locale } = useI18n();
  const Icon = ICONS[category.key] || Cookie;
  const name = t(`cookie.categories.${category.key}.name`) || category.name;
  const summary = t(`cookie.categories.${category.key}.summary`) || category.summary;
  const detail = t(`cookie.categories.${category.key}.detail`) || category.detail;

  return (
    <div className="rounded-xl border border-line">
      <div className="flex items-start gap-3 p-3.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-mint text-forest">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-ink">{name}</p>
            {category.required ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 uppercase">
                {t('cookie.alwaysOn')}
              </span>
            ) : (
              <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold tracking-wide text-forest uppercase">
                {t('cookie.optional')}
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">{summary}</p>
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest hover:underline"
          >
            {expanded ? t('cookie.hideDetails') : t('cookie.whatThisCovers')}
            <ChevronDown className={`size-3 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{detail}</p>
                <div className="mt-2 overflow-hidden rounded-lg border border-line">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-canvas text-muted">
                      <tr>
                        <th className="px-2.5 py-1.5 font-semibold">Name</th>
                        <th className="px-2.5 py-1.5 font-semibold">Purpose</th>
                        <th className="px-2.5 py-1.5 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {category.cookies.map((c) => (
                        <tr key={c.name}>
                          <td className="px-2.5 py-1.5 font-mono text-[10.5px] text-ink">{c.name}</td>
                          <td className="px-2.5 py-1.5 text-muted">{c.purpose}</td>
                          <td className="px-2.5 py-1.5 text-muted">{c.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <label className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={category.required ? true : checked}
            disabled={category.required}
            onChange={(e) => onChange(e.target.checked)}
            aria-label={`${name} cookies`}
          />
          <span className="h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-forest peer-disabled:opacity-70 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest" />
          <span className="absolute left-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
        </label>
      </div>
    </div>
  );
}

/** Bottom banner: Accept all / Reject optional / Customise. Equally weighted, no dark patterns. */
export function CookieBanner() {
  const { bannerOpen, acceptAll, rejectOptional, openPreferences, preferencesOpen } = useConsent();
  const { t, locale } = useI18n();
  const reduced = useReducedMotion();
  // Do not compete with the first-visit intro: the banner arrives once the page is revealed.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);
  if (preferencesOpen || !ready) return null;

  return (
    <AnimatePresence>
      {bannerOpen && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-3 z-90 mx-auto max-w-4xl rounded-2xl border border-line bg-white/97 p-4 shadow-[0_24px_60px_-24px_rgba(20,83,45,0.45)] backdrop-blur sm:inset-x-6 sm:p-5"
          role="region"
          aria-label={t('cookie.banner.title')}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-forest">
              <Cookie className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink">{t('cookie.banner.title')}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                {t('cookie.banner.body')} <Link to="/privacy-policy" className="font-semibold text-forest underline decoration-emerald/40 underline-offset-2">{t('cookie.banner.privacyLink')}</Link>.
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                <Button size="sm" onClick={acceptAll} icon={Check}>{t('cookie.banner.acceptAll')}</Button>
                <Button size="sm" variant="secondary" onClick={rejectOptional}>{t('cookie.banner.rejectOptional')}</Button>
                <Button size="sm" variant="ghost" onClick={openPreferences} icon={ShieldCheck}>{t('cookie.banner.customise')}</Button>
              </div>
            </div>
            <button
              onClick={rejectOptional}
              aria-label={t('cookie.banner.dismiss')}
              title={t('cookie.banner.dismiss')}
              className="rounded-lg p-1 text-muted transition-colors hover:bg-slate-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Preference dialog, reachable from the banner and from the footer at any time. */
export function CookiePreferences() {
  const { preferencesOpen, closePreferences, draft, setDraft, savePreferences, acceptAll, rejectOptional, consent } = useConsent();
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState('necessary');

  const decidedAt = consent.decidedAt ? new Date(consent.decidedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : t('cookie.preferences.notYet');

  return (
    <Modal
      open={preferencesOpen}
      onClose={closePreferences}
      title={t('cookie.preferences.title')}
      description={t('cookie.preferences.description')}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={rejectOptional}>{t('cookie.banner.rejectOptional')}</Button>
          <Button variant="secondary" size="sm" onClick={acceptAll}>{t('cookie.banner.acceptAll')}</Button>
          <Button size="sm" onClick={() => savePreferences(draft)} icon={Check}>{t('cookie.preferences.save')}</Button>
        </>
      }
    >
      <div className="space-y-2.5">
        {CATEGORIES.map((c) => (
          <CategoryRow
            key={c.key}
            category={c}
            checked={c.key === 'necessary' ? true : draft[c.key]}
            onChange={(v) => setDraft({ ...draft, [c.key]: v })}
            expanded={expanded === c.key}
            onToggleExpand={() => setExpanded(expanded === c.key ? null : c.key)}
          />
        ))}
        <p className="pt-1 text-[11px] leading-relaxed text-muted">
          {t('cookie.preferences.savedNotice', { date: decidedAt })}
        </p>
      </div>
    </Modal>
  );
}

/** Footer entry point so consent can be revisited without clearing storage. */
export function CookiePreferencesLink({ className = '', children }) {
  const { openPreferences } = useConsent();
  return (
    <button type="button" onClick={openPreferences} className={className}>
      {children}
    </button>
  );
}
