import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { PillTabs } from '../../components/ui/Tabs';
import { formatDate, money } from '../../lib/utils';

const TABS = ['All', 'Sent', 'Accepted', 'Rejected', 'Expired'];

export default function AdminQuotations() {
  const [tab, setTab] = useState('All');
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'quotations', tab],
    queryFn: async () => (await api.get('/quotations/staff/all', { params: tab === 'All' ? {} : { status: tab } })).data.quotations,
  });

  return (
    <div>
      <PageHeader title="Quotations" description="Every quotation version with its acceptance state. Issuing a new version supersedes the previous one for audit purposes." />
      <PillTabs options={TABS} value={tab} onChange={setTab} className="mb-4 w-fit" layoutId="admin-quotes-tab" />

      {isLoading ? <SkeletonRows count={5} /> : data?.length ? (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_1.3fr_1fr_0.7fr_0.8fr_0.8fr_auto] gap-3 border-b border-line bg-canvas px-5 py-2.5 text-[11px] font-bold tracking-wide text-muted uppercase lg:grid">
            <span>Reference</span><span>Order</span><span>Student</span><span>Amount</span><span>Status</span><span>Expires</span><span />
          </div>
          <ul className="divide-y divide-line">
            {data.map((q) => (
              <li key={q._id} className="grid items-center gap-2 px-5 py-3.5 hover:bg-canvas lg:grid-cols-[1fr_1.3fr_1fr_0.7fr_0.8fr_0.8fr_auto] lg:gap-3">
                <p className="font-mono text-[11px] text-ink">{q.reference} <span className="text-muted">v{q.version}</span></p>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{q.order?.title}</p>
                  <p className="font-mono text-[10px] text-muted">{q.order?.reference}</p>
                </div>
                <p className="truncate text-[12px] text-muted">{q.student?.name}</p>
                <p className="text-[12px] font-semibold text-forest">{money(q.amount, q.currency)}</p>
                <Badge status={q.status}>{q.status}</Badge>
                <p className="text-[11.5px] text-muted">{formatDate(q.expiresAt)}</p>
                <Link to={`/admin/orders/${q.order?._id}`} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest hover:underline">Open <ArrowRight className="size-3" aria-hidden /></Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState icon={FileText} title="No quotations" description="Quotations are created from an order page after reviewing the request." actionLabel="Go to orders" actionTo="/admin/orders" />
      )}
    </div>
  );
}
