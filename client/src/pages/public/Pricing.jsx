import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Info,
  Sparkles,
  ArrowRight,
  IndianRupee,
  HandCoins,
  FileStack,
  Clock3,
} from "lucide-react";
import { api } from "../../lib/api";
import { PageHero } from "../../components/layout/PageHero";
import {
  Reveal,
  Stagger,
  StaggerItem,
} from "../../components/animations/Reveal";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PriceTable, ChargeTable } from "../../components/ui/PriceTable";
import { Skeleton } from "../../components/ui/Skeleton";
import { useSettings } from "../../hooks/useSettings";
import { money } from "../../lib/utils";
import { FreeLabManualBanner } from "../../components/marketing/FreeLabManualBanner";
import { ContactPrintingInfo } from "../../components/marketing/ContactPrintingInfo";
import { useI18n } from "../../i18n/I18nContext";

export default function Pricing() {
  const { t, tl } = useI18n();
  const { settings } = useSettings();
  const pricing = settings?.pricing || {};
  const { data, isLoading } = useQuery({
    queryKey: ["services", "pricing"],
    queryFn: async () => (await api.get("/services")).data.services,
  });

  const models = tl("pricingPage.models");

  return (
    <>
      <PageHero
        eyebrow={t("pricingPage.eyebrow")}
        title={t("pricingPage.title")}
        description={t("pricingPage.description")}
      >
        <div className="flex flex-wrap gap-2">
          {tl("pricingPage.chips").map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11.5px] font-semibold text-ink"
            >
              <Check className="size-3 text-emerald" aria-hidden /> {chip}
            </span>
          ))}
        </div>
      </PageHero>

      <section className="py-14">
        <div className="container-page">
          <FreeLabManualBanner variant="hero" className="mb-4" />
          <ContactPrintingInfo className="mb-8" delay={0.05} />
          <Stagger className="grid gap-4 lg:grid-cols-3">
            {models.map((m) => (
              <StaggerItem
                key={m.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${m.featured ? "border-forest/30 bg-gradient-to-b from-white to-mint/60 shadow-[0_30px_60px_-34px_rgba(20,83,45,0.5)]" : "border-line bg-white"}`}
              >
                {m.featured && (
                  <Badge tone="forest" className="absolute -top-2.5 left-6">
                    {t("pricingPage.featured")}
                  </Badge>
                )}
                <p className="text-[11px] font-bold tracking-[0.12em] text-emerald uppercase">
                  {m.tagline}
                </p>
                <h2 className="mt-1.5 text-xl font-bold">{m.name}</h2>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">
                  {m.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {m.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-[12.5px] text-ink"
                    >
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-emerald"
                        aria-hidden
                      />{" "}
                      {p}
                    </li>
                  ))}
                </ul>
                <Button
                  to={m.cta.to}
                  href={m.cta.href}
                  variant={m.featured ? "primary" : "secondary"}
                  className="mt-5 w-full"
                  iconRight={ArrowRight}
                >
                  {m.cta.label}
                </Button>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section
        id="starting-prices"
        className="scroll-mt-24 border-y border-line bg-white py-14"
      >
        <div className="container-page">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
                {t("pricingPage.startingPricesEyebrow")}
              </span>
              <h2 className="mt-2 text-2xl font-bold">
                {t("pricingPage.startingPricesHeading")}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                {t("pricingPage.startingPricesSub")}
              </p>
            </div>
            <Badge tone="neutral">INR ₹</Badge>
          </Reveal>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(pricing.startingPrices || []).map((p, i) => (
              <Reveal
                key={p.label}
                delay={0.03 * i}
                className="rounded-2xl border border-line bg-canvas p-4"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-white text-forest ring-1 ring-line">
                  {[IndianRupee, HandCoins, FileStack, Clock3, Sparkles][
                    i % 5
                  ] &&
                    (() => {
                      const I = [
                        IndianRupee,
                        HandCoins,
                        FileStack,
                        Clock3,
                        Sparkles,
                      ][i % 5];
                      return <I className="size-4" aria-hidden />;
                    })()}
                </span>
                <p className="mt-3 font-display text-lg leading-none font-extrabold text-forest">
                  {(() => {
                    const n = Number(String(p.price).replace(/[^0-9.]/g, ""));
                    return !isNaN(n) ? money(n) : p.price;
                  })()}
                </p>
                <p className="mt-1.5 text-[11.5px] leading-snug text-muted">
                  {p.label}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="space-y-8">
            <Reveal>
              <h2 className="text-2xl font-bold">
                {t("pricingPage.fullRateCard")}
              </h2>
              <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
                {t("pricingPage.fullRateCardSub")}
              </p>
            </Reveal>

            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))
              : (data || []).map((s) => (
                  <Reveal
                    key={s._id}
                    className="rounded-2xl border border-line bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[15px] font-bold text-ink">
                          {s.name}
                        </h3>
                        <p className="mt-0.5 text-[11.5px] text-muted">
                          {s.category} · {s.turnaroundEstimate} · from{" "}
                          {money(s.startingPrice, s.currency)}
                        </p>
                      </div>
                      <Button
                        to={`/services/${s.slug}`}
                        size="sm"
                        variant="ghost"
                        iconRight={ArrowRight}
                      >
                        {t("common.details")}
                      </Button>
                    </div>
                    <PriceTable rows={s.priceTable || []} className="mt-4" />
                  </Reveal>
                ))}
          </div>

          <div className="space-y-4">
            <Reveal className="lg:sticky lg:top-24">
              <ChargeTable
                title={t("common.additionalCharges")}
                rows={pricing.additionalCharges || []}
              />
              <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/10 p-4">
                <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8a6a12]">
                  <Clock3 className="size-3.5" aria-hidden />{" "}
                  {t("pricingPage.urgentTitle")}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[#8a6a12]/90">
                  {t("pricingPage.urgentBody")}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white py-14">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
              {t("pricingPage.policiesEyebrow")}
            </span>
            <h2 className="mt-2 text-2xl font-bold">
              {t("pricingPage.policiesHeading")}
            </h2>
          </Reveal>
          <Stagger className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(pricing.policies || []).map((p, i) => (
              <StaggerItem
                key={p.heading}
                className="rounded-2xl border border-line bg-canvas p-4"
              >
                <p className="font-display text-sm font-extrabold text-emerald">
                  0{i + 1}
                </p>
                <p className="mt-1 text-[12.5px] font-semibold text-ink">
                  {p.heading}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  {p.text}
                </p>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal
            delay={0.1}
            className="mt-6 flex flex-wrap items-start gap-2 rounded-xl border border-line bg-canvas px-4 py-3 text-[11.5px] leading-relaxed text-muted"
          >
            <Info
              className="mt-0.5 size-3.5 shrink-0 text-forest"
              aria-hidden
            />
            <span>
              <strong className="text-ink">
                {t("pricingPage.noSubStrong")}
              </strong>{" "}
              {t("pricingPage.noSubBody")}
            </span>
          </Reveal>
        </div>
      </section>
    </>
  );
}
