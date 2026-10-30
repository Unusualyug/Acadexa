import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, AlertTriangle, Video } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatDate, formatDateTime, daysUntil } from '../../lib/utils';

export default function AdminCalendar() {
  const [range, setRange] = useState({ from: new Date().toISOString().slice(0, 10), to: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'calendar', range],
    queryFn: async () => (await api.get('/admin/calendar', { params: range })).data,
  });

  const overdue = data?.orders?.filter((o) => new Date(o.deadline) < new Date()) || [];
  const upcoming = data?.orders?.filter((o) => new Date(o.deadline) >= new Date()) || [];

  return (
    <div>
      <PageHeader
        title="Deadline calendar"
        description="Order deadlines, consultation sessions and workload in one view."
        action={
          <div className="flex gap-2">
            <label className="text-[11px] font-semibold text-muted">From<input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="mt-1 block h-9 rounded-lg border border-line px-2.5 text-[12.5px]" /></label>
            <label className="text-[11px] font-semibold text-muted">To<input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="mt-1 block h-9 rounded-lg border border-line px-2.5 text-[12.5px]" /></label>
          </div>
        }
      />

      {isLoading ? <SkeletonRows count={5} /> : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {overdue.length > 0 && (
              <Card className="border-danger/30">
                <CardHeader title="Overdue" description={`${overdue.length} order(s) past deadline`} icon={AlertTriangle} action={<Badge tone="danger">Action needed</Badge>} />
                <ul className="divide-y divide-line">
                  {overdue.map((o) => (
                    <li key={o._id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <Link to={`/admin/orders/${o._id}`} className="truncate text-[12.5px] font-semibold text-ink hover:text-forest">{o.title}</Link>
                        <p className="text-[10.5px] text-muted">{o.reference} · {o.serviceName} · {o.assignedConsultant?.name || 'unassigned'}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-danger">{formatDate(o.deadline)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card>
              <CardHeader title="Upcoming deadlines" description={`${upcoming.length} order(s) in range`} icon={CalendarDays} />
              <div className="divide-y divide-line">
                {upcoming.length ? upcoming.map((o) => {
                  const d = daysUntil(o.deadline);
                  return (
                    <div key={o._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <Link to={`/admin/orders/${o._id}`} className="truncate text-[12.5px] font-semibold text-ink hover:text-forest">{o.title}</Link>
                        <p className="text-[10.5px] text-muted">{o.reference} · {o.status} · {o.assignedConsultant?.name || 'unassigned'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={d <= 2 ? 'danger' : d <= 5 ? 'warn' : 'neutral'}>{formatDate(o.deadline)}</Badge>
                        <span className="text-[10.5px] text-muted">{d}d</span>
                      </div>
                    </div>
                  );
                }) : <p className="px-5 py-8 text-center text-[12.5px] text-muted">Nothing due in this range.</p>}
              </div>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader title="Consultation sessions" description={`${data?.bookings?.length || 0} in range`} icon={Video} />
            <div className="divide-y divide-line">
              {data?.bookings?.length ? data.bookings.map((b) => (
                <div key={b._id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-semibold text-ink">{b.category}</p>
                    <Badge status={b.status}>{b.status}</Badge>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted"><Clock className="size-3" aria-hidden />{formatDateTime(b.startsAt)} · {b.student?.name}</p>
                </div>
              )) : <p className="px-5 py-8 text-center text-[12.5px] text-muted">No consultations booked.</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
