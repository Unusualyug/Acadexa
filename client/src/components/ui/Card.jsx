import { cn } from '../../lib/utils';

export function Card({ className, children, as: Tag = 'div', hover = false, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(23,32,51,0.04),0_12px_32px_-24px_rgba(20,83,45,0.35)]',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(23,32,51,0.05),0_26px_50px_-24px_rgba(20,83,45,0.45)] hover:border-emerald/30',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, icon: Icon, className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4', className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-mint text-forest">
            <Icon className="size-4.5" aria-hidden />
          </span>
        )}
        <div>
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
