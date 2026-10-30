import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function StatCard({ label, value, hint, icon: Icon, to, tone = 'default', index = 0 }) {
  const reduced = useReducedMotion();
  const tones = {
    default: 'bg-mint text-forest',
    amber: 'bg-amber/15 text-[#8a6a12]',
    emerald: 'bg-emerald/15 text-emerald-700',
    slate: 'bg-slate-100 text-muted',
  };
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-9 place-items-center rounded-lg ${tones[tone]}`}><Icon className="size-4.5" aria-hidden /></span>
        {to && <ArrowUpRight className="size-3.5 text-slate-300 transition-colors group-hover:text-forest" aria-hidden />}
      </div>
      <p className="mt-3.5 font-display text-[26px] leading-none font-extrabold text-ink">{value}</p>
      <p className="mt-1.5 text-[12.5px] font-semibold text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </>
  );

  const base = 'group block rounded-2xl border border-line bg-white p-4 text-left transition-all duration-300 hover:border-emerald/35 hover:shadow-[0_18px_40px_-30px_rgba(20,83,45,0.5)]';

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04 * index }}
    >
      {to ? <Link to={to} className={base}>{inner}</Link> : <div className={base}>{inner}</div>}
    </motion.div>
  );
}
