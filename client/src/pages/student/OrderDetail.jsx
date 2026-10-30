import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft, CalendarClock, CreditCard, Download, FileText, MessageCircle, RefreshCcw,
  ShieldCheck, Clock, CheckCircle2, AlertTriangle, Info, XCircle, Star,
} from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UnderlineTabs } from '../../components/ui/Tabs';
import { Textarea, FormField } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { OrderTimeline } from '../../components/dashboard/OrderTimeline';
import { MessageThread } from '../../components/dashboard/MessageThread';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { QrPaymentModal } from '../../components/forms/QrPaymentModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { daysUntil, fileSize, formatDate, formatDateTime, money, statusStyle } from '../../lib/utils';

const TABS = ['Overview', 'Quotation', 'Messages', 'Documents', 'Revisions'];

export default function OrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [payOpen, setPayOpen] = useState(false);
  const [revisionFiles, setRevisionFiles] = useState([]);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const revisionForm = useForm();
  const reviewForm = useForm({ defaultValues: { rating: 5, consentToPublish: false } });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (isError) {
    return <EmptyState icon={AlertTriangle} title="Order unavailable" description={error?.response?.data?.message || 'This order could not be loaded.'} actionLabel="Back to orders" actionTo="/dashboard/orders" />;
  }

  const { order, quotations, files, deliveredFiles, messages } = data;
  const quotation = quotations?.[0];
  const canPay = ['Awaiting Payment', 'Quotation Sent'].includes(order.status) && quotation?.status !== 'Rejected';
  const canRevise = ['Delivered', 'Ready for Review'].includes(order.status);
  const canReview = order.deliveredAt && !['Cancelled', 'Rejected'].includes(order.status);
  const days = daysUntil(order.deadline);

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this request? This cannot be undone. Refunds follow the Refund Policy.')) return;
    try {
      await api.post(`/orders/${order._id}/cancel`, { reason: 'Cancelled by student from order page' });
      toast.success('Request cancelled');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const submitRevision = async (values) => {
    try {
      await api.post(`/orders/${order._id}/revisions`, { description: values.description, fileIds: revisionFiles.map((f) => f._id) });
      toast.success('Revision requested');
      setRevisionOpen(false);
      revisionForm.reset();
      setRevisionFiles([]);
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const submitReview = async (values) => {
    try {
      await api.post('/reviews', { orderId: order._id, rating: Number(values.rating), feedback: values.feedback, consentToPublish: Boolean(values.consentToPublish) });
      toast.success('Thank you — feedback recorded');
      setReviewOpen(false);
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  return (
    <div className="space-y-5">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-forest">
        <ArrowLeft className="size-3.5" aria-hidden /> All orders
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(order.status)}`}>{order.status}</span>
              <span className="font-mono text-[11px] text-muted">{order.reference}</span>
              {order.paymentStatus && <Badge tone={order.paymentStatus === 'Paid' ? 'success' : order.paymentStatus === 'Pending' ? 'warn' : 'neutral'}>{order.paymentStatus}</Badge>}
            </div>
            <h1 className="mt-2 font-display text-[22px] leading-tight font-extrabold text-ink sm:text-[26px]">{order.title}</h1>
            <p className="mt-1 text-[12.5px] text-muted">{order.serviceName}{order.subjectArea ? ` · ${order.subjectArea}` : ''} · submitted {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canPay && <Button onClick={() => setPayOpen(true)} icon={CreditCard}>Pay {money(order.agreedAmount, order.currency)}</Button>}
            {canRevise && <Button variant="secondary" onClick={() => setRevisionOpen(true)} icon={RefreshCcw}>Request revision</Button>}
            {canReview && <Button variant="secondary" onClick={() => setReviewOpen(true)} icon={Star}>Leave feedback</Button>}
            {!['Cancelled', 'Completed', 'Refunded', 'In Progress'].includes(order.status) && (
              <Button variant="ghost" className="text-danger hover:bg-red-50" onClick={cancelOrder} icon={XCircle}>Cancel</Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">Deadline</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <CalendarClock className="size-3.5 text-forest" aria-hidden /> {formatDate(order.deadline)}
              <span className={`text-[11px] font-medium ${days <= 2 ? 'text-danger' : 'text-muted'}`}>({days <= 0 ? 'due' : `${days}d`})</span>
            </p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">Agreed amount</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink">{order.agreedAmount ? money(order.agreedAmount, order.currency) : 'Pending quotation'}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">Revisions used</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink">{order.revisionCount} of {quotation?.revisionLimit ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">Consultant</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink">{order.assignedConsultant?.name || 'Not yet assigned'}</p>
          </div>
        </div>
      </Card>

      <UnderlineTabs options={TABS.map((t) => ({ value: t, label: t === 'Messages' ? `Messages (${messages?.length || 0})` : t === 'Documents' ? `Documents (${(files?.length || 0) + (deliveredFiles?.length || 0)})` : t }))} value={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader title="Your requirements" icon={FileText} />
              <div className="space-y-3 p-5 text-[13px] leading-relaxed">
                <p className="whitespace-pre-wrap text-ink">{order.instructions}</p>
                {order.deliverablesRequired && <div><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Deliverables</p><p className="mt-0.5 text-muted">{order.deliverablesRequired}</p></div>}
                {order.institutionalGuidelines && <div><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Institutional guidelines</p><p className="mt-0.5 text-muted">{order.institutionalGuidelines}</p></div>}
                {order.additionalNotes && <div><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Additional notes</p><p className="mt-0.5 text-muted">{order.additionalNotes}</p></div>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Order timeline" description="Recorded actions and status changes" icon={Clock} />
              <div className="p-5"><OrderTimeline activity={order.activity} /></div>
            </Card>
          </div>

          <div className="space-y-4">
            {quotation && (
              <Card>
                <CardHeader title="Current quotation" icon={FileText} action={<Link to="/dashboard/quotations" className="text-[11.5px] font-semibold text-forest hover:underline">All</Link>} />
                <div className="space-y-2.5 p-5 text-[12.5px]">
                  <div className="flex items-center justify-between"><span className="text-muted">Reference</span><span className="font-mono text-ink">{quotation.reference}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Version</span><span className="text-ink">v{quotation.version}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Amount</span><span className="font-semibold text-forest">{money(quotation.amount, quotation.currency)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Status</span><Badge status={quotation.status}>{quotation.status}</Badge></div>
                  <div className="flex items-center justify-between"><span className="text-muted">Valid until</span><span className="text-ink">{formatDate(quotation.expiresAt)}</span></div>
                </div>
              </Card>
            )}
            <Card className="bg-mint/60">
              <div className="p-5">
                <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-forest"><ShieldCheck className="size-4" aria-hidden /> Privacy reminder</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-forest/80">
                  Only you and the assigned team member can open this order's files. Downloads are authorised on the server and logged.
                </p>
              </div>
            </Card>
            {order.deadlineHistory?.length > 0 && (
              <Card>
                <CardHeader title="Deadline changes" icon={CalendarClock} />
                <ul className="divide-y divide-line">
                  {order.deadlineHistory.map((d, i) => (
                    <li key={i} className="px-5 py-3 text-[11.5px]">
                      <p className="text-ink">{formatDate(d.from)} → <strong>{formatDate(d.to)}</strong></p>
                      <p className="mt-0.5 text-muted">{d.reason} · {formatDate(d.at)}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'Quotation' && (
        <div className="space-y-4">
          {quotations?.length ? quotations.map((q) => (
            <Card key={q._id}>
              <CardHeader
                title={`${q.reference} · version ${q.version}`}
                description={`Valid until ${formatDate(q.expiresAt)}`}
                icon={FileText}
                action={<Badge status={q.status}>{q.status}</Badge>}
              />
              <div className="grid gap-5 p-5 sm:grid-cols-[1.4fr_0.6fr]">
                <div className="space-y-3 text-[13px]">
                  <div>
                    <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Agreed scope</p>
                    <p className="mt-0.5 leading-relaxed text-ink">{q.scope}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Deliverables</p>
                    <ul className="mt-1 space-y-1">
                      {q.deliverables?.map((d) => <li key={d} className="flex items-start gap-1.5 text-muted"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald" aria-hidden />{d}</li>)}
                    </ul>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Revisions</p><p className="text-ink">{q.revisionLimit}</p></div>
                    <div><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Est. delivery</p><p className="text-ink">{formatDate(q.estimatedDelivery)}</p></div>
                    <div><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Payment terms</p><p className="text-ink">{q.paymentTerms}</p></div>
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-canvas p-4">
                  <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Total</p>
                  <p className="font-display text-2xl font-extrabold text-forest">{money(q.amount, q.currency)}</p>
                  {q.additionalCharges?.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-line pt-2 text-[11.5px]">
                      {q.additionalCharges.map((c) => <li key={c.label} className="flex justify-between"><span className="text-muted">{c.label}</span><span className="text-ink">{money(c.amount, q.currency)}</span></li>)}
                    </ul>
                  )}
                  {q.status === 'Sent' && (
                    <div className="mt-3 space-y-1.5">
                      <Button size="sm" className="w-full" onClick={async () => {
                        try { await api.post(`/quotations/${q._id}/accept`); toast.success('Quotation accepted'); qc.invalidateQueries(); }
                        catch (e) { toast.error(apiMessage(e)); }
                      }}>Accept quotation</Button>
                      <Button size="sm" variant="secondary" className="w-full" onClick={async () => {
                        if (!window.confirm('Decline this quotation? You can request a revised one from support.')) return;
                        try { await api.post(`/quotations/${q._id}/reject`, { reason: 'Declined by student' }); toast.success('Quotation declined'); qc.invalidateQueries(); }
                        catch (e) { toast.error(apiMessage(e)); }
                      }}>Decline</Button>
                    </div>
                  )}
                  {q.acceptedAt && <p className="mt-2 text-[11px] text-emerald">Accepted {formatDateTime(q.acceptedAt)}</p>}
                </div>
              </div>
            </Card>
          )) : <EmptyState icon={FileText} title="No quotation yet" description="We review every request before pricing it. You'll be notified as soon as a quotation is ready." />}
        </div>
      )}

      {tab === 'Messages' && (
        <Card>
          <CardHeader title="Order conversation" description="Messages here are visible to you and the assigned team member only" icon={MessageCircle} />
          <div className="p-4">
            <MessageThread orderId={order._id} disabled={['Cancelled', 'Rejected'].includes(order.status)} />
          </div>
        </Card>
      )}

      {tab === 'Documents' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Your uploaded files" description={`${files?.length || 0} file(s)`} icon={FileText} />
            <ul className="divide-y divide-line">
              {files?.length ? files.map((f) => (
                <li key={f._id} className="flex items-center gap-3 px-5 py-3">
                  <FileText className="size-4 shrink-0 text-forest" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-ink">{f.originalName}</p>
                    <p className="text-[10.5px] text-muted">{fileSize(f.size)} · {f.mimeType.split('/').pop()} · {formatDate(f.createdAt)} · retained until {formatDate(f.retentionUntil)}</p>
                  </div>
                  <Button size="sm" variant="ghost" href={`${api.defaults.baseURL}/files/${f._id}/download`} icon={Download} aria-label={`Download ${f.originalName}`} />
                </li>
              )) : <li className="px-5 py-8 text-center text-[12.5px] text-muted">No files uploaded for this order.</li>}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Delivered files" description={`${deliveredFiles?.length || 0} file(s)`} icon={Download} />
            <ul className="divide-y divide-line">
              {deliveredFiles?.length ? deliveredFiles.map((f) => (
                <li key={f._id} className="flex items-center gap-3 px-5 py-3">
                  <Download className="size-4 shrink-0 text-emerald" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-ink">{f.originalName} <span className="text-[10px] font-medium text-muted">v{f.version}</span></p>
                    <p className="text-[10.5px] text-muted">{fileSize(f.size)} · delivered {formatDate(f.createdAt)}</p>
                  </div>
                  <Button size="sm" variant="soft" href={`${api.defaults.baseURL}/files/${f._id}/download`} icon={Download}>Download</Button>
                </li>
              )) : <li className="px-5 py-8 text-center text-[12.5px] text-muted">Deliverables will appear here once uploaded.</li>}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'Revisions' && (
        <Card>
          <CardHeader
            title="Revision history"
            description={`${order.revisionCount} of ${quotation?.revisionLimit ?? '—'} revisions used · ${quotation?.revisionPolicy || 'Limits follow your quotation'}`}
            icon={RefreshCcw}
            action={canRevise ? <Button size="sm" onClick={() => setRevisionOpen(true)} icon={RefreshCcw}>Request revision</Button> : null}
          />
          <div className="p-5">
            {order.activity?.filter((a) => /revision/i.test(a.action)).length ? (
              <OrderTimeline activity={order.activity.filter((a) => /revision|deliver/i.test(a.action))} />
            ) : (
              <EmptyState icon={RefreshCcw} title="No revisions requested" description="If a delivery falls short of the agreed scope, request a revision within the limit stated in your quotation." />
            )}
          </div>
        </Card>
      )}

      <QrPaymentModal open={payOpen} onClose={() => setPayOpen(false)} order={order} onVerified={() => qc.invalidateQueries()} />

      <Modal
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        title="Request a revision"
        description="Describe precisely what needs to change within the agreed scope."
        footer={<><Button variant="secondary" onClick={() => setRevisionOpen(false)}>Cancel</Button><Button loading={revisionForm.formState.isSubmitting} onClick={revisionForm.handleSubmit(submitRevision)}>Submit revision</Button></>}
      >
        <form onSubmit={revisionForm.handleSubmit(submitRevision)} className="space-y-4">
          <FormField label="What should change?" htmlFor="revision-desc" required error={revisionForm.formState.errors.description?.message}>
            <Textarea id="revision-desc" rows={5} placeholder="e.g. Section 3.2 references need to follow IEEE style, and the observation table on page 14 should include units." {...revisionForm.register('description', { required: 'Describe the change you need', minLength: { value: 10, message: 'Add a little more detail' } })} />
          </FormField>
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-ink">Supporting files (optional)</p>
            <FileDropzone files={revisionFiles} onChange={setRevisionFiles} purpose="revision-reference" />
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-canvas px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0 text-forest" aria-hidden />
            Revisions outside the agreed scope are quoted separately and need your approval before any extra charge.
          </p>
        </form>
      </Modal>

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Leave feedback"
        description="Your honest feedback helps other students and improves the service."
        footer={<><Button variant="secondary" onClick={() => setReviewOpen(false)}>Cancel</Button><Button loading={reviewForm.formState.isSubmitting} onClick={reviewForm.handleSubmit(submitReview)}>Submit feedback</Button></>}
      >
        <form onSubmit={reviewForm.handleSubmit(submitReview)} className="space-y-4">
          <FormField label="Rating" htmlFor="rating" required>
            <select id="rating" className="h-11 w-full rounded-xl border border-line px-3 text-sm" {...reviewForm.register('rating')}>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}
            </select>
          </FormField>
          <FormField label="Your feedback" htmlFor="feedback">
            <Textarea id="feedback" rows={4} placeholder="What went well, and what could be better?" {...reviewForm.register('feedback')} />
          </FormField>
          <label className="flex items-start gap-2.5 text-[12.5px] text-muted">
            <input type="checkbox" className="mt-0.5 size-4 accent-forest" {...reviewForm.register('consentToPublish')} />
            I consent to this feedback being published on the website (first name only).
          </label>
        </form>
      </Modal>
    </div>
  );
}
