import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LifeBuoy, Mail, Send, StickyNote, Inbox } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Textarea, Select } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { PillTabs } from '../../components/ui/Tabs';
import { formatDateTime, initials } from '../../lib/utils';

const TABS = ['Tickets', 'Enquiries'];

export default function AdminSupport() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('Tickets');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['admin', 'tickets', statusFilter],
    queryFn: async () => (await api.get('/support/staff/all', { params: statusFilter ? { status: statusFilter } : {} })).data.tickets,
  });
  const { data: enquiries } = useQuery({
    queryKey: ['admin', 'enquiries'],
    queryFn: async () => (await api.get('/support/staff/enquiries')).data.enquiries,
  });
  const active = tickets?.find((t) => t._id === activeId) || tickets?.[0];
  const { data: thread, refetch } = useQuery({
    queryKey: ['admin', 'ticket', active?._id],
    queryFn: async () => (await api.get(`/support/${active._id}`)).data,
    enabled: Boolean(active?._id) && tab === 'Tickets',
  });

  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await api.post(`/support/${active._id}/reply`, { body: reply.trim(), internal });
      setReply(''); setInternal(false);
      refetch();
      qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      toast.success('Reply sent');
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const setStatus = async (status) => {
    try {
      await api.patch(`/support/staff/${active._id}`, { status, resolution: status === 'Resolved' ? reply || 'Resolved after review.' : undefined });
      toast.success(`Ticket marked ${status}`);
      qc.invalidateQueries({ queryKey: ['admin', 'tickets'] });
      refetch();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Support inbox" description="Student tickets and public enquiries. Internal notes are never visible to students." />

      <PillTabs options={TABS} value={tab} onChange={setTab} className="mb-4 w-fit" layoutId="admin-support-tab" />

      {tab === 'Tickets' ? (
        isLoading ? <SkeletonRows count={4} /> : tickets?.length ? (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="h-fit">
              <CardHeader title="Tickets" description={`${tickets.length} shown`} icon={LifeBuoy} action={
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status" className="h-8 w-32 text-[12px]">
                  <option value="">All</option><option>Open</option><option>In Progress</option><option>Awaiting Student</option><option>Resolved</option><option>Closed</option>
                </Select>
              } />
              <ul className="max-h-[34rem] divide-y divide-line overflow-y-auto">
                {tickets.map((t) => (
                  <li key={t._id}>
                    <button onClick={() => setActiveId(t._id)} className={`w-full px-5 py-3 text-left hover:bg-canvas ${active?._id === t._id ? 'bg-mint/60' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12.5px] font-semibold text-ink">{t.subject}</p>
                        <Badge status={t.status}>{t.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-[10.5px] text-muted">{t.reference} · {t.student?.name} · {t.category}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="min-h-[32rem]">
              {active ? (
                <>
                  <CardHeader title={active.subject} description={`${active.reference} · ${active.student?.name} (${active.student?.email})`} icon={Mail}
                    action={<div className="flex gap-1.5">
                      <Button size="sm" variant="soft" onClick={() => setStatus('In Progress')}>In progress</Button>
                      <Button size="sm" variant="secondary" onClick={() => setStatus('Resolved')}>Resolve</Button>
                    </div>} />
                  <div className="max-h-[22rem] space-y-3 overflow-y-auto p-5">
                    <div className="rounded-xl border border-line bg-canvas p-3.5">
                      <p className="text-[12.5px] whitespace-pre-wrap text-ink">{active.description}</p>
                      <p className="mt-1.5 text-[10.5px] text-muted">{formatDateTime(active.createdAt)} · {active.category}</p>
                    </div>
                    {thread?.messages?.map((m) => (
                      <div key={m._id} className={`flex gap-2 ${m.senderRole !== 'student' ? 'flex-row-reverse' : ''}`}>
                        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${m.senderRole !== 'student' ? 'bg-forest text-white' : 'bg-white text-forest ring-1 ring-line'}`}>{initials(m.sender?.name || 'S')}</span>
                        <div className={`max-w-[82%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${m.internal ? 'border border-amber/40 bg-amber/10 text-[#8a6a12]' : m.senderRole !== 'student' ? 'bg-forest text-white' : 'border border-line bg-white text-ink'}`}>
                          {m.internal && <p className="mb-1 text-[9px] font-bold uppercase">Internal</p>}
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className={`mt-1 text-[10px] ${m.senderRole !== 'student' && !m.internal ? 'text-white/60' : 'text-slate-400'}`}>{m.sender?.name || 'Staff'} · {formatDateTime(m.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-line p-4">
                    <Textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to the student…" />
                    <div className="mt-2 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11.5px] text-muted">
                        <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="size-3.5 accent-forest" />
                        <StickyNote className="size-3.5" aria-hidden /> Internal note only
                      </label>
                      <Button size="sm" onClick={sendReply} icon={Send} disabled={!reply.trim()}>Send</Button>
                    </div>
                  </div>
                </>
              ) : <p className="p-8 text-center text-[13px] text-muted">Select a ticket.</p>}
            </Card>
          </div>
        ) : <EmptyState icon={LifeBuoy} title="No tickets" description="Student support tickets appear here." />
      ) : (
        <Card>
          <CardHeader title="Public enquiries" description="Submitted from the Contact page" icon={Inbox} />
          <div className="divide-y divide-line">
            {enquiries?.length ? enquiries.map((e) => (
              <div key={e._id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold text-ink">{e.name} · <span className="font-normal text-muted">{e.email}</span></p>
                  <div className="flex items-center gap-2">
                    <Badge tone={e.status === 'New' ? 'warn' : 'success'}>{e.status}</Badge>
                    <Button size="sm" variant="ghost" href={`mailto:${e.email}?subject=Re: ${e.reference}`} icon={Mail}>Reply</Button>
                  </div>
                </div>
                <p className="mt-1 text-[12px] text-muted">{e.category} · {formatDateTime(e.createdAt)} · <span className="font-mono text-[10.5px]">{e.reference}</span></p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">{e.message}</p>
              </div>
            )) : <p className="px-5 py-8 text-center text-[12.5px] text-muted">No enquiries yet.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
