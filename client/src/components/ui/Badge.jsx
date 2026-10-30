import { cn, statusStyle } from '../../lib/utils';

export function Badge({ children, status, className, tone }) {
  const tones = {
    neutral: 'bg-slate-100 text-muted border-line',
    success: 'bg-mint text-forest border-emerald/30',
    warn: 'bg-amber/15 text-[#8a6a12] border-amber/30',
    danger: 'bg-red-50 text-danger border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    forest: 'bg-forest text-white border-forest',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap', tone ? tones[tone] : statusStyle(status), className)}>
      {children}
    </span>
  );
}

export function Dot({ className }) {
  return <span className={cn('size-1.5 rounded-full bg-current', className)} aria-hidden />;
}
