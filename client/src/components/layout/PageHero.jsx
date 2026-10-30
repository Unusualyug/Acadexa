import { Reveal } from '../animations/Reveal';

export function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="mesh-hero border-b border-line">
      <div className="container-page py-14 sm:py-16">
        <Reveal className="max-w-3xl">
          {eyebrow && <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">{eyebrow}</span>}
          <h1 className="mt-2 font-display text-[2rem] leading-tight font-extrabold tracking-tight text-ink text-balance sm:text-[2.6rem]">{title}</h1>
          {description && <p className="mt-3.5 max-w-2xl text-[14.5px] leading-relaxed text-muted">{description}</p>}
          {children && <div className="mt-6">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
