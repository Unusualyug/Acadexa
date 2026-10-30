import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarDays, Clock, Video, X, RefreshCcw, ArrowRight } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select, Textarea, FormField } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatDate, formatDateTime, money } from '../../lib/utils';

const CATEGORIES = ['Study planning', 'Research direction', 'Documentation review', 'Technical debugging', 'Viva practice', 'Other'];

export default function Consultations() {
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => (await api.get('/bookings')).data.bookings,
  });
  const { data: slots } = useQuery({
    queryKey: ['slots', date],
    queryFn: async () => (await api.get('/bookings/slots', { params: { date } })).data.slots,
  });

  const book = async () => {
    if (!selected) return toast.error('Choose a time slot first.');
    setBusy(true);
    try {
      await api.post('/bookings', { category, startsAt: selected, durationMinutes: 30, notes });
      toast.success('Consultation requested — you will be notified when it is confirmed');
      setSelected(null);
      setNotes('');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (b) => {
    if (!window.confirm('Cancel this consultation? Cancellations need 12 hours notice.')) return;
    try {
      await api.post(`/bookings/${b._id}/cancel`, { reason: 'Cancelled by student' });
      toast.success('Consultation cancelled');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Consultations" description="Book a focused 30-minute online session. Overlapping bookings are prevented on the server, and availability is confirmed at booking time." />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="Book a session" description="Slots are shown in your local time" icon={CalendarDays} />
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date" htmlFor="date">
                <input id="date" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setDate(e.target.value); setSelected(null); }} className="h-11 w-full rounded-xl border border-line px-3.5 text-sm" />
              </FormField>
              <FormField label="Consultation category" htmlFor="category">
                <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
              </FormField>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Available slots</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots?.length ? slots.map((s) => (
                  <button
                    key={s.startsAt}
                    disabled={!s.available}
                    onClick={() => setSelected(s.startsAt)}
                    className={`rounded-lg border px-2 py-2 text-[12px] font-semibold transition-colors ${
                      selected === s.startsAt ? 'border-forest bg-forest text-white' : s.available ? 'border-line bg-white text-ink hover:border-emerald/50 hover:bg-mint' : 'cursor-not-allowed border-line bg-canvas text-slate-300 line-through'
                    }`}
                  >
                    {new Date(s.startsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </button>
                )) : <p className="text-[12.5px] text-muted">No slots published for this date.</p>}
              </div>
            </div>

            <FormField label="What would you like to cover?" htmlFor="notes" hint="Optional">
              <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Share context so we can prepare for the session." />
            </FormField>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="text-[11.5px] text-muted">Session fee: {money(899)} · 30 minutes · reschedule up to 12 h before</p>
              <Button onClick={book} loading={busy} disabled={!selected} iconRight={ArrowRight}>Request booking</Button>
            </div>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Your sessions" description={`${bookings?.length || 0} booking(s)`} icon={Clock} />
          <div className="divide-y divide-line">
            {isLoading ? <div className="p-4"><SkeletonRows count={2} /></div> : bookings?.length ? bookings.map((b) => (
              <div key={b._id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold text-ink">{b.category}</p>
                  <Badge status={b.status}>{b.status}</Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(b.startsAt)} · {b.durationMinutes} min · {b.reference}</p>
                {b.notes && <p className="mt-1 line-clamp-2 text-[11.5px] text-muted">{b.notes}</p>}
                <div className="mt-2 flex gap-1.5">
                  {b.meetingLink && <Button size="sm" variant="soft" href={b.meetingLink} icon={Video}>Join</Button>}
                  {['Requested', 'Confirmed', 'Rescheduled'].includes(b.status) && (
                    <Button size="sm" variant="ghost" className="text-danger hover:bg-red-50" onClick={() => cancel(b)} icon={X}>Cancel</Button>
                  )}
                </div>
              </div>
            )) : <div className="p-5"><EmptyState icon={CalendarDays} title="No sessions booked" description="Pick a slot to request a consultation." /></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
