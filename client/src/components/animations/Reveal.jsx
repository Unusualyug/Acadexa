import { motion } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const distance = { up: 22, down: -18, left: 24, right: -24, none: 0 };

export function Reveal({ children, delay = 0, y = 22, as = 'div', className, once = true, duration = 0.55, ...props }) {
  const reduced = useReducedMotion();
  const Comp = motion[as] || motion.div;
  if (reduced) return <Comp className={className} {...props}>{children}</Comp>;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function Stagger({ children, className, delayChildren = 0.05, staggerChildren = 0.08, as = 'div', ...props }) {
  const reduced = useReducedMotion();
  const Comp = motion[as] || motion.div;
  if (reduced) return <Comp className={className} {...props}>{children}</Comp>;
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      variants={{ hidden: {}, show: { transition: { delayChildren, staggerChildren } } }}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, y = 18, as = 'div', ...props }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
      }}
      {...props}
    >
      {children}
    </Comp>
  );
}

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
