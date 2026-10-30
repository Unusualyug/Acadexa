import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function AdminAuditLogs() {
  const { user } = useAuth();
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit', action, page],
    queryFn: async () => (await api.get('/admin/audit-logs', { params: { action, page, limit: 40 } })).data,
    enabled: ['admin', 'owner'].includes(user?.role),
  });

  if (!['admin', 'owner'].includes(user?.role)) return <EmptyState title="Restricted" description="Audit logs require administrator permissions." actionLabel="Back" actionTo="/admin" />;

  return (
    <div>
      <PageHeader title="Audit logs" description="Sensitive administrative actions with actor, action, record reference and timestamp. Passwords and tokens are never logged." />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} placeholder="Filter by action, e.g. quotation, refund, privacy" aria-label="Filter audit logs" className="pl-10" />
      </div>

      {isLoading ? <SkeletonRows count={8} /> : data?.logs?.length ? (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {data.logs.map((l) => (
              <li key={l._id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-forest/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-forest">{l.action}</span>
                  <span className="text-[11.5px] text-muted">{l.actor?.name || 'system'} ({l.actorRole || '—'})</span>
                  {l.reference && <span className="font-mono text-[10.5px] text-muted">· {l.reference}</span>}
                </div>
                {l.meta && Object.keys(l.meta).length > 0 && (
                  <p className="mt-1 font-mono text-[10.5px] break-all text-slate-500">{JSON.stringify(l.meta)}</p>
                )}
                <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-400"><History className="size-3" aria-hidden />{formatDateTime(l.createdAt)} · {l.ip || 'ip not recorded'}</p>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <p className="text-[12px] text-muted">Page {data.page} of {data.pages} · {data.total} entries</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      ) : <EmptyState icon={History} title="No audit entries" description="Sensitive actions will be recorded here as they happen." />}
    </div>
  );
}
