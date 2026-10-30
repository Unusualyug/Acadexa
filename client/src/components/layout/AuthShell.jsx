import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const points = [
  'Written quotations you approve before paying',
  'Private document handling with authorised downloads',
  'Order-linked messaging and a full activity timeline',
];

export function AuthShell({ title, subtitle, children, footer, badge }) {
  const reduced = useReducedMotion();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Link to="/" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-forest">
              <ArrowLeft className="size-3.5" aria-hidden /> Back to site
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {badge}
            <h1 className="font-display text-[1.75rem] font-extrabold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-center text-[13px] text-muted">{footer}</div>}
          </motion.div>
        </div>

        <p className="text-center text-[11.5px] text-slate-400">
          © {new Date().getFullYear()} Acadexa · <Link to="/privacy-policy" className="hover:text-forest">Privacy</Link> · <Link to="/terms-of-service" className="hover:text-forest">Terms</Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-forest p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-[0.13]" aria-hidden style={{ backgroundImage: 'radial-gradient(#ECFDF5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-emerald/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full bg-amber/10 blur-3xl" aria-hidden />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11.5px] font-semibold backdrop-blur">
            <ShieldCheck className="size-3.5 text-emerald" aria-hidden /> Your Academic Journey, Simplified.
          </span>
          <h2 className="mt-6 max-w-sm font-display text-[1.9rem] leading-tight font-extrabold text-balance text-white">
            Academic support with the paperwork handled properly.
          </h2>
          <ul className="mt-7 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[13px] text-white/80">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" aria-hidden /> {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-10 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white">
            <FileText className="size-4 text-emerald" aria-hidden /> Order SD-2026-0142 · In Progress
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald to-white/70" />
          </div>
          <p className="mt-2.5 text-[11px] text-white/60">Quotation approved · Payment verified · Deliverables due 12 Nov</p>
        </div>
      </aside>
    </div>
  );
}
