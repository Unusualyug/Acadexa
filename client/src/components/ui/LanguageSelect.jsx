import { cn } from '../../lib/utils';
import { useI18n } from '../../i18n/I18nContext';

/**
 * Native select language picker.
 *
 * A native `<select>` is deliberate: it is the most accessible pattern
 * (keyboard, screen reader, and the platform's own picker on mobile), carries
 * its own label, and needs no custom dropdown widget. The context persists the
   choice to localStorage and mirrors it into `?lang=` without reloading the
   page, so the current route survives a switch.
 */
export function LanguageSelect({ label = true, className = '' }) {
  const { lang, setLang, languages, t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-[13px] font-semibold text-ink">{t('language.label')}</span>
      )}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label={t('language.choose')}
        className={cn(
          'rounded-xl border border-line bg-white text-[13px] font-semibold text-ink px-2.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-forest',
          className
        )}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>{l.native}</option>
        ))}
      </select>
    </div>
  );
}
