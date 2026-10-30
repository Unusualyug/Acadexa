import { cn } from '../../lib/utils';

const base =
  'w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 transition-colors ' +
  'hover:border-slate-300 focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10 disabled:bg-slate-50';

export function Label({ children, htmlFor, required, hint }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-semibold text-ink">
      <span>
        {children}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </span>
      {hint && <span className="text-[11px] font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Input({ className, error, ...props }) {
  return <input className={cn(base, 'h-11', error && 'border-danger focus:border-danger focus:ring-danger/10', className)} aria-invalid={Boolean(error)} {...props} />;
}

export function Textarea({ className, error, rows = 4, ...props }) {
  return <textarea rows={rows} className={cn(base, 'py-2.5 leading-relaxed', error && 'border-danger', className)} aria-invalid={Boolean(error)} {...props} />;
}

export function Select({ className, error, children, ...props }) {
  return (
    <select className={cn(base, 'h-11 appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' stroke=\'%2364748B\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat pr-9', error && 'border-danger', className)} {...props}>
      {children}
    </select>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p role="alert" className="mt-1.5 text-[12px] font-medium text-danger">{children}</p>;
}

export function FormField({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor} required={required} hint={hint}>{label}</Label>}
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-muted', className)}>
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-forest accent-forest focus:ring-forest" {...props} />
      <span>{label}</span>
    </label>
  );
}
