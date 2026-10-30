import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CreditCard, Download, Receipt, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { QrPaymentModal } from '../../components/forms/QrPaymentModal';
import { formatDate, formatDateTime, money, statusStyle } from '../../lib/utils';

export default function Payments() {
  const [receipt, setReceipt] = useState(null);
  const [payOrder, setPayOrder] = useState(null);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', 'mine'],
    queryFn: async () => (await api.get('/payments')).data.payments,
  });
  const { data: orders } = useQuery({
    queryKey: ['orders', 'awaiting-payment'],
    queryFn: async () => (await api.get('/orders', { params: { status: 'Awaiting Payment' } })).data.orders,
  });

  const verified = (payments || []).filter((p) => p.status === 'Verified' || p.status === 'Refunded' || p.status === 'Partially Refunded');
  const total = verified.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Payments & receipts" description="Verified payments, pending amounts and downloadable receipts. We never store card details." />

      {orders?.length > 0 && (
        <Card className="mb-4 border-amber/40 bg-amber/5">
          <CardHeader title="Awaiting payment" description="These orders are approved and ready once payment is verified" icon={CreditCard} />
          <ul className="divide-y divide-line">
            {orders.map((o) => (
              <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-[13px] font-semibold text-ink">{o.title}</p>
                  <p className="text-[11.5px] text-muted">{o.reference} · {o.serviceName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-forest">{money(o.agreedAmount, o.currency)}</span>
                  <Button size="sm" onClick={() => setPayOrder(o)} icon={CreditCard}>Pay now</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Total verified</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-forest">{money(total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Transactions</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">{payments?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-bold tracking-wide text-muted uppercase">Refunded</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">
            {money((payments || []).flatMap((p) => p.refunds || []).reduce((s, r) => s + r.amount, 0))}
          </p>
        </Card>
      </div>

      {isLoading ? <SkeletonRows count={3} /> : payments?.length ? (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.1fr_1.3fr_0.8fr_0.8fr_0.9fr_auto] gap-3 border-b border-line bg-canvas px-5 py-2.5 text-[11px] font-bold tracking-wide text-muted uppercase lg:grid">
            <span>Reference</span><span>Order</span><span>Amount</span><span>Status</span><span>Verified</span><span />
          </div>
          <ul className="divide-y divide-line">
            {payments.map((p) => (
              <li key={p._id} className="grid items-center gap-2 px-5 py-3.5 lg:grid-cols-[1.1fr_1.3fr_0.8fr_0.8fr_0.9fr_auto] lg:gap-3">
                <div>
                  <p className="font-mono text-[11.5px] font-semibold text-ink">{p.reference}</p>
                  <p className="text-[10.5px] text-muted">{p.provider} · {p.invoiceNumber}</p>
                </div>
                <Link to={p.order?._id ? `/dashboard/orders/${p.order._id}` : '/dashboard/orders'} className="truncate text-[12.5px] text-forest hover:underline">
                  {p.order?.title || '—'}
                </Link>
                <p className="text-[12.5px] font-semibold text-ink">{money(p.amount, p.currency)}</p>
                <Badge status={p.status}>{p.status}</Badge>
                <p className="text-[11.5px] text-muted">{p.verifiedAt ? formatDate(p.verifiedAt) : '—'}</p>
                <Button size="sm" variant="ghost" disabled={p.status !== 'Verified' && p.status !== 'Refunded'} onClick={() => setReceipt(p)} icon={Receipt}>Receipt</Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState icon={CreditCard} title="No payments yet" description="Once you accept a quotation, payment options appear here. Every payment is verified on the server before an order is confirmed." actionLabel="View quotations" actionTo="/dashboard/quotations" />
      )}

      <Modal open={Boolean(receipt)} onClose={() => setReceipt(null)} title="Payment receipt" description={receipt?.invoiceNumber} footer={<Button variant="secondary" onClick={() => window.print()}>Print / save as PDF</Button>}>
        {receipt && (
          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <p className="font-display text-lg font-bold text-forest">Acadexa</p>
                <p className="text-[11px] text-muted">Academic support & consultancy</p>
              </div>
              <Badge status={receipt.status}>{receipt.status}</Badge>
            </div>
            {[
              ['Receipt no.', receipt.invoiceNumber],
              ['Payment reference', receipt.reference],
              ['Order', receipt.order?.reference || '—'],
              ['Amount', money(receipt.amount, receipt.currency)],
              ['Provider', receipt.provider],
              ['Provider payment id', receipt.providerPaymentId],
              ['Verified at', formatDateTime(receipt.verifiedAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><span className="text-muted">{k}</span><span className="text-right font-medium text-ink">{v}</span></div>
            ))}
            {receipt.refunds?.length > 0 && (
              <div className="rounded-lg bg-canvas p-3">
                <p className="text-[11px] font-bold text-muted uppercase">Refunds</p>
                {receipt.refunds.map((r, i) => (
                  <p key={i} className="mt-1 text-[12px]">{money(r.amount, receipt.currency)} · {r.status} · {formatDate(r.at)}</p>
                ))}
              </div>
            )}
            <p className="flex items-start gap-2 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald" aria-hidden />
              This receipt is issued for a server-verified payment. Card details are never stored by Acadexa.
            </p>
          </div>
        )}
      </Modal>

      <QrPaymentModal open={Boolean(payOrder)} onClose={() => setPayOrder(null)} order={payOrder} />
    </div>
  );
}
