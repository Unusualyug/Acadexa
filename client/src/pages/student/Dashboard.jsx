import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, FileText, CreditCard, Loader, PackageCheck, CalendarClock, Plus, Search,
  MessageCircle, LifeBuoy, ArrowRight, Clock, Phone,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/dashboard/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonCards, SkeletonRows } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/animations/Reveal';
import { daysUntil, formatDate, relativeTime, statusStyle, money } from '../../lib/utils';

const quickActions = [
  { to: '/dashboard/requests/new', label: 'Request a service', icon: Plus, tone: 'bg-forest text-white' },
  { to: '/services', label: 'Browse services', icon: Search, tone: 'bg-mint text-forest' },
  { to: '/dashboard/orders', label: 'View my orders', icon: ShoppingBag, tone: 'bg-mint text-forest' },
  { to: '/dashboard/quotations', label: 'View quotations', icon: FileText, tone: 'bg-mint text-forest' },
  { to: '/dashboard/messages', label: 'Open messages', icon: MessageCircle, tone: 'bg-mint text-forest' },
  { to: '/dashboard/support', label: 'Contact support', icon: LifeBuoy, tone: 'bg-mint text-forest' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => (await api.get('/orders/summary/dashboard')).data,
  });

  const cards = data?.cards;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-emerald">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="mt-1 font-display text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-[13px] text-muted">Here's where your academic support requests stand right now.</p>
        </div>
        <Button to="/dashboard/requests/new" icon={Plus}>New request</Button>
      </div>

      {isError ? (
        <EmptyState title="Couldn't load your dashboard" description="Please retry — no data has been changed." action={<Button className="mt-4" onClick={() => refetch()}>Retry</Button>} />
      ) : isLoading ? (
        <SkeletonCards count={6} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard index={0} label="Active orders" value={cards.activeOrders} hint="Confirmed and in progress" icon={ShoppingBag} to="/dashboard/orders" />
          <StatCard index={1} label="Pending quotations" value={cards.pendingQuotations} hint="Awaiting your review" icon={FileText} to="/dashboard/quotations" tone="amber" />
          <StatCard index={2} label="Awaiting payment" value={cards.awaitingPayment} hint="Approved, unpaid" icon={CreditCard} to="/dashboard/payments" tone="amber" />
          <StatCard index={3} label="In progress" value={cards.inProgress} hint="Work under way" icon={Loader} to="/dashboard/orders?status=In Progress" tone="emerald" />
          <StatCard index={4} label="Delivered" value={cards.delivered} hint="Including completed" icon={PackageCheck} to="/dashboard/orders?status=Delivered" tone="emerald" />
          <StatCard index={5} label="Upcoming deadlines" value={cards.upcomingDeadlines} hint="Next 7 days" icon={CalendarClock} to="/dashboard/orders" tone="slate" />
        </div>
      )}

      {user && !user.profile?.phone && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber/40 bg-amber/10 px-4 py-3">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[#8a6a12]">
            <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">Add a mobile number.</strong> We call students when a deadline or
              clarification affects a live order — without it we can only email.
            </span>
          </p>
          <Button to="/dashboard/profile" size="sm" variant="secondary">Add number</Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader
            title="Recent orders"
            description="Latest activity across your requests"
            icon={ShoppingBag}
            action={<Button to="/dashboard/orders" size="sm" variant="ghost" iconRight={ArrowRight}>All orders</Button>}
          />
          <div className="divide-y divide-line">
            {isLoading ? (
              <div className="p-4"><SkeletonRows count={3} /></div>
            ) : data?.recentOrders?.length ? (
              data.recentOrders.map((o) => (
                <Link key={o._id} to={`/dashboard/orders/${o._id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-canvas">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{o.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      {o.reference} · {o.serviceName} · updated {relativeTime(o.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {o.agreedAmount > 0 && <span className="text-[12px] font-semibold text-ink">{money(o.agreedAmount, o.currency)}</span>}
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(o.status)}`}>{o.status}</span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title="No requests yet"
                description="Once you submit your first request it will appear here with its reference, status and deadline."
                actionLabel="Request a service"
                actionTo="/dashboard/requests/new"
              />
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Quick actions" icon={Plus} />
            <div className="grid grid-cols-2 gap-2 p-4">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.to} className="group flex flex-col gap-2 rounded-xl border border-line p-3 transition-all hover:-translate-y-0.5 hover:border-emerald/40 hover:shadow-sm">
                  <span className={`grid size-8 place-items-center rounded-lg ${a.tone}`}><a.icon className="size-4" aria-hidden /></span>
                  <span className="text-[11.5px] font-semibold text-ink">{a.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Upcoming deadlines" icon={CalendarClock} />
            <div className="divide-y divide-line">
              {isLoading ? (
                <div className="p-4"><SkeletonRows count={2} /></div>
              ) : data?.upcomingDeadlines?.length ? (
                data.upcomingDeadlines.map((o) => {
                  const days = daysUntil(o.deadline);
                  return (
                    <Link key={o._id} to={`/dashboard/orders/${o._id}`} className="block px-5 py-3 hover:bg-canvas">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12.5px] font-semibold text-ink">{o.serviceName}</p>
                        <Badge tone={days <= 2 ? 'danger' : days <= 5 ? 'warn' : 'neutral'}>
                          {days <= 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'}`}
                        </Badge>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted"><Clock className="size-3" aria-hidden />{formatDate(o.deadline)} · {o.reference}</p>
                    </Link>
                  );
                })
              ) : (
                <p className="px-5 py-8 text-center text-[12.5px] text-muted">No deadlines in the next week.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Reveal className="rounded-2xl border border-emerald/25 bg-mint p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-[14px] font-semibold text-forest">Not sure what to request?</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-forest/80">
              Browse the catalogue to compare scope, starting prices and turnaround — or send an enquiry and we'll advise on the right service before you commit.
            </p>
          </div>
          <div className="flex gap-2">
            <Button to="/services" size="sm" variant="primary">Browse services</Button>
            <Button to="/contact" size="sm" variant="secondary">Ask a question</Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
