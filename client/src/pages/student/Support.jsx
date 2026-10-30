import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { LifeBuoy, Plus, Send, Clock, ShieldCheck } from 'lucide-react';
import { api, apiMessage, apiDetails } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatDateTime, initials } from '../../lib/utils';

const schema = z.object({
  category: z.string().min(2),
  subject: z.string().min(5, 'Add a short subject').max(160),
  description: z.string().min(20, 'Describe the issue in at least 20 characters').max(4000),
});

const CATEGORIES = ['Order issue', 'Payment or refund', 'Document access', 'Technical problem', 'Revision query', 'Account access', 'Privacy concern', 'Other'];

export default function Support() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [reply, setReply] = useState('');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => (await api.get('/support')).data.tickets,
  });
  const active = tickets?.find((t) => t._id === activeId) || tickets?.[0];
  const { data: thread, refetch } = useQuery({
    queryKey: ['ticket', active?._id],
    queryFn: async () => (await api.get(`/support/${active._id}`)).data,
    enabled: Boolean(active?._id),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({ resolver: zodResolver(schema), defaultValues: { category: 'Order issue' } });

  const create = async (values) => {
    try {
      const { data } = await api.post('/support', values);
      toast.success(`Ticket ${data.ticket.reference} created`);
      setCreating(false);
      reset();
      setActiveId(data.ticket._id);
      qc.invalidateQueries({ queryKey: ['tickets'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !active) return;
    try {
      await api.post(`/support/${active._id}/reply`, { body: reply.trim() });
      setReply('');
      refetch();
      qc.invalidateQueries({ queryKey: ['tickets'] });
    } catch (err) {
      toast.error(apiMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Support tickets" description="Raise an issue about an order, payment, document access, revision or your account. Each ticket has a reference and a full history." action={<Button onClick={() => setCreating(true)} icon={Plus}>New ticket</Button>} />

      {isLoading ? <SkeletonRows count={3} /> : tickets?.length ? (
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="h-fit">
            <CardHeader title="Your tickets" description={`${tickets.length} ticket(s)`} icon={LifeBuoy} />
            <ul className="max-h-[32rem] divide-y divide-line overflow-y-auto">
              {tickets.map((t) => (
                <li key={t._id}>
                  <button onClick={() => setActiveId(t._id)} className={`w-full px-5 py-3 text-left transition-colors hover:bg-canvas ${active?._id === t._id ? 'bg-mint/60' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px] font-semibold text-ink">{t.subject}</p>
                      <Badge status={t.status}>{t.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-muted">{t.reference} · {t.category} · {formatDateTime(t.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="min-h-[30rem]">
            {active ? (
              <>
                <CardHeader title={active.subject} description={`${active.reference} · ${active.category}`} icon={ShieldCheck} action={<Badge status={active.status}>{active.status}</Badge>} />
                <div className="space-y-3 p-5">
                  <div className="rounded-xl border border-line bg-canvas p-3.5">
                    <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink">{active.description}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted"><Clock className="size-3" aria-hidden /> Opened {formatDateTime(active.createdAt)}</p>
                  </div>

                  {thread?.messages?.map((m) => (
                    <div key={m._id} className={`flex gap-2 ${m.senderRole === 'student' ? 'flex-row-reverse' : ''}`}>
                      <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${m.senderRole === 'student' ? 'bg-forest text-white' : 'bg-white text-forest ring-1 ring-line'}`}>
                        {initials(m.sender?.name || 'Support')}
                      </span>
                      <div className={`max-w-[82%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${m.senderRole === 'student' ? 'bg-forest text-white' : 'border border-line bg-white text-ink'}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[10px] ${m.senderRole === 'student' ? 'text-white/60' : 'text-slate-400'}`}>{m.sender?.name || 'Support'} · {formatDateTime(m.createdAt)}</p>
                      </div>
                    </div>
                  ))}

                  {thread?.ticket?.resolution && (
                    <div className="rounded-xl border border-emerald/25 bg-mint p-3.5 text-[12.5px] text-forest">
                      <p className="font-semibold">Resolution</p>
                      <p className="mt-0.5">{thread.ticket.resolution}</p>
                    </div>
                  )}

                  {!['Resolved', 'Closed'].includes(active.status) ? (
                    <form onSubmit={sendReply} className="border-t border-line pt-3">
                      <label htmlFor="ticket-reply" className="sr-only">Reply</label>
                      <Textarea id="ticket-reply" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add more detail or reply to support…" />
                      <div className="mt-2 flex justify-end"><Button type="submit" size="sm" icon={Send} disabled={!reply.trim()}>Send reply</Button></div>
                    </form>
                  ) : (
                    <p className="rounded-xl bg-canvas px-3.5 py-2.5 text-[11.5px] text-muted">This ticket is {active.status.toLowerCase()}. Create a new ticket if you need further help.</p>
                  )}
                </div>
              </>
            ) : <p className="p-8 text-center text-[13px] text-muted">Select a ticket.</p>}
          </Card>
        </div>
      ) : (
        <EmptyState icon={LifeBuoy} title="No support tickets" description="If something isn't right with an order, payment or document, open a ticket and we'll respond within one working day." action={<Button className="mt-4" onClick={() => setCreating(true)} icon={Plus}>New ticket</Button>} />
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New support ticket"
        description="Include your order reference where relevant so we can look into it faster."
        footer={<><Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button><Button loading={isSubmitting} onClick={handleSubmit(create)}>Create ticket</Button></>}
      >
        <form onSubmit={handleSubmit(create)} className="space-y-4">
          <FormField label="Category" htmlFor="category" required error={errors.category?.message}>
            <Select id="category" {...register('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
          </FormField>
          <FormField label="Subject" htmlFor="subject" required error={errors.subject?.message}>
            <Input id="subject" placeholder="Short summary of the issue" {...register('subject')} />
          </FormField>
          <FormField label="Details" htmlFor="description" required error={errors.description?.message}>
            <Textarea id="description" rows={5} placeholder="What happened, when, and what you'd like us to do?" {...register('description')} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
