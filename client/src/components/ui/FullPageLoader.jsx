import { LogoMark } from './Logo';

export function FullPageLoader({ label = 'Loading' }) {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-emerald/30" aria-hidden />
          <LogoMark className="relative size-11" />
        </div>
        <p className="text-[13px] font-medium text-muted">{label}…</p>
      </div>
    </div>
  );
}
