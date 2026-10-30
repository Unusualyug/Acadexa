import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreditCard, RotateCcw, ShieldCheck, Search } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FormField, Input, Textarea } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { PillTabs } from '../../components/ui/Tabs';
import { formatDate, formatDateTime, money, statusStyle } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const TABS = ['All', 'Verified', 'Pending', 'Failed', 'Refunded'];

export default function AdminPayments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('All');
  const [refundTarget, setRefundTarget] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments', tab],
    queryFn: async () => (await api.get('/payments/staff/all', { params: tab === 'All' ? {} : { status: tab } })).data.payments,
    enabled: ['admin', 'owner'].includes(user?.role),
  });

  if (!['admin', 'owner'].includes(user?.role)) {
    return <EmptyState title="Restricted" description="Payment and refund management requires administrator permissions." actionLabel="Back" actionTo="/admin" />;
  }

  const verifiedTotal = (data || []).filter((p) => p.status === 'Verified').reduce((s, p) => s + p.amount, 0);

  const refund = async () => {
    setBusy(true);
    try {
      await api.post(`/payments/${refundTarget._id}/refund`, { amount: amount ? Number(amount) : undefined, reason });
      toast.success('Refund processed and student notified');
      setRefundTarget(null);
      setAmount(''); setReason('');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Payments & refunds" description="Only server-verified transactions count as revenue. Refunds are processed against the original payment." />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Verified (current filter)</p><p className="mt-1 font-display text-2xl font-extrabold text-forest">{money(verifiedTotal)}</p></Card>
        <Card className="p-4"><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Transactions</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">{data?.length || 0}</p></Card>
        <Card className="p-4"><p className="text-[11px] font-bold tracking-wide text-muted uppercase">Refunded total</p><p className="mt-1 font-display text-2xl font-extrabold text-ink">{money((data || []).flatMap((p) => p.refunds || []).reduce((s, r) => s + r.amount, 0))}</p></Card>
      </div>

      <PillTabs options={TABS} value={tab} onChange={setTab} className="mb-4 w-fit" layoutId="admin-payments-tab" />

      {isLoading ? <SkeletonRows count={5} /> : data?.length ? (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1fr_1.2fr_1fr_0.7fr_0.8fr_0.9fr_auto] gap-3 border-b border-line bg-canvas px-5 py-2.5 text-[11px] font-bold tracking-wide text-muted uppercase lg:grid">
            <span>Reference</span><span>Student / order</span><span>Provider</span><span>Amount</span><span>Status</span><span>Verified</span><span />
          </div>
          <ul className="divide-y divide-line">
            {data.map((p) => (
              <li key={p._id} className="grid items-center gap-2 px-5 py-3.5 lg:grid-cols-[1fr_1.2fr_1fr_0.7fr_0.8fr_0.9fr_auto] lg:gap-3">
                <div>
                  <p className="font-mono text-[11px] text-ink">{p.reference}</p>
                  <p className="text-[10px] text-muted">{p.invoiceNumber}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-ink">{p.student?.name}</p>
                  <p className="font-mono text-[10px] text-muted">{p.order?.reference}</p>
                </div>
                <p className="text-[11.5px] text-muted">{p.provider}</p>
                <p className="text-[12px] font-semibold text-ink">{money(p.amount, p.currency)}</p>
                <Badge status={p.status}>{p.status}</Badge>
                <p className="text-[11px] text-muted">{p.verifiedAt ? formatDate(p.verifiedAt) : '—'}</p>
                <Button size="sm" variant="ghost" disabled={p.status !== 'Verified'} onClick={() => { setRefundTarget(p); setAmount(String(p.amount)); }} icon={RotateCcw}>Refund</Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState icon={CreditCard} title="No payments" description="Verified payments appear here after the provider confirms them server-side." />
      )}

      <Modal
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Process refund"
        description={refundTarget ? `${refundTarget.reference} · captured ${money(refundTarget.amount, refundTarget.currency)}` : ''}
        footer={<><Button variant="secondary" onClick={() => setRefundTarget(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={refund}>Issue refund</Button></>}
      >
        <div className="space-y-4">
          <FormField label="Refund amount" htmlFor="refund-amount" required>
            <Input id="refund-amount" type="number" min="1" max={refundTarget?.amount} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormField>
          <FormField label="Reason (recorded)" htmlFor="refund-reason">
            <Textarea id="refund-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Order cancelled before work began — Refund Policy §2" />
          </FormField>
          <p className="flex items-start gap-2 rounded-xl bg-amber/10 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-[#8a6a12]">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Refunds must match the published Refund & Cancellation Policy and are recorded in the audit log with the actor and amount.
          </p>
        </div>
      </Modal>
    </div>
  );
}
