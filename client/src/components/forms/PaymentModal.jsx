import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreditCard, ShieldCheck, Lock } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, FormField } from '../ui/Field';
import { money } from '../../lib/utils';

/**
 * Sandbox checkout. It mirrors the real provider flow: create order on the server,
 * "pay", then submit the payment id + signature to the server for verification.
 * In production this component is replaced by the provider's checkout widget.
 */
export function PaymentModal({ open, onClose, order, onVerified }) {
  const qc = useQueryClient();
  const [step, setStep] = useState('review');
  const [coupon, setCoupon] = useState('');
  const [intent, setIntent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const createIntent = async (withCoupon) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/payments/create', { orderId: order._id, couponCode: withCoupon || undefined });
      setIntent(data);
      setStep('checkout');
    } catch (err) {
      setError(apiMessage(err, 'Could not start payment.'));
    } finally {
      setBusy(false);
    }
  };

  const simulatePay = async () => {
    setBusy(true);
    setError('');
    try {
      const providerPaymentId = `pay_sbx_${Math.random().toString(36).slice(2, 12)}`;
      // The signature is produced by the provider in production. The sandbox helper
      // endpoint signs it server-side so the verification path is genuinely exercised.
      const { data: signed } = await api.post(`/payments/${intent.payment._id}/sandbox-sign`, { providerPaymentId });
      await api.post('/payments/verify', {
        providerOrderId: intent.checkout.providerOrderId,
        providerPaymentId,
        signature: signed.signature,
      });
      toast.success('Payment verified — your order is confirmed');
      qc.invalidateQueries();
      onVerified?.();
      onClose();
      setStep('review');
      setIntent(null);
    } catch (err) {
      setError(apiMessage(err, 'Payment could not be verified. No amount has been recorded as received.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === 'review' ? 'Complete payment' : 'Secure checkout (sandbox)'}
      description={order ? `${order.reference} · ${order.serviceName || ''}` : undefined}
      footer={
        step === 'review' ? (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button loading={busy} onClick={() => createIntent(coupon)} icon={CreditCard}>Continue to payment</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setStep('review')}>Back</Button>
            <Button loading={busy} onClick={simulatePay} icon={Lock}>Pay {money(intent?.payment?.amount, intent?.payment?.currency)}</Button>
          </>
        )
      }
    >
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-danger">{error}</div>}

      {step === 'review' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Agreed amount</span>
              <span className="font-display text-lg font-bold text-forest">{money(order?.agreedAmount, order?.currency)}</span>
            </div>
            {order?.discountAmount > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-[12px] text-emerald">
                <span>Discount applied</span><span>− {money(order.discountAmount, order.currency)}</span>
              </div>
            )}
            <p className="mt-2 border-t border-line pt-2 text-[11.5px] leading-relaxed text-muted">
              Amounts are validated on the server against the accepted quotation. Payment is verified before the order is confirmed.
            </p>
          </div>
          <FormField label="Coupon code (optional)" htmlFor="coupon">
            <Input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" />
          </FormField>
          <p className="flex items-start gap-2 rounded-xl bg-mint px-3.5 py-2.5 text-[11.5px] leading-relaxed text-forest">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            Card details are handled by the payment provider and never reach or get stored by Acadexa. This environment uses the sandbox gateway.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-line p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">Amount to pay</span>
              <span className="font-display text-xl font-bold text-forest">{money(intent?.payment?.amount, intent?.payment?.currency)}</span>
            </div>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[11.5px]">
              <div className="flex justify-between"><dt className="text-muted">Payment reference</dt><dd className="font-mono text-ink">{intent?.payment?.reference}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Provider order</dt><dd className="max-w-[60%] truncate font-mono text-ink">{intent?.checkout?.providerOrderId}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Provider</dt><dd className="text-ink">{intent?.payment?.provider} (test mode)</dd></div>
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['UPI', 'Card', 'Netbanking', 'Wallet'].map((m) => (
              <span key={m} className="rounded-lg border border-line bg-canvas px-3 py-2 text-center text-[12px] font-medium text-muted">{m}</span>
            ))}
          </div>
          <p className="text-[11.5px] leading-relaxed text-muted">
            Pressing Pay simulates the provider's confirmation. The server verifies the HMAC signature, records the transaction once (duplicate events are rejected) and confirms your order.
          </p>
        </div>
      )}
    </Modal>
  );
}
