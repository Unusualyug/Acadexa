import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ icon: Icon = Inbox, title, description, action, actionLabel, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <div className="relative mb-4">
        <span className="absolute inset-0 -m-2 rounded-full bg-mint" aria-hidden />
        <span className="relative grid size-14 place-items-center rounded-full border border-emerald/20 bg-white text-forest">
          <Icon className="size-6" aria-hidden />
        </span>
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>}
      {actionTo && actionLabel && <Button to={actionTo} className="mt-5" size="sm">{actionLabel}</Button>}
      {action}
    </div>
  );
}
