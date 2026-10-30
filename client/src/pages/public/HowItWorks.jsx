import { Search, UploadCloud, ReceiptText, BadgeCheck, Send, RefreshCcw, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { PageHero } from '../../components/layout/PageHero';
import { Reveal, Stagger, StaggerItem } from '../../components/animations/Reveal';
import { Button } from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nContext';

const steps = [
  { icon: Search, titleKey: 'howItWorks.step1Title', detailKey: 'howItWorks.step1Detail', noteKey: 'howItWorks.step1Note' },
  { icon: UploadCloud, titleKey: 'howItWorks.step2Title', detailKey: 'howItWorks.step2Detail', noteKey: 'howItWorks.step2Note' },
  { icon: ReceiptText, titleKey: 'howItWorks.step3Title', detailKey: 'howItWorks.step3Detail', noteKey: 'howItWorks.step3Note' },
  { icon: BadgeCheck, titleKey: 'howItWorks.step4Title', detailKey: 'howItWorks.step4Detail', noteKey: 'howItWorks.step4Note' },
  { icon: Send, titleKey: 'howItWorks.step5Title', detailKey: 'howItWorks.step5Detail', noteKey: 'howItWorks.step5Note' },
  { icon: RefreshCcw, titleKey: 'howItWorks.step6Title', detailKey: 'howItWorks.step6Detail', noteKey: 'howItWorks.step6Note' },
];

const timeline = [
  'Request Submitted', 'Under Review', 'Quotation Sent', 'Awaiting Student Approval', 'Awaiting Payment',
  'Order Confirmed', 'In Progress', 'Awaiting Student Information', 'Ready for Review', 'Delivered', 'Revision Requested', 'Completed',
];

export default function HowItWorks() {
  const { t } = useI18n();

  return (
    <>
      <PageHero
        eyebrow={t('howItWorks.eyebrow')}
        title={t('howItWorks.title')}
        description={t('howItWorks.description')}
      />

      <section className="py-14">
        <div className="container-page">
          <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((s, i) => (
              <StaggerItem key={s.titleKey} className="group relative flex flex-col rounded-2xl border border-line bg-white p-6 transition-all hover:-translate-y-1 hover:border-emerald/40 hover:shadow-[0_28px_54px_-30px_rgba(20,83,45,0.45)]">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-mint text-forest transition-colors group-hover:bg-forest group-hover:text-white">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-display text-3xl font-extrabold text-line">0{i + 1}</span>
                </div>
                <h2 className="mt-4 text-[15px] font-semibold text-ink">{t(s.titleKey)}</h2>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{t(s.detailKey)}</p>
                <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-relaxed text-emerald">{t(s.noteKey)}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="border-y border-line bg-white py-14">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <h2 className="text-2xl font-bold">{t('howItWorks.availableStages')}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{t('howItWorks.stagesNote')}</p>
          </Reveal>
          <Reveal delay={0.08} className="mt-7 flex flex-wrap gap-2">
            {timeline.map((t, i) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5 text-[12px] font-medium text-ink">
                <span className="grid size-4 place-items-center rounded-full bg-forest text-[9px] font-bold text-white">{i + 1}</span>
                {t}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page grid gap-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, titleKey: 'howItWorks.privacyStep', textKey: 'howItWorks.privacyText' },
            { icon: Clock, titleKey: 'howItWorks.deadlineStep', textKey: 'howItWorks.deadlineText' },
            { icon: ReceiptText, titleKey: 'howItWorks.transparentStep', textKey: 'howItWorks.transparentText' },
          ].map((x) => (
            <Reveal key={x.titleKey} className="rounded-2xl border border-line bg-white p-5">
              <span className="grid size-9 place-items-center rounded-lg bg-mint text-forest"><x.icon className="size-4.5" aria-hidden /></span>
              <h3 className="mt-3 text-[13.5px] font-semibold">{t(x.titleKey)}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{t(x.textKey)}</p>
            </Reveal>
          ))}
        </div>
        <div className="container-page mt-10">
          <Reveal className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest/20 bg-forest px-6 py-7 text-white">
            <div>
              <h2 className="text-lg font-bold text-white">{t('howItWorks.readyToStart')}</h2>
              <p className="mt-1 text-[13px] text-white/70">{t('howItWorks.readySub')}</p>
            </div>
            <div className="flex gap-2.5">
              <Button to="/register" variant="emerald" iconRight={ArrowRight}>{t('howItWorks.getStarted')}</Button>
              <Button to="/services" variant="outline" className="border-white/30 text-white hover:bg-white/10">{t('howItWorks.browseServices')}</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
