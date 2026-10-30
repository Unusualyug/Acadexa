import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { MessageThread } from '../../components/dashboard/MessageThread';
import { statusStyle, formatDate, cn } from '../../lib/utils';

export default function Messages() {
  const [selected, setSelected] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'messages'],
    queryFn: async () => (await api.get('/orders', { params: { limit: 50 } })).data.orders,
  });

  const active = selected || data?.[0]?._id || data?.orders?.[0]?._id;

  return (
    <div>
      <PageHeader title="Messages" description="Conversations stay attached to the order they belong to, so files, scope and history remain in one place." />

      {isLoading ? <SkeletonRows count={3} /> : data?.orders?.length ? (
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="h-fit">
            <CardHeader title="Conversations" description={`${data.orders.length} order(s)`} icon={MessageCircle} />
            <ul className="max-h-[30rem] divide-y divide-line overflow-y-auto">
              {data.orders.map((o) => (
                <li key={o._id}>
                  <button
                    onClick={() => setSelected(o._id)}
                    className={cn('w-full px-5 py-3 text-left transition-colors hover:bg-canvas', active === o._id && 'bg-mint/60')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px] font-semibold text-ink">{o.title}</p>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle(o.status)}`}>{o.status}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10.5px] text-muted">{o.reference} · {formatDate(o.updatedAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="min-h-[26rem]">
            <CardHeader title="Conversation" description="Visible to you and the assigned team member only" icon={ShieldCheck} />
            <div className="p-4">
              {active ? <MessageThread orderId={active} /> : <p className="py-10 text-center text-[13px] text-muted">Select a conversation.</p>}
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState icon={MessageCircle} title="No conversations yet" description="Messages become available once you submit a request." actionLabel="Request a service" actionTo="/dashboard/requests/new" />
      )}
    </div>
  );
}
