import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2, Clock, ArrowLeft, ArrowRight, Phone, MessageCircle, AlertCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { PageHero } from '../../components/layout/PageHero';
import { Reveal } from '../../components/animations/Reveal';
import { Button } from '../../components/ui/Button';
import { money } from '../../lib/utils';
import { formatDate } from '../../lib/utils';
import { SUPPORT_PHONE, CONTACT_LINKS } from '../../lib/contact';
import { useSettings } from '../../hooks/useSettings';
import { useI18n } from '../../i18n/I18nContext';

export default function ConfirmationPage() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const { reference } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};
  const pageType = state.type || 'enquiry';
  const paymentStatus = state.paymentStatus || 'success';
  const enquiryData = state.data || null;

  const expectedResponse = '1 working day';

  const isSuccess = pageType === 'enquiry' || paymentStatus === 'success';
  const isPending = paymentStatus === 'pending';
  const isFailed = paymentStatus === 'failed';

  const timelineStages = [
    { key: 'enquiryReceived', label: t('timeline.enquiryReceived'), completed: true, active: false },
    { key: 'requirementsReviewed', label: t('timeline.requirementsReviewed'), completed: false, active: isSuccess && !isPending },
    { key: 'quotationShared', label: t('timeline.quotationShared'), completed: false, active: false },
    { key: 'customerApproval', label: t('timeline.customerApproval'), completed: false, active: false },
    { key: 'orderProcessing', label: t('timeline.orderProcessing'), completed: false, active: false },
    { key: 'deliverablesReady', label: t('timeline.deliverablesReady'), completed: false, active: false },
  ];

  const summaryRows = [];
  if (enquiryData) {
    summaryRows.push(
      { label: t('confirmation.referenceLabel'), value: enquiryData.reference || reference, type: 'ref' },
      { label: 'Name', value: enquiryData.name || '—', type: 'text' },
      { label: 'Email', value: enquiryData.email || '—', type: 'text' },
      { label: t('contactForm.phone'), value: enquiryData.phone || '—', type: 'phone' },
      { label: t('contactPage.category'), value: enquiryData.category || '—', type: 'text' },
    );
    if (enquiryData.deadline) summaryRows.push({ label: t('contactForm.deadline'), value: formatDate(enquiryData.deadline), type: 'date' });
    if (enquiryData.message) summaryRows.push({ label: t('contactPage.message'), value: enquiryData.message, type: 'text' });
    if (enquiryData.fileIds?.length) summaryRows.push({ label: 'Files attached', value: `${enquiryData.fileIds.length} file${enquiryData.fileIds.length === 1 ? '' : 's'}`, type: 'text' });
  } else {
    summaryRows.push({ label: t('confirmation.referenceLabel'), value: reference, type: 'ref' });
  }

  const getStatusConfig = () => {
    if (isFailed) return { icon: <AlertCircle className="size-6" aria-hidden />, bg: 'bg-danger text-white', title: t('confirmation.paymentFailed'), sub: 'Your payment could not be processed. Please try again or contact us.' };
    if (isPending) return { icon: <Clock className="size-6" aria-hidden />, bg: 'bg-amber text-[#8a6a12]', title: t('confirmation.paymentPending'), sub: t('confirmation.paymentAwaiting') };
    return { icon: <CheckCircle2 className="size-6" aria-hidden />, bg: 'bg-emerald text-white', title: t('confirmation.enquiryReceived'), sub: t('confirmation.keepReference') };
  };

  const statusConfig = getStatusConfig();

  const handleCopy = () => {
    navigator.clipboard.writeText(reference || '');
  };

  return (
    <>
      <PageHero
        eyebrow={pageType === 'payment' ? t('confirmation.paymentSuccess') : t('confirmation.enquiryReceived')}
        title={statusConfig.title}
        description={statusConfig.sub}
      />

      <section className="py-14">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">

            {/* Left column: confirmation card */}
            <Reveal className="rounded-2xl border border-line bg-white p-6 shadow-[0_20px_50px_-34px_rgba(20,83,45,0.4)]">
              <div className="flex items-center gap-3 mb-6">
                <span className={`grid size-12 place-items-center rounded-full ${statusConfig.bg}`}>{statusConfig.icon}</span>
                <div>
                  <h2 className="text-lg font-bold text-ink">{statusConfig.title}</h2>
                  <p className="mt-0.5 text-[12.5px] text-muted">{statusConfig.sub}</p>
                </div>
              </div>

              {/* Reference number */}
              <div className="mb-6">
                <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{t('confirmation.referenceLabel')}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="flex-1 font-display text-2xl font-extrabold text-forest break-all">{reference}</span>
                  <Button size="icon" variant="outline" onClick={handleCopy} aria-label="Copy reference number">
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>

              {/* Summary */}
              {summaryRows.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[13px] font-semibold text-ink">{t('confirmation.summary')}</h3>
                  <div className="mt-3 space-y-2.5">
                    {summaryRows.map((row, i) => (
                      <div key={i} className="flex justify-between gap-4 text-[13px]">
                        <span className="text-muted">{row.label}</span>
                        <span className="text-ink font-medium">
                          {row.type === 'phone' ? (
                            <a href={`tel:+919825751614`} className="hover:text-forest">{row.value}</a>
                          ) : row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="mb-6">
                <h3 className="text-[13px] font-semibold text-ink">{t('confirmation.nextSteps')}</h3>
                <div className="mt-4 relative pl-6">
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-line" aria-hidden />
                  {timelineStages.map((stage, i) => (
                    <div key={stage.key} className="flex items-start gap-3 mb-5 relative">
                      <span className={`mt-1 shrink-0 ${stage.completed ? 'bg-emerald text-white' : stage.active ? 'bg-forest text-white' : 'bg-line text-muted'}`} className="grid size-5 place-items-center rounded-full text-[10px] font-bold">
                        {stage.completed || stage.active ? (i + 1) : ''}
                      </span>
                      <span className={`text-[12.5px] leading-relaxed ${stage.completed ? 'text-ink font-medium' : 'text-muted'}`}>
                        {stage.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected response */}
              {(expectedResponse && expectedResponse !== '—') && (
                <div className="rounded-xl border border-emerald/25 bg-mint p-4">
                  <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-forest/80">
                    <Clock className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    <span>
                      <strong className="text-forest">{t('confirmation.expectedResponse')}:</strong> {expectedResponse}
                    </span>
                  </p>
                </div>
              )}
            </Reveal>

            {/* Right column: actions */}
            <div className="space-y-4">
              <Reveal delay={0.05} className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-[13px] font-semibold text-ink">{t('confirmation.nextSteps')}</h2>
                <div className="mt-4 space-y-3">
                  <Button to="/" variant="secondary" className="w-full">
                    <ArrowLeft className="size-4" aria-hidden /> {t('confirmation.returnHome')}
                  </Button>
                  {pageType === 'order' && (
                    <Button to="/dashboard/orders" variant="secondary" className="w-full">
                      {t('confirmation.viewOrder')}
                    </Button>
                  )}
                  <Button href={CONTACT_LINKS.general} target="_blank" rel="noopener noreferrer" variant="primary" className="w-full">
                    <MessageCircle className="size-4" aria-hidden /> {t('confirmation.contactWhatsApp')}
                  </Button>
                  <Button href={SUPPORT_PHONE.tel} variant="outline" className="w-full">
                    <Phone className="size-4" aria-hidden /> {t('confirmation.contactPhone')}
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={0.1} className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-[13px] font-semibold text-ink">What happens next</h2>
                <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
                  <li>• Our team reviews your requirements and files.</li>
                  <li>• You receive a written quotation with fixed pricing.</li>
                  <li>• Approve the scope and pay securely online.</li>
                  <li>• We deliver the work within the agreed deadline.</li>
                </ul>
              </Reveal>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
