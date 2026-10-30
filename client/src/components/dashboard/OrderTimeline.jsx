import { motion } from 'motion/react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function OrderTimeline({ activity = [] }) {
  const reduced = useReducedMotion();
  if (!activity.length) return <p className="text-[13px] text-muted">No activity recorded yet.</p>;
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {activity.map((a, i) => {
        const last = i === activity.length - 1;
        return (
          <motion.li
            key={a._id || i}
            initial={reduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            className="relative"
          >
            <span className={`absolute -left-[27px] grid size-4 place-items-center rounded-full ${last ? 'bg-forest text-white' : 'bg-white text-emerald ring-1 ring-line'}`}>
              {last ? <CheckCircle2 className="size-3" aria-hidden /> : <Circle className="size-2.5" aria-hidden />}
            </span>
            <p className="text-[12.5px] font-semibold text-ink">{a.action}</p>
            {a.note && <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{a.note}</p>}
            <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-400">
              <Clock className="size-3" aria-hidden /> {formatDateTime(a.createdAt)}
              {a.status && <span className="rounded-full bg-canvas px-1.5 py-0.5 font-medium text-muted">{a.status}</span>}
            </p>
          </motion.li>
        );
      })}
    </ol>
  );
}
