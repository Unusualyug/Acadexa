import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, Check, X, Cookie, BarChart3 } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FormField, Textarea } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatDate, formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function AdminPrivacy() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [target, setTarget] = useState(null);
  const [notes, setNotes] = useState('');
  const [exceptions, setExceptions] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'privacy'],
    queryFn: async () => (await api.get('/privacy/staff/all')).data.requests,
    enabled: ['admin', 'owner'].includes(user?.role),
  });

  const { data: consents } = useQuery({
    queryKey: ['admin', 'consents'],
    queryFn: async () => (await api.get('/consent/admin/consents')).data,
    enabled: ['admin', 'owner'].includes(user?.role),
  });
  const { data: analytics } = useQuery({
    queryKey: ['admin', 'consent-analytics'],
    queryFn: async () => (await api.get('/consent/admin/summary')).data,
    enabled: ['admin', 'owner'].includes(user?.role),
  });

  const process = async (status) => {
    setBusy(true);
    try {
      await api.patch(`/privacy/staff/${target._id}`, { status, processingNotes: notes, legalExceptions: exceptions });
      toast.success(`Privacy request marked ${status}`);
      setTarget(null); setNotes(''); setExceptions('');
      qc.invalidateQueries({ queryKey: ['admin', 'privacy'] });
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (!['admin', 'owner'].includes(user?.role)) return <EmptyState title="Restricted" description="Privacy administration requires administrator permissions." actionLabel="Back" actionTo="/admin" />;

  return (
    <div>
      <PageHeader title="Privacy requests" description="Verify ownership, process access, correction, export and deletion requests, and record any legally required exceptions." />

      <Card className="mb-4 bg-mint/50">
        <div className="flex items-start gap-2.5 p-5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
          <p className="text-[12px] leading-relaxed text-forest/90">
            Requests are verified against the signed-in account. Deletion anonymises personal identifiers while retaining invoice and payment records for statutory periods. Every action here is written to the audit log.
          </p>
        </div>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader title="Cookie consent" description={`Policy version ${consents?.policyVersion || '—'}`} icon={Cookie} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-5 text-[12.5px]">
            <span className="text-muted">Browsers recorded</span><span className="text-right font-semibold text-ink">{consents?.totals?.total ?? 0}</span>
            <span className="text-muted">Accept all</span><span className="text-right text-ink">{consents?.totals?.accepted ?? 0}</span>
            <span className="text-muted">Reject optional</span><span className="text-right text-ink">{consents?.totals?.rejected ?? 0}</span>
            <span className="text-muted">Custom</span><span className="text-right text-ink">{consents?.totals?.custom ?? 0}</span>
            <span className="text-muted">Analytics enabled</span><span className="text-right text-ink">{consents?.totals?.analyticsOn ?? 0}</span>
            <span className="text-muted">Marketing enabled</span><span className="text-right text-ink">{consents?.totals?.marketingOn ?? 0}</span>
          </div>
          <p className="border-t border-line px-5 py-2.5 text-[11px] text-muted">Counts only — visitor ids are never exposed here.</p>
        </Card>

        <Card>
          <CardHeader title="Consent-gated page views" description="Last 30 days · only from visitors who allowed analytics" icon={BarChart3} />
          <div className="p-5">
            <p className="font-display text-2xl font-extrabold text-forest">{analytics?.totals?.views ?? 0}</p>
            <p className="text-[11.5px] text-muted">recorded page views</p>
            <ul className="mt-3 space-y-1 text-[12px]">
              {(analytics?.topPaths || []).slice(0, 5).map((p) => (
                <li key={p.path} className="flex justify-between gap-3">
                  <span className="truncate font-mono text-[11px] text-ink">{p.path}</span>
                  <span className="shrink-0 text-muted">{p.views}</span>
                </li>
              ))}
              {!analytics?.topPaths?.length && <li className="text-muted">No analytics consent recorded yet.</li>}
            </ul>
          </div>
        </Card>
      </div>

      {isLoading ? <SkeletonRows count={4} /> : data?.length ? (
        <div className="space-y-3">
          {data.map((r) => (
            <Card key={r._id}>
              <CardHeader
                title={`${r.reference} · ${r.type} request`}
                description={`${r.user?.name} (${r.user?.email}) · submitted ${formatDateTime(r.createdAt)}`}
                icon={ShieldCheck}
                action={<Badge status={r.status}>{r.status}</Badge>}
              />
              <div className="space-y-2 p-5 text-[12.5px]">
                {r.details && <p className="text-muted"><span className="font-semibold text-ink">Student notes: </span>{r.details}</p>}
                <p className="text-muted"><span className="font-semibold text-ink">Verification: </span>{r.verificationStatus}
                  {r.completedAt && ` · completed ${formatDate(r.completedAt)}`}</p>
                {r.processingNotes && <p className="rounded-lg bg-canvas px-3 py-2 text-muted">Outcome: {r.processingNotes}</p>}
                {!['Completed', 'Rejected'].includes(r.status) && (
                  <div className="flex gap-2 border-t border-line pt-3">
                    <Button size="sm" variant="soft" onClick={() => setTarget(r)} icon={Check}>Process request</Button>
                    <Button size="sm" variant="ghost" className="text-danger hover:bg-red-50" onClick={() => { setTarget(r); setNotes('Rejected — insufficient verification'); }} icon={X}>Review</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={ShieldCheck} title="No privacy requests" description="Requests submitted from the student Privacy Center appear here." />}

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Process privacy request"
        description={target ? `${target.reference} · ${target.type}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => process('Rejected')}>Reject</Button>
            <Button variant="secondary" onClick={() => process('In Review')}>Mark in review</Button>
            <Button loading={busy} onClick={() => process('Completed')}>Mark completed</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Processing notes (shared with the student)" htmlFor="notes">
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was done, and what was provided." />
          </FormField>
          <FormField label="Legal exceptions (internal)" htmlFor="exceptions">
            <Textarea id="exceptions" rows={2} value={exceptions} onChange={(e) => setExceptions(e.target.value)} placeholder="e.g. Invoice records retained under tax law for 8 years." />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
