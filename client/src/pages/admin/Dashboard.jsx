import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, ClipboardList, FileText, Loader, CalendarClock, PackageCheck, CreditCard, RotateCcw,
  LifeBuoy, TrendingUp, Info, ArrowRight, ShieldCheck,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { api } from '../../lib/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SkeletonCards, SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { money, relativeTime, statusStyle, formatDate } from '../../lib/utils';

const COLORS = ['#14532D', '#10B981', '#F4B740', '#6366F1', '#0EA5E9', '#DC2626', '#94A3B8', '#8B5CF6'];

export default function AdminDashboard() {
  const [range, setRange] = useState({ from: '', to: '' });
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard', range],
    queryFn: async () => (await api.get('/admin/dashboard', { params: range })).data,
  });

  const m = data?.metrics;
  const charts = data?.charts;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business dashboard"
        description="Live figures from your database. Only server-verified payments count as revenue."
        action={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[11px] font-semibold text-muted">
              From
              <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="mt-1 block h-9 rounded-lg border border-line px-2.5 text-[12.5px]" />
            </label>
            <label className="text-[11px] font-semibold text-muted">
              To
              <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="mt-1 block h-9 rounded-lg border border-line px-2.5 text-[12.5px]" />
            </label>
            {(range.from || range.to) && <Button size="sm" variant="ghost" onClick={() => setRange({ from: '', to: '' })}>Clear</Button>}
          </div>
        }
      />

      {isError ? (
        <EmptyState title="Couldn't load metrics" description="Please refresh to try again." />
      ) : isLoading ? (
        <SkeletonCards count={6} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard index={0} label="Registered students" value={m.totalStudents} hint="All student accounts" icon={Users} to="/admin/students" />
            <StatCard index={1} label="New requests" value={m.newRequests} hint="In selected range" icon={ClipboardList} to="/admin/orders" />
            <StatCard index={2} label="Awaiting review" value={m.awaitingReview} hint="Needs a decision" icon={FileText} to="/admin/orders?status=Pending Review" tone="amber" />
            <StatCard index={3} label="Pending quotations" value={m.pendingQuotations} hint="Sent and valid" icon={FileText} to="/admin/quotations" tone="amber" />
            <StatCard index={4} label="Active orders" value={m.activeOrders} hint="Confirmed / in progress" icon={Loader} to="/admin/orders?status=In Progress" tone="emerald" />
            <StatCard index={5} label="Deadlines this week" value={m.dueSoon} hint="Next 7 days" icon={CalendarClock} to="/admin/calendar" tone="slate" />
            <StatCard index={6} label="Verified revenue" value={money(m.verifiedRevenue)} hint="Server-verified only" icon={CreditCard} to="/admin/payments" tone="emerald" />
            <StatCard index={7} label="Open support tickets" value={m.openTickets} hint={`${m.openPrivacyRequests} privacy requests`} icon={LifeBuoy} to="/admin/support" tone="slate" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Orders and verified revenue" description="Last 90 days" icon={TrendingUp} />
              <div className="h-64 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mergeTrends(charts?.ordersTrend, charts?.revenueTrend)} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14532D" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#14532D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E2E8F0' }} />
                    <Area yAxisId="left" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} fill="url(#ordersFill)" name="Orders" />
                    <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#14532D" strokeWidth={2} fill="url(#revenueFill)" name="Revenue (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Order status mix" icon={ClipboardList} />
              <div className="h-64 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts?.statusDistribution || []} dataKey="count" nameKey="status" innerRadius={44} outerRadius={72} paddingAngle={2}>
                      {(charts?.statusDistribution || []).map((entry, i) => <Cell key={entry.status} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E2E8F0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 px-2">
                  {(charts?.statusDistribution || []).slice(0, 6).map((s, i) => (
                    <li key={s.status} className="flex items-center gap-1.5 text-[10px] text-muted">
                      <span className="size-1.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden />
                      <span className="truncate">{s.status}</span><span className="ml-auto font-semibold text-ink">{s.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Service demand" description="Orders per service" icon={FileText} />
              <div className="h-56 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.servicePopularity || []} layout="vertical" margin={{ left: 8, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="service" width={122} tick={{ fontSize: 9.5, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E2E8F0' }} />
                    <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Recent activity" description="Latest order updates" icon={ClipboardList} action={<Button to="/admin/orders" size="sm" variant="ghost" iconRight={ArrowRight}>All orders</Button>} />
              <div className="divide-y divide-line">
                {isLoading ? <div className="p-4"><SkeletonRows count={3} /></div> : data?.recentActivity?.map((o) => (
                  <Link key={o._id} to={`/admin/orders/${o._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-ink">{o.title}</p>
                      <p className="text-[10.5px] text-muted">{o.reference} · {o.student?.name} · {relativeTime(o.updatedAt)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${statusStyle(o.status)}`}>{o.status}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <Card className="bg-canvas">
            <div className="flex flex-wrap items-start gap-3 p-5">
              <Info className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
              <div className="text-[12px] leading-relaxed text-muted">
                <p className="font-semibold text-ink">Metric definitions</p>
                <ul className="mt-1.5 space-y-1">
                  <li><strong className="text-ink">Verified revenue:</strong> {data?.definitions?.verifiedRevenue}</li>
                  <li><strong className="text-ink">New requests:</strong> {data?.definitions?.newRequests}</li>
                  <li><strong className="text-ink">Average completion:</strong> {data?.definitions?.avgCompletionDays} Current: {m.avgCompletionDays} days.</li>
                  <li><strong className="text-ink">Refunds:</strong> {money(m.refundedAmount)} across {m.refundCount} refund(s).</li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function mergeTrends(orders = [], revenue = []) {
  const map = new Map();
  (orders || []).forEach((o) => map.set(o.date, { date: o.date, orders: o.orders, revenue: 0 }));
  (revenue || []).forEach((r) => {
    const existing = map.get(r.date) || { date: r.date, orders: 0, revenue: 0 };
    map.set(r.date, { ...existing, revenue: r.revenue });
  });
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}
