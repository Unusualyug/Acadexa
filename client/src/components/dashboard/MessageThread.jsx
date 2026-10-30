import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Paperclip, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiMessage } from '../../lib/api';
import { Textarea } from '../ui/Field';
import { Button } from '../ui/Button';
import { cn, formatDateTime, initials } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function MessageThread({ orderId, disabled, placeholder = 'Write a message about this order…' }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', orderId],
    queryFn: async () => (await api.get(`/messages/order/${orderId}`)).data.messages,
    enabled: Boolean(orderId),
    refetchInterval: 30000,
  });

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }); }, [data?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/order/${orderId}`, { body: body.trim() });
      setBody('');
      qc.invalidateQueries({ queryKey: ['messages', orderId] });
    } catch (err) {
      toast.error(apiMessage(err, 'Message could not be sent.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="max-h-[26rem] flex-1 space-y-3 overflow-y-auto rounded-xl bg-canvas p-3">
        {isLoading ? (
          <p className="py-6 text-center text-[13px] text-muted">Loading conversation…</p>
        ) : data?.length ? (
          data.map((m) => {
            const mine = (m.sender?._id || m.sender) === user?.id;
            return (
              <div key={m._id} className={cn('flex gap-2', mine ? 'flex-row-reverse' : '')}>
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold', mine ? 'bg-forest text-white' : 'bg-white text-forest ring-1 ring-line')}>
                  {initials(m.sender?.name || m.senderName || 'SD')}
                </span>
                <div className={cn('max-w-[80%] rounded-xl px-3 py-2 text-[12.5px] leading-relaxed', mine ? 'bg-forest text-white' : 'border border-line bg-white text-ink')}>
                  {m.internal && <p className="mb-1 inline-flex items-center gap-1 rounded bg-amber/20 px-1.5 py-0.5 text-[9.5px] font-bold text-[#8a6a12] uppercase">Internal</p>}
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={cn('mt-1 text-[10px]', mine ? 'text-white/60' : 'text-slate-400')}>
                    {m.sender?.name || m.senderName} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center">
            <ShieldCheck className="mx-auto size-5 text-emerald" aria-hidden />
            <p className="mt-2 text-[13px] font-semibold text-ink">No messages yet</p>
            <p className="mt-1 text-[11.5px] text-muted">Only you and the assigned team member can see this conversation.</p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="mt-3">
        <label htmlFor="message-body" className="sr-only">Message</label>
        <Textarea
          id="message-body"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || sending}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <Paperclip className="size-3.5" aria-hidden /> Attach files from the Documents tab
          </p>
          <Button type="submit" size="sm" loading={sending} icon={Send} disabled={disabled || !body.trim()}>Send</Button>
        </div>
      </form>
    </div>
  );
}
