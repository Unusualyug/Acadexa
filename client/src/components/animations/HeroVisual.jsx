import { motion } from 'motion/react';
import { FileText, ShieldCheck, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const stages = [
  { label: 'Request submitted', done: true },
  { label: 'Quotation approved', done: true },
  { label: 'Payment verified', done: true },
  { label: 'In progress', done: false, active: true },
  { label: 'Delivery', done: false },
];

function Floating({ children, delay = 0, reduced, className = '' }) {
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 7 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export function HeroVisual() {
  const reduced = useReducedMotion();
  const rise = (delay) => ({
    initial: reduced ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <div className="relative mx-auto w-full max-w-[32rem]" aria-hidden>
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-emerald/12 via-transparent to-amber/12 blur-2xl" />

      <div className="grid grid-cols-[1.55fr_1fr] gap-3 sm:gap-4">
        {/* main order card */}
        <motion.div
          {...rise(0.15)}
          className="relative rounded-2xl border border-line bg-white p-4 shadow-[0_2px_4px_rgba(23,32,51,0.04),0_38px_70px_-34px_rgba(20,83,45,0.45)] sm:p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forest text-white"><FileText className="size-4.5" /></span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-ink">Project Documentation</p>
                <p className="text-[10.5px] text-muted">SD-2026-0142</p>
              </div>
            </div>
          </div>
          <span className="mt-2.5 inline-block rounded-full border border-emerald/30 bg-mint px-2 py-0.5 text-[10px] font-bold text-forest">In Progress</span>

          <div className="mt-3.5 space-y-2">
            {stages.map((s, i) => (
              <motion.div
                key={s.label}
                initial={reduced ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
                className="flex items-center gap-2"
              >
                <span className={`grid size-4 shrink-0 place-items-center rounded-full ${s.done ? 'bg-emerald text-white' : s.active ? 'bg-amber text-white' : 'border border-line bg-canvas'}`}>
                  {s.done ? <CheckCircle className="size-2.5" /> : s.active ? <span className="size-1.5 rounded-full bg-white" /> : null}
                </span>
                <span className={`truncate text-[10.5px] ${s.done ? 'text-ink' : s.active ? 'font-semibold text-ink' : 'text-slate-400'}`}>{s.label}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-3.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-muted">
              <span>Progress</span><span>68%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald to-forest"
                initial={reduced ? { width: '68%' } : { width: 0 }}
                animate={{ width: '68%' }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </motion.div>

        {/* side cards */}
        <div className="flex flex-col justify-center gap-3 sm:gap-4">
          <motion.div
            {...rise(0.35)}
            className="rounded-2xl border border-line bg-white p-3.5 shadow-[0_18px_40px_-26px_rgba(20,83,45,0.5)]"
          >
            <div className="flex items-center justify-between gap-1">
              <p className="text-[9.5px] font-bold tracking-wide text-muted uppercase">Quotation</p>
              <span className="rounded-full bg-mint px-1.5 py-0.5 text-[9px] font-bold text-forest">QT-2041</span>
            </div>
            <p className="mt-1.5 font-display text-lg leading-none font-extrabold text-ink">₹499</p>
            <p className="mt-1 text-[9.5px] leading-relaxed text-muted">3 revisions · due 12 Nov</p>
            <div className="mt-2.5 flex gap-1.5">
              <span className="flex-1 rounded-md bg-forest py-1 text-center text-[9.5px] font-bold text-white">Approve</span>
              <span className="rounded-md border border-line px-1.5 py-1 text-[9.5px] font-semibold text-muted">View</span>
            </div>
          </motion.div>

          <Floating delay={0.9} reduced={reduced}>
            <motion.div {...rise(0.5)} className="rounded-2xl border border-line bg-white p-3 shadow-[0_16px_34px_-24px_rgba(20,83,45,0.45)]">
              <div className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-mint text-forest"><ShieldCheck className="size-3.5" /></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-ink">Private by default</p>
                  <p className="text-[9px] text-muted">Authorised downloads</p>
                </div>
              </div>
            </motion.div>
          </Floating>

          <Floating delay={0.4} reduced={reduced}>
            <motion.div {...rise(0.62)} className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-1.5 shadow-[0_14px_30px_-22px_rgba(20,83,45,0.5)]">
              <Clock className="size-3 shrink-0 text-emerald" />
              <span className="text-[9.5px] font-semibold text-ink">Deadlines tracked</span>
            </motion.div>
          </Floating>
        </div>
      </div>

      <motion.div
        {...rise(0.75)}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white/90 px-3 py-2 shadow-[0_14px_30px_-24px_rgba(20,83,45,0.5)] sm:mt-4"
      >
        <Sparkles className="size-3.5 text-amber" />
        <span className="text-[10.5px] font-semibold text-ink">Pay per work from ₹15 · written quotations</span>
      </motion.div>
    </div>
  );
}
