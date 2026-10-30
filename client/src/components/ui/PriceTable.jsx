import { cn } from '../../lib/utils';
import { useI18n } from '../../i18n/I18nContext';

/**
 * Renders a service price sheet. `rows` come from Service.priceTable and keep the
 * softcopy / handwritten columns exactly as published. Hidden columns collapse on
 * small screens (handwritten first) to keep the table readable.
 */
export function PriceTable({ rows = [], className, showHandwritten = true }) {
  const { t } = useI18n();
  if (!rows.length) return null;
  const hasHandwritten = showHandwritten && rows.some((r) => r.handwritten && r.handwritten !== '—');
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-line bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-left text-[12.5px]">
          <caption className="sr-only">{t('priceTable.caption')}</caption>
          <thead className="bg-canvas">
            <tr className="text-[10.5px] tracking-[0.08em] text-muted uppercase">
              <th scope="col" className="px-4 py-2.5 font-bold">Item</th>
              <th scope="col" className="px-4 py-2.5 text-right font-bold">Softcopy</th>
              {hasHandwritten && <th scope="col" className="px-4 py-2.5 text-right font-bold">Handwritten</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.item} className="transition-colors hover:bg-canvas/60">
                <td className="px-4 py-2.5 text-ink">
                  {r.item}
                  {r.note && <span className="mt-0.5 block text-[11px] text-muted">{r.note}</span>}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap text-forest">{r.softcopy || '—'}</td>
                {hasHandwritten && <td className="px-4 py-2.5 text-right whitespace-nowrap text-muted">{r.handwritten || '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line bg-canvas/60 px-4 py-2 text-[10.5px] leading-relaxed text-muted">
        {t('priceTable.footnote')}
      </p>
    </div>
  );
}

export function ChargeTable({ rows = [], title }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-4 py-2.5 text-[10.5px] font-bold tracking-[0.08em] text-muted uppercase">{title}</div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12.5px]">
            <span className="text-ink">{r.label}</span>
            <span className="shrink-0 font-semibold text-forest">{r.charge}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
