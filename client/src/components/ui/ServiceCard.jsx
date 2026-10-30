import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import { ServiceIcon } from './ServiceIcon';
import { Badge } from './Badge';
import { money } from '../../lib/utils';
import { useI18n } from '../../i18n/I18nContext';

export function ServiceCard({ service, compact = false }) {
  const { t } = useI18n();
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group relative flex flex-col rounded-2xl border border-line bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald/40 hover:shadow-[0_2px_4px_rgba(23,32,51,0.05),0_28px_54px_-28px_rgba(20,83,45,0.45)] focus-visible:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-mint text-forest transition-colors duration-300 group-hover:bg-forest group-hover:text-white">
          <ServiceIcon name={service.icon} className="size-5" />
        </span>
        <ArrowUpRight className="size-4 -translate-y-1 text-slate-300 transition-all duration-300 group-hover:translate-y-0 group-hover:text-forest" aria-hidden />
      </div>
      <h3 className="mt-4 text-[15px] leading-snug font-semibold text-ink">{service.name}</h3>
      <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-muted">{service.shortDescription}</p>
      {!compact && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3.5">
          <span className="text-[12.5px] font-semibold text-forest">
            {service.startingPrice > 0 ? t('common.from', { price: money(service.startingPrice, service.currency) }) : t('serviceCard.customQuotation')}
          </span>
          <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
            <Clock className="size-3.5" aria-hidden /> {service.turnaroundEstimate}
          </span>
        </div>
      )}
      {service.availability === 'limited' && <Badge tone="warn" className="mt-3 w-fit">{t('serviceCard.limitedAvailability')}</Badge>}
    </Link>
  );
}
