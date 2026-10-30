import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { relativeTime, cn } from '../../lib/utils';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    refetchInterval: 60000,
  });

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const unread = data?.unread || 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-xl border border-line bg-white text-ink transition-colors hover:border-forest/30"
      >
        <Bell className="size-4.5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_48px_-20px_rgba(20,83,45,0.4)]"
          >
            <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
              <p className="text-[13px] font-semibold text-ink">Notifications</p>
              <button onClick={markAll} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest hover:underline">
                <CheckCheck className="size-3.5" aria-hidden /> Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {data?.notifications?.length ? (
                data.notifications.map((n) => (
                  <Link
                    key={n._id}
                    to={n.link || '#'}
                    onClick={() => setOpen(false)}
                    className={cn('block border-b border-line/70 px-3.5 py-3 transition-colors last:border-0 hover:bg-canvas', !n.read && 'bg-mint/50')}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald" aria-hidden />}
                      <div className={cn(!n.read ? '' : 'pl-3.5')}>
                        <p className="text-[12.5px] font-semibold text-ink">{n.title}</p>
                        {n.body && <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{n.body}</p>}
                        <p className="mt-1 text-[10.5px] text-slate-400">{relativeTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-8 text-center text-[13px] text-muted">You're all caught up.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
