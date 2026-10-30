import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, Check, X, Clock, ArrowRight, CalendarDays } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { PillTabs } from '../../components/ui/Tabs';
import { formatDate, formatDateTime, money, statusStyle } from '../../lib/utils';

const FILTERS = ['All', 'Sent', 'Accepted', 'Rejected', 'Expired'];

export default function Quotations() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', 'mine'],
    queryFn: async () => (await api.get('/quotations')).data.quotations,
  });

  const list = (data || []).filter((q) => filter === 'All' || q.status === filter);

  const act = async (q, action) => {
    setBusy(q._id + action);
    try {
      await api.post(`/quotations/${q._id}/${action}`, action === 'reject' ? { reason: 'Declined by student' } : {});
      toast.success(action === 'accept' ? 'Quotation accepted — check payments to continue' : 'Quotation declined');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Quotations" description="Review the price, scope, deliverables and revision terms we've proposed. Nothing is charged until you accept." />

      <PillTabs options={FILTERS} value={filter} onChange={setFilter} className="mb-4 w-fit" layoutId="quotations-tab" />

      {isLoading ? <SkeletonRows count={3} /> : list.length === 0 ? (
        <EmptyState icon={FileText} title="No quotations here" description="Quotations appear once we've reviewed a submitted request. You'll also be notified in-app." actionLabel="Browse services" actionTo="/services" />
      ) : (
        <div className="space-y-3">
          {list.map((q) => (
            <Card key={q._id} className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-canvas/60 px-5 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11.5px] font-semibold text-ink">{q.reference}</span>
                    <span className="text-[11px] text-muted">v{q.version}</span>
                    <Badge status={q.status}>{q.status}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] font-semibold text-ink">{q.order?.title || 'Related order'}</p>
                  <p className="text-[11.5px] text-muted">{q.order?.reference} · {q.order?.serviceName}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-extrabold text-forest">{money(q.amount, q.currency)}</p>
                  <p className="flex items-center justify-end gap-1 text-[11px] text-muted"><Clock className="size-3" aria-hidden /> valid until {formatDate(q.expiresAt)}</p>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-[1.4fr_0.6fr]">
                <div className="space-y-2.5 text-[13px]">
                  <div>
                    <p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">Scope</p>
                    <p className="mt-0.5 leading-relaxed text-ink">{q.scope}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">Deliverables</p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {q.deliverables?.map((d) => <li key={d} className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] text-muted">{d}</li>)}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[11.5px] text-muted">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden /> Est. delivery {formatDate(q.estimatedDelivery)}</span>
                    <span>Revisions: {q.revisionLimit}</span>
                    <span>Terms: {q.paymentTerms}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  {q.status === 'Sent' ? (
                    <>
                      <Button size="sm" loading={busy === q._id + 'accept'} onClick={() => act(q, 'accept')} icon={Check}>Accept quotation</Button>
                      <Button size="sm" variant="secondary" loading={busy === q._id + 'reject'} onClick={() => act(q, 'reject')} icon={X}>Decline</Button>
                    </>
                  ) : (
                    <Link to={q.order?._id ? `/dashboard/orders/${q.order._id}` : '/dashboard/orders'} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-[12.5px] font-semibold text-forest hover:bg-mint">
                      View order <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                  {q.acceptedAt && <p className="text-center text-[10.5px] text-emerald">Accepted {formatDateTime(q.acceptedAt)}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
