import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../../lib/api';
import { PageHero } from '../../components/layout/PageHero';
import { ServiceCard } from '../../components/ui/ServiceCard';
import { Input, Select } from '../../components/ui/Field';
import { PillTabs } from '../../components/ui/Tabs';
import { SkeletonCards } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Stagger, StaggerItem } from '../../components/animations/Reveal';
import { FreeLabManualBanner } from '../../components/marketing/FreeLabManualBanner';
import { ContactPrintingInfo } from '../../components/marketing/ContactPrintingInfo';
import { useI18n } from '../../i18n/I18nContext';

export default function Services() {
  const { t, tl } = useI18n();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('order');
  const category = params.get('category') || t('servicesPage.all');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['services', category, sort],
    queryFn: async () => (await api.get('/services', { params: { category, sort } })).data,
  });

  const services = useMemo(() => {
    const list = data?.services || [];
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((s) => `${s.name} ${s.shortDescription} ${s.category}`.toLowerCase().includes(needle));
  }, [data, q]);

  const categories = [t('servicesPage.all'), ...(data?.categories || [])];

  const sortOptions = [
    { value: 'order', label: t('pricingPage.sort.order') },
    { value: 'name', label: t('pricingPage.sort.name') },
    { value: 'priceAsc', label: t('pricingPage.sort.priceAsc') },
    { value: 'priceDesc', label: t('pricingPage.sort.priceDesc') },
  ];

  return (
    <>
      <PageHero
        eyebrow={t('servicesPage.eyebrow')}
        title={t('servicesPage.title')}
        description={t('servicesPage.description')}
      />
      <section className="py-12">
        <div className="container-page">
          <FreeLabManualBanner variant="hero" className="mb-4" />
          <ContactPrintingInfo className="mb-6" delay={0.05} />
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('servicesPage.searchPlaceholder')}
                  aria-label={t('servicesPage.searchLabel')}
                  className="pl-10"
                />
                {q && (
                  <button
                    onClick={() => setQ('')}
                    aria-label={t('servicesPage.clearSearch')}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-muted hover:bg-slate-100"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-muted" aria-hidden />
                <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('servicesPage.sortLabel')} className="w-full sm:w-44">
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <PillTabs
              options={categories}
              value={category}
              onChange={(c) => {
                if (c === t('servicesPage.all')) setParams({});
                else setParams({ category: c });
              }}
              layoutId="services-tab"
            />
          </div>

          <div className="mt-8">
            {isLoading ? (
              <SkeletonCards count={6} />
            ) : isError ? (
              <EmptyState
                title={t('servicesPage.errorTitle')}
                description={t('servicesPage.errorBody')}
                actionLabel={t('servicesPage.emptyAction')}
                action={<button onClick={() => refetch()} className="mt-4 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">{t('common.retry')}</button>}
              />
            ) : services.length === 0 ? (
              <EmptyState
                title={t('servicesPage.emptyTitle')}
                description={t('servicesPage.emptyBody')}
              />
            ) : (
              <>
                <p className="mb-4 text-[12.5px] text-muted">
                  {services.length === 1 ? t('servicesPage.oneService') : t('servicesPage.manyServices', { count: services.length })}
                  {category !== t('servicesPage.all') && ` in ${category}`}
                </p>
                <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((s) => (
                    <StaggerItem key={s._id}>
                      <ServiceCard service={s} />
                    </StaggerItem>
                  ))}
                </Stagger>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
