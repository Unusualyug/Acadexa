import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, TrendingUp, LifeBuoy, Users } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { money } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function AdminReports() {
  const { user } = useAuth();
  const [range, setRange] = useState({ from: '', to: '' });
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', range],
    queryFn: async () => (await api.get('/admin/reports', { params: range })).data,
    enabled: ['admin', 'owner'].includes(user?.role),
  });

  if (!['admin', 'owner'].includes(user?.role)) return <EmptyState title="Restricted" description="Reports require administrator permissions." actionLabel="Back" actionTo="/admin" />;

  const exportReport = () => {
    const rows = [['Service', 'Orders', 'Agreed value']];
    data?.byService?.forEach((s) => rows.push([s._id, s.orders, s.value]));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `service-report-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Operational reporting on demand, verified revenue, refunds, support and consultant workload."
        action={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[11px] font-semibold text-muted">From<input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="mt-1 block h-9 rounded-lg border border-line px-2.5 text-[12.5px]" /></label>
            <label className="text-[11px] font-semibold text-muted">To<input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="mt-1 block h-9 rounded-lg border border-line px-2.5 text-[12.5px]" /></label>
            <Button size="sm" variant="secondary" onClick={exportReport} icon={Download}>Export</Button>
          </div>
        }
      />

      {isLoading ? <SkeletonRows count={5} /> : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Verified revenue by month" description="Confirmed payments only" icon={TrendingUp} />
              <div className="h-56 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.payments || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
                    <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                    <Line type="monotone" dataKey="total" stroke="#14532D" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Orders by service" icon={BarChart3} />
              <div className="h-56 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.byService || []} layout="vertical" margin={{ left: 8, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="_id" width={120} tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10 }} />
                    <Bar dataKey="orders" fill="#10B981" radius={[0, 4, 4, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Order status distribution" icon={BarChart3} />
              <ul className="divide-y divide-line">
                {data?.byStatus?.map((s) => (
                  <li key={s._id} className="flex items-center justify-between px-5 py-2.5 text-[12.5px]">
                    <span className="text-muted">{s._id}</span><span className="font-semibold text-ink">{s.orders}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Consultant workload" description="Active assignments" icon={Users} />
              <ul className="divide-y divide-line">
                {data?.workload?.length ? data.workload.map((w) => (
                  <li key={w._id} className="flex items-center justify-between px-5 py-2.5 text-[12.5px]">
                    <span className="text-muted">{w.name}</span><span className="font-semibold text-ink">{w.active}</span>
                  </li>
                )) : <li className="px-5 py-6 text-center text-[12px] text-muted">No active assignments.</li>}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Support & refunds" icon={LifeBuoy} />
              <div className="space-y-2 p-5 text-[12.5px]">
                {data?.ticketStats?.map((t) => (
                  <div key={t._id} className="flex justify-between"><span className="text-muted">{t._id}</span><span className="font-semibold text-ink">{t.n}</span></div>
                ))}
                <div className="mt-2 flex justify-between border-t border-line pt-2"><span className="text-muted">Refunds issued</span><span className="font-semibold text-ink">{money(data?.refunds?.total || 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Refund count</span><span className="font-semibold text-ink">{data?.refunds?.count || 0}</span></div>
              </div>
            </Card>
          </div>

          <Card className="bg-canvas p-5">
            <p className="text-[12px] leading-relaxed text-muted">
              <strong className="text-ink">Data minimisation:</strong> exported reports contain only aggregated operational figures — no student names, emails, documents or payment identifiers are included by default.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
