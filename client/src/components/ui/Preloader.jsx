import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { LogoMark } from './Logo';

const SESSION_KEY = 'acadexa_intro_seen';
/* Total time from page load to the homepage being fully visible, measured from
   navigation start. Short on purpose: the intro should feel like a finish, not
   a wait. A slow bundle eats into the hold rather than extending the total. */
const INTRO_BUDGET_MS = 1050;
const FADE_MS = 380;

/** Has the intro already run this session, or has the user asked for less motion? */
function shouldSkip() {
  if (typeof window === 'undefined') return true;
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return true;
  } catch {
    /* storage blocked: show it once anyway */
  }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
}

/**
 * First-visit intro.
 *
 * The static splash in index.html paints before this bundle is parsed, so the
 * logo and wordmark are already on screen when React arrives; this component
 * removes that node and renders the identical frame, then reveals the page.
 * No AnimatePresence: the fade is driven by one state change so the overlay
 * unmounts the instant it is transparent, instead of fading twice.
 */
export function Preloader() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(() => (shouldSkip() ? 'done' : 'showing'));
  const handoff = useRef(false);

  useEffect(() => {
    if (handoff.current) return;
    handoff.current = true;
    document.getElementById('sd-intro')?.remove();
  }, []);

  useEffect(() => {
    if (phase === 'done') {
      document.body.style.overflow = '';
      return undefined;
    }

    try {
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }

    const fade = reduced ? 0 : FADE_MS;
    const hold = Math.max(0, INTRO_BUDGET_MS - performance.now() - fade);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const startFade = window.setTimeout(() => setPhase('leaving'), hold);
    const finish = window.setTimeout(() => setPhase('done'), hold + fade);

    return () => {
      window.clearTimeout(startFade);
      window.clearTimeout(finish);
      document.body.style.overflow = prevOverflow;
    };
  }, [phase, reduced]);

  if (phase === 'done') return null;

  const leaving = phase === 'leaving';

  return (
    <motion.div
      initial={false}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduced ? 0 : FADE_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
      className="intro-surface fixed inset-0 z-9999 grid place-items-center bg-canvas"
      role="status"
      aria-label="Loading Acadexa"
      aria-hidden={leaving ? 'true' : undefined}
    >
      <motion.div
        className="flex flex-col items-center px-6"
        animate={leaving ? { opacity: 0, y: -10, scale: 0.985 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.34, ease: [0.4, 0, 0.2, 1] }}
      >
        <LogoMark className="size-[clamp(58px,13vw,76px)]" />

        <div
          className="mt-[18px] flex font-display font-extrabold leading-none text-forest"
          style={{ fontSize: 'clamp(24px, 6.4vw, 38px)', letterSpacing: '0.16em' }}
          aria-hidden="true"
        >
          {'ACADEXA'.split('').map((letter, i) => (
            <span key={`${letter}-${i}`}>{letter}</span>
          ))}
        </div>

        <p
          className="mt-2.5 text-[clamp(9.5px,2.4vw,11px)] font-semibold uppercase tracking-[0.24em] text-muted"
          aria-hidden="true"
        >
          Your Academic Journey, Simplified
        </p>

        <div
          className="relative mt-[22px] h-0.5 w-[clamp(96px,26vw,132px)] overflow-hidden rounded-full bg-forest/15"
          aria-hidden="true"
        >
          <span className="absolute inset-0 origin-left rounded-full bg-forest" />
        </div>
      </motion.div>
    </motion.div>
  );
}
