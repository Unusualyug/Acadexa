import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-forest text-white hover:bg-forest-700 shadow-[0_8px_24px_-12px_rgba(20,83,45,0.7)]',
  secondary: 'bg-white text-forest border border-line hover:border-forest/40 hover:bg-mint',
  emerald: 'bg-emerald text-white hover:bg-[#0ea472] shadow-[0_8px_24px_-12px_rgba(16,185,129,0.8)]',
  soft: 'bg-mint text-forest hover:bg-emerald/15 border border-emerald/20',
  ghost: 'bg-transparent text-ink hover:bg-ink/5',
  outline: 'bg-transparent text-forest border border-forest/25 hover:border-forest/60 hover:bg-white',
  danger: 'bg-danger text-white hover:bg-red-700',
  dark: 'bg-ink text-white hover:bg-black',
};

const sizes = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
  icon: 'h-10 w-10',
};

export function Button({
  children, variant = 'primary', size = 'md', className, loading, disabled,
  to, href, type = 'button', icon: Icon, iconRight: IconRight, ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 select-none',
    'active:scale-[0.98] disabled:opacity-55 disabled:pointer-events-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
    variants[variant], sizes[size], className
  );
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
      {IconRight ? <IconRight className="size-4" aria-hidden /> : null}
    </>
  );
  if (to) return <Link to={to} className={classes} {...props}>{content}</Link>;
  if (href) return <a href={href} className={classes} {...props}>{content}</a>;
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
