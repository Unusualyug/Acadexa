import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Payment gateway adapter.
 *
 * `sandbox` mode mirrors the Razorpay flow (create order -> client checkout ->
 * server-side signature verification -> webhook) without live credentials, so the
 * whole lifecycle is exercised. Set PAYMENT_PROVIDER=razorpay plus real keys and
 * implement createOrder/capture through the provider SDK to go live.
 */
export const gateway = {
  name: env.paymentProvider,

  async createOrder({ amount, currency, receipt }) {
    if (env.paymentProvider === 'razorpay' && env.paymentKeyId && env.paymentKeySecret) {
      throw new ApiError(503, 'Live gateway keys detected but the provider SDK adapter is not installed. Install razorpay and implement createOrder().');
    }
    return {
      providerOrderId: `order_sbx_${crypto.randomBytes(10).toString('hex')}`,
      amount,
      currency,
      receipt,
      keyId: env.paymentKeyId || 'rzp_test_sandbox',
      sandbox: true,
    };
  },

  /** Same HMAC construction Razorpay uses: order_id|payment_id signed with the key secret. */
  signPayment({ providerOrderId, providerPaymentId }) {
    return crypto
      .createHmac('sha256', env.paymentKeySecret || 'sandbox_secret_key_change_me')
      .update(`${providerOrderId}|${providerPaymentId}`)
      .digest('hex');
  },

  verifyPaymentSignature({ providerOrderId, providerPaymentId, signature }) {
    const expected = this.signPayment({ providerOrderId, providerPaymentId });
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature || ''));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },

  verifyWebhook(rawBody, signature) {
    if (!env.paymentWebhookSecret) return false;
    const expected = crypto.createHmac('sha256', env.paymentWebhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature || ''));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  },
};
