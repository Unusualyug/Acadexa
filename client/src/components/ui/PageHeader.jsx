import { cn } from '../../lib/utils';

export function PageHeader({ title, description, action, children, className }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {children}
        <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
