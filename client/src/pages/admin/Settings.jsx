import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save, ShieldCheck, CreditCard, Mail, Globe, Percent } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField, Input, Textarea, Select } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, money } from '../../lib/utils';

export default function AdminSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('business');
  const [form, setForm] = useState(null);
  const [coupon, setCoupon] = useState({ code: '', type: 'percentage', value: 10, minOrderValue: 0, maxUses: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => (await api.get('/admin/settings')).data.settings,
  });
  const { data: coupons } = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => (await api.get('/admin/coupons')).data.coupons,
    enabled: ['admin', 'owner'].includes(user?.role),
  });

  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const save = async (section) => {
    try {
      await api.patch('/admin/settings', { [section]: form[section] });
      toast.success('Settings saved');
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const set = (section, key, value) => setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));

  const createCoupon = async () => {
    try {
      await api.post('/admin/coupons', coupon);
      toast.success('Coupon created');
      setCoupon({ code: '', type: 'percentage', value: 10, minOrderValue: 0, maxUses: 0 });
      qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  if (isLoading || !form) return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;

  const readOnly = !['admin', 'owner'].includes(user?.role);

  return (
    <div>
      <PageHeader
        title="System settings"
        description="Business identity, defaults and integration status. Secrets stay in environment variables — never in the database."
        action={<Badge tone={readOnly ? 'neutral' : 'success'}>{readOnly ? 'Read only' : 'Editable'}</Badge>}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[['business', 'Business identity', Globe], ['defaults', 'Service defaults', SettingsIcon], ['content', 'Public content', Mail], ['notifications', 'Notifications', Mail], ['integrations', 'Integrations', CreditCard], ['coupons', 'Coupons', Percent]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${tab === key ? 'border-forest bg-forest text-white' : 'border-line bg-white text-muted hover:text-ink'}`}>
            <Icon className="size-3.5" aria-hidden />{label}
          </button>
        ))}
      </div>

      {tab === 'business' && (
        <Card>
          <CardHeader title="Business identity" description="Shown across the public site, emails and receipts" icon={Globe} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <FormField label="Business name" htmlFor="biz-name"><Input id="biz-name" value={form.business.name} onChange={(e) => set('business', 'name', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="Tagline" htmlFor="biz-tagline"><Input id="biz-tagline" value={form.business.tagline} onChange={(e) => set('business', 'tagline', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="Brand message" htmlFor="biz-message" className="sm:col-span-2"><Textarea id="biz-message" rows={2} value={form.business.message} onChange={(e) => set('business', 'message', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="Support email" htmlFor="biz-email"><Input id="biz-email" value={form.business.email} onChange={(e) => set('business', 'email', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="Phone" htmlFor="biz-phone"><Input id="biz-phone" value={form.business.phone} onChange={(e) => set('business', 'phone', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="WhatsApp (optional)" htmlFor="biz-wa"><Input id="biz-wa" value={form.business.whatsapp} onChange={(e) => set('business', 'whatsapp', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="Address" htmlFor="biz-address"><Input id="biz-address" value={form.business.address} onChange={(e) => set('business', 'address', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="Currency" htmlFor="biz-currency"><Select id="biz-currency" value={form.business.currency} onChange={(e) => set('business', 'currency', e.target.value)} disabled={readOnly}><option>INR</option><option>USD</option></Select></FormField>
            <FormField label="Time zone" htmlFor="biz-tz"><Input id="biz-tz" value={form.business.timezone} onChange={(e) => set('business', 'timezone', e.target.value)} disabled={readOnly} /></FormField>
          </div>
          <div className="flex justify-end border-t border-line px-5 py-3.5"><Button onClick={() => save('business')} disabled={readOnly} icon={Save}>Save business details</Button></div>
        </Card>
      )}

      {tab === 'defaults' && (
        <Card>
          <CardHeader title="Operational defaults" description="Applied to new quotations, uploads and retention" icon={SettingsIcon} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <FormField label="Quotation validity (days)" htmlFor="d-q"><Input id="d-q" type="number" min="1" max="60" value={form.defaults.quotationValidDays} onChange={(e) => set('defaults', 'quotationValidDays', Number(e.target.value))} disabled={readOnly} /></FormField>
            <FormField label="Default revision limit" htmlFor="d-r"><Input id="d-r" type="number" min="0" max="20" value={form.defaults.revisionLimit} onChange={(e) => set('defaults', 'revisionLimit', Number(e.target.value))} disabled={readOnly} /></FormField>
            <FormField label="Max upload size (MB)" htmlFor="d-f"><Input id="d-f" type="number" min="1" max="50" value={form.defaults.maxFileMb} onChange={(e) => set('defaults', 'maxFileMb', Number(e.target.value))} disabled={readOnly} /></FormField>
            <FormField label="Data retention (months)" htmlFor="d-ret"><Input id="d-ret" type="number" min="1" max="120" value={form.defaults.dataRetentionMonths} onChange={(e) => set('defaults', 'dataRetentionMonths', Number(e.target.value))} disabled={readOnly} /></FormField>
            <label className="flex items-center gap-2 text-[13px] text-ink sm:col-span-2">
              <input type="checkbox" checked={form.defaults.servicesOpen} onChange={(e) => set('defaults', 'servicesOpen', e.target.checked)} disabled={readOnly} className="size-4 accent-forest" />
              Accept new service requests
            </label>
          </div>
          <div className="flex justify-end border-t border-line px-5 py-3.5"><Button onClick={() => save('defaults')} disabled={readOnly} icon={Save}>Save defaults</Button></div>
        </Card>
      )}

      {tab === 'content' && (
        <Card>
          <CardHeader title="Public content" description="Homepage copy controlled by the administrator" icon={Mail} />
          <div className="grid gap-4 p-5">
            <FormField label="Hero headline" htmlFor="c-h"><Input id="c-h" value={form.content.heroHeadline} onChange={(e) => set('content', 'heroHeadline', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="Hero supporting text" htmlFor="c-s"><Textarea id="c-s" rows={3} value={form.content.heroSubtext} onChange={(e) => set('content', 'heroSubtext', e.target.value)} disabled={readOnly} /></FormField>
            <FormField label="Announcement banner" htmlFor="c-a" hint="Leave empty to hide"><Input id="c-a" value={form.content.announcement} onChange={(e) => set('content', 'announcement', e.target.value)} disabled={readOnly} /></FormField>
          </div>
          <div className="flex justify-end border-t border-line px-5 py-3.5"><Button onClick={() => save('content')} disabled={readOnly} icon={Save}>Save content</Button></div>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHeader title="Notification settings" description="Email delivery is provider-dependent; failures are tracked per notification" icon={Mail} />
          <div className="space-y-3 p-5">
            {[['emailEnabled', 'Enable email notifications'], ['quotationReminders', 'Send quotation expiry reminders'], ['deadlineReminders', 'Send deadline reminders']].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                <span className="text-[13px] text-ink">{label}</span>
                <input type="checkbox" checked={Boolean(form.notifications[key])} onChange={(e) => set('notifications', key, e.target.checked)} disabled={readOnly} className="size-4 accent-forest" />
              </label>
            ))}
            <p className="rounded-xl bg-canvas px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted">
              Email templates are managed by the notification service. In this environment messages are logged rather than delivered — the interface states this instead of implying delivery.
            </p>
          </div>
          <div className="flex justify-end border-t border-line px-5 py-3.5"><Button onClick={() => save('notifications')} disabled={readOnly} icon={Save}>Save notification settings</Button></div>
        </Card>
      )}

      {tab === 'integrations' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Payment provider" icon={CreditCard} action={<Badge tone={form.integrations.paymentConfigured ? 'success' : 'warn'}>{form.integrations.paymentConfigured ? 'Configured' : 'Sandbox'}</Badge>} />
            <div className="space-y-2 p-5 text-[12.5px]">
              <div className="flex justify-between"><span className="text-muted">Provider</span><span className="text-ink">{form.integrations.paymentProvider}</span></div>
              <div className="flex justify-between"><span className="text-muted">Mode</span><span className="text-ink">{form.integrations.paymentConfigured ? 'Live keys detected' : 'Test / sandbox'}</span></div>
              <p className="rounded-xl bg-canvas px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted">
                Keys are read from environment variables (PAYMENT_KEY_ID, PAYMENT_KEY_SECRET, PAYMENT_WEBHOOK_SECRET) and never stored in the database or exposed to the browser. Webhook signatures are verified with HMAC before any payment is marked verified.
              </p>
            </div>
          </Card>
          <Card>
            <CardHeader title="Email delivery" icon={Mail} action={<Badge tone={form.integrations.emailConfigured ? 'success' : 'warn'}>{form.integrations.emailConfigured ? 'Configured' : 'Log only'}</Badge>} />
            <div className="space-y-2 p-5 text-[12.5px]">
              <div className="flex justify-between"><span className="text-muted">Provider</span><span className="text-ink">{form.integrations.emailProvider}</span></div>
              <p className="rounded-xl bg-canvas px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted">
                Swap the sendEmail() adapter for a transactional provider to enable real delivery. Notification records store the delivery state (queued, sent, failed) so failures remain visible.
              </p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'coupons' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Create coupon" description="Discounts are validated server-side on payment creation" icon={Percent} />
            <div className="grid gap-4 p-5 sm:grid-cols-5">
              <FormField label="Code" htmlFor="c-code"><Input id="c-code" value={coupon.code} onChange={(e) => setCoupon((c) => ({ ...c, code: e.target.value.toUpperCase() }))} /></FormField>
              <FormField label="Type" htmlFor="c-type"><Select id="c-type" value={coupon.type} onChange={(e) => setCoupon((c) => ({ ...c, type: e.target.value }))}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></Select></FormField>
              <FormField label="Value" htmlFor="c-val"><Input id="c-val" type="number" min="1" value={coupon.value} onChange={(e) => setCoupon((c) => ({ ...c, value: Number(e.target.value) }))} /></FormField>
              <FormField label="Min order" htmlFor="c-min"><Input id="c-min" type="number" min="0" value={coupon.minOrderValue} onChange={(e) => setCoupon((c) => ({ ...c, minOrderValue: Number(e.target.value) }))} /></FormField>
              <FormField label="Max uses" htmlFor="c-max" hint="0 = unlimited"><Input id="c-max" type="number" min="0" value={coupon.maxUses} onChange={(e) => setCoupon((c) => ({ ...c, maxUses: Number(e.target.value) }))} /></FormField>
            </div>
            <div className="flex justify-end border-t border-line px-5 py-3.5"><Button onClick={createCoupon} disabled={readOnly || !coupon.code} icon={Percent}>Create coupon</Button></div>
          </Card>
          <Card>
            <CardHeader title="Existing coupons" icon={Percent} />
            <ul className="divide-y divide-line">
              {coupons?.length ? coupons.map((c) => (
                <li key={c._id} className="flex items-center justify-between px-5 py-3 text-[12.5px]">
                  <div>
                    <p className="font-mono font-semibold text-ink">{c.code}</p>
                    <p className="text-[11px] text-muted">{c.type === 'percentage' ? `${c.value}% off` : `${money(c.value)} off`} · min {money(c.minOrderValue)} · used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</p>
                  </div>
                  <Badge tone={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                </li>
              )) : <li className="px-5 py-6 text-center text-[12px] text-muted">No coupons created.</li>}
            </ul>
          </Card>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
        <ShieldCheck className="size-3.5 text-emerald" aria-hidden />
        Secrets (JWT signing key, payment keys, webhook secrets) live in environment variables only. Last updated {formatDate(form.updatedAt)}.
      </p>
    </div>
  );
}
