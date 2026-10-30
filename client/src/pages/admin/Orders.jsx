import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ClipboardList, ChevronRight, Download } from 'lucide-react';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { STATUS_STYLES, formatDate, money, statusStyle } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['All', 'Pending Review', 'More Information Required', 'Quotation Sent', 'Awaiting Payment', 'Confirmed', 'In Progress', 'Awaiting Student Information', 'Ready for Review', 'Delivered', 'Revision Requested', 'Completed', 'Cancelled', 'Rejected'];

export default function AdminOrders() {
  const { user } = useAuth();
  const [status, setStatus] = useState('All');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [deadlineBefore, setDeadlineBefore] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', status, q, page, deadlineBefore],
    queryFn: async () => (await api.get('/orders/staff/all', { params: { status, q, page, limit: 20, deadlineBefore: deadlineBefore || undefined } })).data,
  });

  const exportCsv = () => {
    const rows = [['Reference', 'Student', 'Service', 'Status', 'Deadline', 'Amount', 'Payment']];
    data?.orders?.forEach((o) => rows.push([o.reference, o.student?.name, o.serviceName, o.status, formatDate(o.deadline), o.agreedAmount, o.paymentStatus]));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title={user?.role === 'consultant' ? 'My assigned orders' : 'Orders & requests'}
        description={user?.role === 'consultant' ? 'Only orders assigned to you are shown.' : 'Review requests, issue quotations, update statuses and manage delivery.'}
        action={<Button variant="secondary" onClick={exportCsv} icon={Download}>Export CSV</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search reference or title…" aria-label="Search orders" className="pl-10" />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter status" className="sm:w-60">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input type="date" value={deadlineBefore} onChange={(e) => setDeadlineBefore(e.target.value)} aria-label="Deadline before" className="sm:w-44" />
      </div>

      {isLoading ? <SkeletonRows count={6} /> : data?.orders?.length ? (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.3fr_1fr_1fr_0.7fr_0.8fr_0.9fr_auto] gap-3 border-b border-line bg-canvas px-5 py-2.5 text-[11px] font-bold tracking-wide text-muted uppercase lg:grid">
            <span>Order</span><span>Student</span><span>Service</span><span>Deadline</span><span>Amount</span><span>Status</span><span />
          </div>
          <ul className="divide-y divide-line">
            {data.orders.map((o) => (
              <li key={o._id}>
                <Link to={`/admin/orders/${o._id}`} className="grid items-center gap-2 px-5 py-3.5 transition-colors hover:bg-canvas lg:grid-cols-[1.3fr_1fr_1fr_0.7fr_0.8fr_0.9fr_auto] lg:gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-ink">{o.title}</p>
                    <p className="font-mono text-[10px] text-muted">{o.reference}</p>
                  </div>
                  <p className="truncate text-[12px] text-muted">{o.student?.name}</p>
                  <p className="truncate text-[12px] text-muted">{o.serviceName}</p>
                  <p className="text-[12px] text-muted">{formatDate(o.deadline)}</p>
                  <p className="text-[12px] font-semibold text-ink">{o.agreedAmount ? money(o.agreedAmount, o.currency) : '—'}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${statusStyle(o.status)}`}>{o.status}</span>
                  </div>
                  <ChevronRight className="hidden size-4 text-slate-300 lg:block" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <p className="text-[12px] text-muted">Page {data.page} of {data.pages} · {data.total} orders</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState icon={ClipboardList} title="No orders match" description="Try clearing filters or search terms." />
      )}
    </div>
  );
}
