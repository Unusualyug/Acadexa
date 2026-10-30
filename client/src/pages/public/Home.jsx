import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  ReceiptText,
  ListChecks,
  FolderLock,
  MessageCircle,
  RefreshCcw,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Quote,
  Clock,
  Users,
  FileCheck2,
  Search,
  UploadCloud,
  ClipboardList,
  BadgeCheck,
  Send,
} from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { ServiceCard } from "../../components/ui/ServiceCard";
import {
  Reveal,
  Stagger,
  StaggerItem,
} from "../../components/animations/Reveal";
import { HeroVisual } from "../../components/animations/HeroVisual";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { money } from "../../lib/utils";
import { SkeletonCards } from "../../components/ui/Skeleton";
import { useSettings } from "../../hooks/useSettings";
import { useI18n } from "../../i18n/I18nContext";
import { FreeLabManualBanner } from "../../components/marketing/FreeLabManualBanner";
import { ContactPrintingInfo } from "../../components/marketing/ContactPrintingInfo";
import { FREE_LAB_MANUAL as OFFER } from "../../lib/offers";

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  const reduced = useReducedMotion();
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {items.map((item, i) => {
        const active = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(active ? -1 : i)}
              aria-expanded={active}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-canvas"
            >
              <span className="text-[13.5px] font-semibold text-ink">
                {item.q}
              </span>
              <ChevronDown
                className={`size-4 shrink-0 text-muted transition-transform duration-300 ${active ? "rotate-180 text-forest" : ""}`}
                aria-hidden
              />
            </button>
            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-[13px] leading-relaxed text-muted">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const reduced = useReducedMotion();
  const { t, tl } = useI18n();
  const { settings } = useSettings();
  const trustIcons = [FolderLock, ReceiptText, ListChecks, ShieldCheck];
  const howIcons = [Search, UploadCloud, ReceiptText, BadgeCheck, Send];
  const whyIcons = [
    Users,
    MessageCircle,
    ReceiptText,
    ClipboardList,
    ShieldCheck,
    RefreshCcw,
  ];
  const { data: serviceData, isLoading } = useQuery({
    queryKey: ["services", "home"],
    queryFn: async () => (await api.get("/services")).data,
  });
  const { data: reviewData } = useQuery({
    queryKey: ["reviews", "public"],
    queryFn: async () => (await api.get("/reviews/public")).data,
  });

  const services = serviceData?.services || [];
  const featured = services.slice(0, 6);
  const reviews = reviewData?.reviews || [];
  const heroHeadline =
    settings?.content?.heroHeadline || t("home.hero.headline");
  const heroSubtext = settings?.content?.heroSubtext || t("home.hero.subtext");

  const words = heroHeadline.split(" ");

  return (
    <>
      {settings?.content?.announcement && (
        <div className="border-b border-emerald/20 bg-mint px-4 py-2 text-center text-[12.5px] font-medium text-forest">
          {settings.content.announcement}
        </div>
      )}

      {/* ---------- HERO ---------- */}
      <section className="mesh-hero relative overflow-hidden pb-24 lg:pb-32">
        <div
          className="grain pointer-events-none absolute inset-0 opacity-60"
          aria-hidden
        />
        <div className="container-page relative grid grid-cols-1 items-center gap-10 pt-9 sm:gap-16 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-20">
          <div className="min-w-0">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald/25 bg-white/80 px-3 py-1.5 text-[11.5px] font-semibold text-forest backdrop-blur"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald" />
              </span>
              <Sparkles className="size-3 shrink-0 text-forest" aria-hidden />
              <span className="sm:hidden">{t("home.hero.badgeMobile")}</span>
              <span className="hidden sm:inline">
                {t("offer.badge")} · {t("home.hero.withPrintBind")}
              </span>
            </motion.div>

            <h1 className="mt-4 max-w-[19ch] font-display text-[2.1rem] leading-[1.06] font-extrabold tracking-tight text-ink sm:mt-5 sm:text-[3rem] lg:text-[3.35rem]">
              {words.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  className="mr-[0.28em] inline-block"
                  initial={
                    reduced ? false : { opacity: 0, y: 24, filter: "blur(6px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.6,
                    delay: 0.06 * i,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word === "Simpler." ? (
                    <span className="relative text-forest">
                      {word}
                      <svg
                        className="absolute -bottom-1.5 left-0 w-full"
                        height="8"
                        viewBox="0 0 100 8"
                        preserveAspectRatio="none"
                        aria-hidden
                      >
                        <path
                          d="M1 5.5C20 2 55 1.5 99 4"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  ) : (
                    word
                  )}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-3.5 max-w-xl text-[13.5px] leading-relaxed text-muted sm:mt-5 sm:text-base"
            >
              {heroSubtext}
            </motion.p>

            <FreeLabManualBanner
              variant="hero"
              delay={0.45}
              className="mt-5 max-w-xl sm:mt-7"
            />

            {/* ---------- NEW PROMOTIONAL BANNER: Academic Submissions ---------- */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-4 max-w-xl sm:mt-6 relative overflow-hidden rounded-2xl border border-amber/30 bg-gradient-to-br from-amber-50 via-white to-amber-100 p-6 shadow-[0_18px_40px_-28px_rgba(204,137,16,0.25)]"
            >
              {/* subtle decorative glow */}
              {!reduced && (
                <motion.span
                  className="pointer-events-none absolute -top-12 -right-8 size-48 rounded-full bg-amber/20 blur-3xl"
                  animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.15, 1] }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  aria-hidden
                />
              )}
              <div className="relative flex flex-col gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber px-2.5 py-1 text-[10.5px] font-bold tracking-[0.1em] text-amber-900 uppercase">
                  <ClipboardList className="size-3" aria-hidden />
                  {t("home.academicSubmissions.eyebrow")}
                </span>

                <h3 className="font-display text-[1.25rem] leading-tight font-extrabold text-ink sm:text-[1.4rem]">
                  {t("home.academicSubmissions.headline")}
                </h3>

                <p className="text-[13px] leading-relaxed text-slate-700">
                  {t("home.academicSubmissions.description")}
                </p>

                <div className="mt-4">
                  <Button
                    to="/services"
                    size="sm"
                    variant="outline"
                    className="border-amber/50 text-amber-900 hover:bg-amber hover:border-amber/80"
                    iconRight={ArrowRight}
                  >
                    {t("home.academicSubmissions.cta")}
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]"
            >
              <Link
                to="/services"
                className="inline-flex items-center gap-1 font-semibold text-forest hover:underline"
              >
                {t("home.hero.browse")}{" "}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
              <Link
                to="/contact?intent=quote"
                className="text-muted hover:text-ink hover:underline"
              >
                {t("home.hero.quote")}
              </Link>
            </motion.div>

            <motion.ul
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted"
            >
              {tl("home.hero.points").map((point) => (
                <li key={point} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald" aria-hidden />{" "}
                  {point}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="relative pb-8 lg:pb-0">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* ---------- CONTACT & BULK PRINTING (sits directly under the offer) ---------- */}
      <section
        className="-mt-8 pb-10 sm:-mt-10 sm:pb-12 lg:-mt-16"
        aria-label="Contact and bulk printing"
      >
        <div className="container-page">
          <ContactPrintingInfo />
        </div>
      </section>

      {/* ---------- TRUST ---------- */}
      <section
        className="border-y border-line bg-white py-14"
        aria-labelledby="trust-heading"
      >
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
              {t("home.trust.eyebrow")}
            </span>
            <h2
              id="trust-heading"
              className="mt-2 text-2xl font-bold text-balance sm:text-[28px]"
            >
              {t("home.trust.heading")}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              {t("home.trust.sub")}
            </p>
          </Reveal>
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tl("home.trust.items").map((p, i) => {
              const Icon = trustIcons[i];
              return (
                <StaggerItem
                  key={i}
                  className="rounded-2xl border border-line bg-canvas p-5 transition-colors hover:border-emerald/30 hover:bg-white"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-forest shadow-sm ring-1 ring-line">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <h3 className="mt-3.5 text-[13.5px] font-semibold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                    {p.text}
                  </p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section className="py-20" aria-labelledby="services-heading">
        <div className="container-page">
          <Reveal className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
                {t("home.services.eyebrow")}
              </span>
              <h2
                id="services-heading"
                className="mt-2 text-2xl font-bold text-balance sm:text-[30px]"
              >
                {t("home.services.heading")}
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                {t("home.services.sub")}
              </p>
            </div>
            <Button to="/services" variant="outline" iconRight={ArrowRight}>
              {t("home.services.cta")}
            </Button>
          </Reveal>

          <div className="mt-9">
            {isLoading ? (
              <SkeletonCards count={6} />
            ) : (
              <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((s) => (
                  <StaggerItem key={s._id}>
                    <ServiceCard service={s} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section
        className="relative overflow-hidden bg-forest py-20 text-white"
        aria-labelledby="how-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          aria-hidden
          style={{
            backgroundImage: "radial-gradient(#ECFDF5 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="container-page relative">
          <Reveal className="max-w-2xl">
            <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
              {t("home.how.eyebrow")}
            </span>
            <h2
              id="how-heading"
              className="mt-2 text-2xl font-bold text-white text-balance sm:text-[30px]"
            >
              {t("home.how.heading")}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">
              {t("home.how.sub")}
            </p>
          </Reveal>

          <Stagger className="mt-12 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {tl("home.how.steps").map((s, i) => {
              const Icon = howIcons[i];
              return (
                <StaggerItem key={i} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-emerald backdrop-blur">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <span className="font-display text-2xl font-extrabold text-white/25">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[13.5px] font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
                    {s.text}
                  </p>
                </StaggerItem>
              );
            })}
          </Stagger>

          <Reveal delay={0.15} className="mt-12 flex flex-wrap gap-2.5">
            <Button to="/how-it-works" variant="emerald" iconRight={ArrowRight}>
              {t("home.how.ctaProcess")}
            </Button>
            <Button
              to="/register"
              variant="outline"
              className="border-white/30 text-white hover:border-white hover:bg-white/10"
            >
              {t("home.how.ctaAccount")}
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ---------- PRICING PREVIEW ---------- */}
      <section className="py-20" aria-labelledby="pricing-heading">
        <div className="container-page">
          <Reveal className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
                {t("home.pricing.eyebrow")}
              </span>
              <h2
                id="pricing-heading"
                className="mt-2 text-2xl font-bold text-balance sm:text-[30px]"
              >
                {t("home.pricing.heading")}
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                {t("home.pricing.sub")}
              </p>
            </div>
            <Button to="/pricing" variant="outline" iconRight={ArrowRight}>
              {t("home.pricing.cta")}
            </Button>
          </Reveal>

          <div className="mt-9 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal className="grid gap-3 sm:grid-cols-2">
              {(settings?.pricing?.startingPrices || []).map((p) => (
                <div
                  key={p.label}
                  className="rounded-2xl border border-line bg-white p-4 transition-colors hover:border-emerald/35"
                >
                  <p className="font-display text-xl leading-none font-extrabold text-forest">
                    {p.price}
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-snug text-muted">
                    {p.label}
                  </p>
                </div>
              ))}
              <div className="rounded-2xl border border-emerald/25 bg-mint p-4 sm:col-span-2">
                <p className="text-[12px] font-semibold text-forest">
                  {t("home.pricing.noteTitle")}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-forest/80">
                  {t("home.pricing.noteBody")}
                </p>
              </div>
            </Reveal>

            <Reveal
              delay={0.08}
              className="overflow-hidden rounded-2xl border border-line bg-white"
            >
              <div className="border-b border-line bg-canvas px-5 py-3 text-[11px] font-bold tracking-[0.1em] text-muted uppercase">
                {t("home.pricing.categories")}
              </div>
              <ul className="divide-y divide-line">
                {services.slice(0, 5).map((s) => (
                  <li key={s._id}>
                    <Link
                      to={`/services/${s.slug}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-canvas"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-semibold text-ink">
                          {s.name}
                        </span>
                        <span className="block text-[10.5px] text-muted">
                          {s.turnaroundEstimate}
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] font-bold text-forest">
                        from {money(s.startingPrice, s.currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-5 py-3">
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-forest hover:underline"
                >
                  {t("home.pricing.openSheet")}{" "}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- WHY US ---------- */}
      <section
        className="border-y border-line bg-white py-20"
        aria-labelledby="why-heading"
      >
        <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
              {t("home.why.eyebrow")}
            </span>
            <h2
              id="why-heading"
              className="mt-2 text-2xl font-bold text-balance sm:text-[30px]"
            >
              {t("home.why.heading")}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              {t("home.why.sub")}
            </p>
            <div className="mt-6 rounded-xl border border-emerald/20 bg-mint p-4">
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-forest">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{t("home.why.integrity")}</span>
              </p>
            </div>
          </Reveal>
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {tl("home.why.items").map((w, i) => {
              const Icon = whyIcons[i];
              return (
                <StaggerItem
                  key={i}
                  className="group rounded-2xl border border-line p-5 transition-colors hover:border-emerald/40 hover:bg-canvas"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-mint text-forest transition-transform duration-300 group-hover:scale-110">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <h3 className="mt-3 text-[13.5px] font-semibold text-ink">
                    {w.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                    {w.text}
                  </p>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ---------- TESTIMONIALS (only when real, published feedback exists) ---------- */}
      {reviews.length > 0 && (
        <section className="py-20" aria-labelledby="reviews-heading">
          <div className="container-page">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
                Student feedback
              </span>
              <h2
                id="reviews-heading"
                className="mt-2 text-2xl font-bold sm:text-[30px]"
              >
                Published with student permission
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                Only feedback submitted after a completed order and approved for
                publication appears here.
              </p>
            </Reveal>
            <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <StaggerItem
                  key={r._id}
                  className="flex flex-col rounded-2xl border border-line bg-white p-5"
                >
                  <Quote className="size-5 text-emerald/40" aria-hidden />
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-ink">
                    “{r.feedback}”
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12px]">
                    <span className="font-semibold text-ink">
                      {r.student?.name}
                    </span>
                    <span
                      className="text-amber"
                      aria-label={`${r.rating} out of 5`}
                    >
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      <section
        className={`py-20 ${reviews.length ? "" : "border-t border-line bg-white"}`}
        aria-labelledby="faq-heading"
      >
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
              {t("home.faqTeaser.eyebrow")}
            </span>
            <h2
              id="faq-heading"
              className="mt-2 text-2xl font-bold sm:text-[30px]"
            >
              {t("home.faqTeaser.heading")}
            </h2>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              {t("home.faqTeaser.sub")}
            </p>
            <Button
              to="/faq"
              variant="soft"
              size="sm"
              className="mt-5"
              iconRight={ArrowRight}
            >
              {t("home.faqTeaser.cta")}
            </Button>
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion items={tl("home.faqs.items")} />
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="pb-24">
        <div className="container-page">
          <Reveal className="relative overflow-hidden rounded-[1.75rem] border border-forest/20 bg-gradient-to-br from-forest via-[#0f4a28] to-[#0b3a1f] px-6 py-12 text-center text-white sm:px-12">
            <div
              className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-emerald/20 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-amber/10 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11.5px] font-semibold backdrop-blur">
                <Sparkles className="size-3.5 text-amber" aria-hidden />{" "}
                {t("home.cta.badge")}
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-balance sm:text-[32px]">
                {t("home.cta.heading")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-[13.5px] leading-relaxed text-white/70">
                {t("home.cta.sub")}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2.5">
                <Button
                  to="/register"
                  size="lg"
                  variant="emerald"
                  iconRight={ArrowRight}
                >
                  {t("home.cta.primary")}
                </Button>
                <Button
                  to="/contact"
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:border-white hover:bg-white/10"
                >
                  {t("home.cta.secondary")}
                </Button>
              </div>
              <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11.5px] text-white/50">
                <span className="inline-flex items-center gap-1.5">
                  <FileCheck2 className="size-3.5" aria-hidden />{" "}
                  {t("home.cta.points.0")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden />{" "}
                  {t("home.cta.points.1")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FolderLock className="size-3.5" aria-hidden />{" "}
                  {t("home.cta.points.2")}
                </span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
