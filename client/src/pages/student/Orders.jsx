import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Field';
import { PillTabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ORDER_FILTERS, formatDate, money, statusStyle, daysUntil } from '../../lib/utils';

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'All Orders';
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', status, q, page],
    queryFn: async () => (await api.get('/orders', { params: { status, q, page, limit: 8 } })).data,
  });

  return (
    <div>
      <PageHeader title="My orders" description="Every request you've submitted, with its reference, status, deadline and latest update." action={<Button to="/dashboard/requests/new" icon={Plus}>New request</Button>} />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by reference or title…" aria-label="Search orders" className="pl-10" />
          </div>
          <Select value={status} onChange={(e) => { setParams(e.target.value === 'All Orders' ? {} : { status: e.target.value }); setPage(1); }} aria-label="Filter by status" className="sm:w-56">
            {ORDER_FILTERS.map((f) => (
              <option key={f} value={f}>{f}{data?.counts?.[f] ? ` (${data.counts[f]})` : ''}</option>
            ))}
          </Select>
        </div>

        <div className="lg:hidden">
          <PillTabs options={ORDER_FILTERS.slice(0, 6)} value={status} onChange={(s) => { setParams(s === 'All Orders' ? {} : { status: s }); setPage(1); }} layoutId="orders-mobile" />
        </div>

        {isLoading ? (
          <SkeletonRows count={4} />
        ) : isError ? (
          <EmptyState title="Couldn't load your orders" description="Please retry." action={<Button className="mt-4" onClick={() => refetch()}>Retry</Button>} />
        ) : data?.orders?.length ? (
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.8fr_auto] gap-3 border-b border-line bg-canvas px-5 py-2.5 text-[11px] font-bold tracking-wide text-muted uppercase lg:grid">
              <span>Order</span><span>Service</span><span>Deadline</span><span>Amount</span><span>Status</span><span />
            </div>
            <ul className="divide-y divide-line">
              {data.orders.map((o) => {
                const days = daysUntil(o.deadline);
                return (
                  <li key={o._id}>
                    <Link to={`/dashboard/orders/${o._id}`} className="grid gap-2 px-5 py-4 transition-colors hover:bg-canvas lg:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.8fr_auto] lg:items-center lg:gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">{o.title}</p>
                        <p className="mt-0.5 font-mono text-[10.5px] text-muted">{o.reference}</p>
                      </div>
                      <p className="truncate text-[12.5px] text-muted">{o.serviceName}</p>
                      <p className={`text-[12.5px] ${days <= 2 && !['Completed', 'Cancelled', 'Delivered', 'Refunded'].includes(o.status) ? 'font-semibold text-danger' : 'text-muted'}`}>{formatDate(o.deadline)}</p>
                      <p className="text-[12.5px] font-semibold text-ink">{o.agreedAmount ? money(o.agreedAmount, o.currency) : '—'}</p>
                      <span className={`w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(o.status)}`}>{o.status}</span>
                      <ChevronRight className="hidden size-4 text-slate-300 lg:block" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-3">
                <p className="text-[12px] text-muted">Page {data.page} of {data.pages} · {data.total} orders</p>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={ChevronLeft}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} iconRight={ChevronRight}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title={status === 'All Orders' ? 'No orders yet' : `No orders with status “${status}”`}
            description={status === 'All Orders' ? 'Submit your first request and it will appear here with a reference and timeline.' : 'Try another filter or clear the search to see all orders.'}
            actionLabel="Request a service"
            actionTo="/dashboard/requests/new"
          />
        )}
      </div>
    </div>
  );
}
