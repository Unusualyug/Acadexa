import { Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../../context/ThemeContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

/**
 * Light / dark switch.
 *
 * Renders a real button with `aria-pressed`; the icon crossfades so the state
 * change is obvious without a colour-only cue.
 */
export function ThemeToggle({ className, size = 'md' }) {
  const { isDark, toggle } = useTheme();
  const reduced = useReducedMotion();
  const dims = size === 'sm' ? 'size-8' : 'size-9';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        'relative grid shrink-0 place-items-center rounded-xl border border-line bg-white text-ink transition-colors hover:border-emerald/40 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
        dims,
        className
      )}
    >
      <motion.span
        key={isDark ? 'moon' : 'sun'}
        initial={reduced ? false : { opacity: 0, rotate: -45, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="grid place-items-center"
      >
        {isDark ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
      </motion.span>
    </button>
  );
}
