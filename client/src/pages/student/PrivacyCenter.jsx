import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ShieldCheck, Download, PencilLine, Trash2, Send, FileSearch, Info, Monitor, LogOut, Loader2, Cookie } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Textarea, FormField, Select } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatDate, formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const TYPES = [
  { value: 'access', label: 'Access — what data do you hold about me?', icon: FileSearch },
  { value: 'correction', label: 'Correction — fix inaccurate details', icon: PencilLine },
  { value: 'export', label: 'Export — receive a copy of my data', icon: Download },
  { value: 'deletion', label: 'Deletion — erase eligible personal data', icon: Trash2 },
];

export default function PrivacyCenter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('access');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => (await api.get('/auth/sessions')).data.sessions,
  });
  const { data: consentHistory } = useQuery({
    queryKey: ['consent', 'mine'],
    queryFn: async () => (await api.get('/consent/me')).data,
  });
  const [revoking, setRevoking] = useState(null);

  const revokeSession = async (session) => {
    const label = session.current ? 'this device (you will be returned to the sign-in page)' : session.userAgent.slice(0, 60);
    if (!window.confirm(`Sign out ${label}?`)) return;
    setRevoking(session.id);
    try {
      const { data } = await api.delete(`/auth/sessions/${session.id}`);
      toast.success(data.message || 'Device signed out');
      if (data.signedOutCurrent) window.location.assign('/login');
      else qc.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setRevoking(null);
    }
  };

  const signOutEverywhere = async () => {
    if (!window.confirm('Sign out of every device, including this one?')) return;
    try {
      await api.post('/auth/logout-all');
      toast.success('Signed out everywhere');
      window.location.assign('/login');
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const { data: requests } = useQuery({ queryKey: ['privacy', 'mine'], queryFn: async () => (await api.get('/privacy')).data.requests });
  const { data: summary } = useQuery({ queryKey: ['privacy', 'summary'], queryFn: async () => (await api.get('/privacy/data-summary')).data });

  const submit = async () => {
    setBusy(true);
    try {
      await api.post('/privacy', { type, details });
      toast.success('Privacy request submitted — you will receive a reference');
      setOpen(false);
      setDetails('');
      qc.invalidateQueries({ queryKey: ['privacy'] });
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Privacy Center" description="Understand what we hold, and exercise your access, correction, export and deletion rights." />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Your request options" icon={ShieldCheck} />
            <div className="grid gap-2.5 p-5 sm:grid-cols-2">
              {TYPES.map((t) => (
                <button key={t.value} onClick={() => { setType(t.value); setOpen(true); }} className="group flex items-start gap-2.5 rounded-xl border border-line p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald/40 hover:shadow-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mint text-forest"><t.icon className="size-4" aria-hidden /></span>
                  <span>
                    <span className="block text-[12.5px] font-semibold text-ink">{t.label.split('—')[0].trim()}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{t.label.split('—')[1]?.trim()}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Active devices"
              description="Every session that can currently access your account"
              icon={Monitor}
              action={sessions?.length > 1 ? <Button size="sm" variant="ghost" className="text-danger hover:bg-red-50" onClick={signOutEverywhere} icon={LogOut}>Sign out all</Button> : null}
            />
            <div className="divide-y divide-line">
              {sessionsLoading ? (
                <p className="px-5 py-6 text-[12.5px] text-muted">Loading sessions…</p>
              ) : sessions?.length ? sessions.map((sess) => (
                <div key={sess.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-ink">
                      <span className="truncate">{sess.userAgent}</span>
                      {sess.current && <Badge tone="success">this device</Badge>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {sess.ip} · last active {formatDateTime(sess.lastSeenAt)} · expires {formatDate(sess.expiresAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-red-50"
                    onClick={() => revokeSession(sess)}
                    loading={revoking === sess.id}
                  >
                    {revoking === sess.id ? 'Signing out…' : 'Sign out'}
                  </Button>
                </div>
              )) : <p className="px-5 py-8 text-center text-[12.5px] text-muted">No active sessions.</p>}
            </div>
            <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-muted">
              Changing your password signs out every other device automatically.
            </p>
          </Card>

          <Card>
            <CardHeader title="Cookie consent" description="What you allowed on this and other browsers" icon={Cookie} />
            <div className="divide-y divide-line">
              {consentHistory?.records?.length ? consentHistory.records.map((r) => (
                <div key={r.visitorId} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                    <span className="font-semibold text-ink capitalize">{r.action.replace('_', ' ')}</span>
                    <Badge tone={r.analytics ? 'success' : 'neutral'}>analytics {r.analytics ? 'on' : 'off'}</Badge>
                    <Badge tone={r.marketing ? 'success' : 'neutral'}>marketing {r.marketing ? 'on' : 'off'}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {formatDateTime(r.updatedAt)} · policy version {r.policyVersion} · browser {r.visitorId.slice(0, 8)}…
                  </p>
                  {r.history?.length > 1 && (
                    <p className="mt-1 text-[11px] text-muted">
                      {r.history.length} recorded changes — most recent: {r.history[0].action.replace('_', ' ')} on {formatDate(r.history[0].at)}
                    </p>
                  )}
                </div>
              )) : (
                <p className="px-5 py-6 text-[12.5px] text-muted">
                  No consent recorded for this account yet. Use “Cookie preferences” in the footer to choose.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Request history" description="Every request has a reference and a status you can follow" icon={FileSearch} />
            <div className="divide-y divide-line">
              {requests?.length ? requests.map((r) => (
                <div key={r._id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink capitalize">{r.type} request · <span className="font-mono text-[11px] font-normal text-muted">{r.reference}</span></p>
                    <p className="mt-0.5 text-[11px] text-muted">Submitted {formatDateTime(r.createdAt)}{r.completedAt ? ` · completed ${formatDate(r.completedAt)}` : ''}</p>
                    {r.details && <p className="mt-1 line-clamp-2 text-[11.5px] text-muted">{r.details}</p>}
                    {r.processingNotes && <p className="mt-1 rounded-lg bg-canvas px-2.5 py-1.5 text-[11.5px] text-forest">Outcome: {r.processingNotes}</p>}
                  </div>
                  <Badge status={r.status}>{r.status}</Badge>
                </div>
              )) : <p className="px-5 py-8 text-center text-[12.5px] text-muted">No privacy requests submitted yet.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Account snapshot" icon={Info} />
            <div className="space-y-2 p-5 text-[12.5px]">
              <div className="flex justify-between"><span className="text-muted">Name</span><span className="font-medium text-ink">{user?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted">Email</span><span className="font-medium text-ink">{user?.email}</span></div>
              <div className="flex justify-between"><span className="text-muted">Email verified</span><span className="text-ink">{user?.emailVerified ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-muted">Account created</span><span className="text-ink">{formatDate(user?.createdAt)}</span></div>
              <div className="mt-2 space-y-1 border-t border-line pt-2">
                <div className="flex justify-between"><span className="text-muted">Orders</span><span className="text-ink">{summary?.records?.orders ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Payments</span><span className="text-ink">{summary?.records?.payments ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Support tickets</span><span className="text-ink">{summary?.records?.tickets ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Privacy requests</span><span className="text-ink">{summary?.records?.privacyRequests ?? '—'}</span></div>
              </div>
            </div>
          </Card>

          <Card className="bg-mint/60">
            <div className="space-y-2 p-5">
              <p className="text-[12.5px] font-semibold text-forest">How your data is handled</p>
              <ul className="space-y-1.5 text-[11.5px] leading-relaxed text-forest/80">
                <li>• Files are private by default and purged after 24 months.</li>
                <li>• Payments and invoices are retained as required by tax law.</li>
                <li>• Access is role-based; sensitive admin actions are logged.</li>
                <li>• We respond to privacy requests within 30 days.</li>
              </ul>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button to="/privacy-policy" size="sm" variant="secondary">Privacy Policy</Button>
                <Button to="/contact" size="sm" variant="ghost">Contact privacy team</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Submit a ${type} request`}
        description="Your signed-in session verifies ownership. We will confirm by email and respond within 30 days."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={submit} icon={Send}>Submit request</Button></>}
      >
        <div className="space-y-4">
          <FormField label="Request type" htmlFor="privacy-type">
            <Select id="privacy-type" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label.split('—')[0].trim()}</option>)}
            </Select>
          </FormField>
          <FormField label="Details" htmlFor="privacy-details" hint="Optional but helps us act faster">
            <Textarea id="privacy-details" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="For corrections, tell us what should change. For deletion, note anything you need retained." />
          </FormField>
          {type === 'deletion' && (
            <p className="rounded-xl border border-amber/30 bg-amber/10 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-[#8a6a12]">
              Invoices and payment records must be retained for statutory periods and cannot be erased. Other personal identifiers can be removed or anonymised.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
