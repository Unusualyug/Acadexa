import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Info, Printer } from "lucide-react";
import { FREE_LAB_MANUAL as OFFER } from "../../lib/offers";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";

/**
 * The "free lab manual creation with print & bind" USP.
 *
 * `hero`    - large promotional card for the homepage, above the fold.
 * `inline`  - a single-line strip for service, pricing and listing pages.
 *
 * The condition is never hidden behind the headline: it sits directly beneath
 * the supporting line at every size, because "free" without the condition would
 * misrepresent the offer.
 */
export function FreeLabManualBanner({
  variant = "inline",
  className,
  delay = 0,
}) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const isHero = variant === "hero";

  if (!isHero) {
    return (
      <Link
        to={OFFER.secondaryCta.to}
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-emerald/30 bg-mint px-4 py-3 transition-colors hover:border-emerald/50 hover:bg-mint/70",
          className,
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-forest shadow-sm ring-1 ring-emerald/20">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-bold text-forest">
            {t("offer.headline")}
          </span>
          <span className="block text-[11.5px] leading-snug text-forest/75">
            {t("offer.shortCondition")}
          </span>
        </span>
        <ArrowRight
          className="size-4 shrink-0 text-forest transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    );
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-emerald/30 bg-white p-5 shadow-[0_18px_40px_-28px_rgba(20,83,45,0.55)]",
        className,
      )}
    >
      {/* soft promotional wash, kept subtle so the text stays readable */}
      <span
        className="promo-wash pointer-events-none absolute inset-0"
        aria-hidden
      />
      {!reduced && (
        <motion.span
          className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-emerald/10 blur-2xl"
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.12, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      )}

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-2.5 py-1 text-[10.5px] font-bold tracking-[0.1em] text-white uppercase">
          <Sparkles className="size-3" aria-hidden />
          {t("offer.badge")}
        </span>

        <p className="mt-3 font-display text-[1.35rem] leading-tight font-extrabold text-ink sm:text-[1.5rem]">
          {t("offer.headline")}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {t("offer.supporting")}
        </p>

        <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-forest/80">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>{t("offer.condition")}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={OFFER.primaryCta.to}
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            {t("offer.primaryCta")}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          <Link
            to={OFFER.secondaryCta.to}
            className="inline-flex items-center gap-1.5 rounded-xl border border-forest/25 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-forest transition-colors hover:border-forest/45 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <Printer className="size-3.5" aria-hidden />
            {t("offer.secondaryCta")}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
