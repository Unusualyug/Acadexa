import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function PillTabs({ options, value, onChange, className, layoutId = 'pill' }) {
  const reduced = useReducedMotion();
  return (
    <div className={cn('no-scrollbar flex gap-1.5 overflow-x-auto rounded-xl border border-line bg-white p-1.5', className)} role="tablist">
      {options.map((opt) => {
        const key = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = value === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn('relative shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors', active ? 'text-white' : 'text-muted hover:text-ink')}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-forest"
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function UnderlineTabs({ options, value, onChange }) {
  return (
    <div className="no-scrollbar flex gap-5 overflow-x-auto border-b border-line" role="tablist">
      {options.map((opt) => {
        const key = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={value === key}
            onClick={() => onChange(key)}
            className={cn('relative shrink-0 pb-3 text-sm font-semibold transition-colors', value === key ? 'text-forest' : 'text-muted hover:text-ink')}
          >
            {label}
            {value === key && <motion.span layoutId="underline" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-forest" />}
          </button>
        );
      })}
    </div>
  );
}
