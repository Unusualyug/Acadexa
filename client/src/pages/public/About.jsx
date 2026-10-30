import {
  Compass,
  Eye,
  HeartHandshake,
  ShieldCheck,
  Scale,
  BookOpenCheck,
  ArrowRight,
} from "lucide-react";
import { PageHero } from "../../components/layout/PageHero";
import {
  Reveal,
  Stagger,
  StaggerItem,
} from "../../components/animations/Reveal";
import { Button } from "../../components/ui/Button";
import { useSettings } from "../../hooks/useSettings";
import { FreeLabManualBanner } from "../../components/marketing/FreeLabManualBanner";
import { FREE_LAB_MANUAL as OFFER } from "../../lib/offers";
import { Sparkles, Printer } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";

export default function About() {
  const { t } = useI18n();
  const { settings } = useSettings();
  const business = settings?.business || {};

  const values = [
    {
      icon: Compass,
      title: t("about.ourMission"),
      text: t("about.missionText"),
    },
    {
      icon: Eye,
      title: t("about.servicePhilosophy"),
      text: t("about.howWeDecide"),
    },
    {
      icon: ShieldCheck,
      title: t("about.ourVision"),
      text: t("about.visionText"),
    },
    {
      icon: Scale,
      title: t("about.honestyNote"),
      text: t("about.honestyText"),
    },
    {
      icon: HeartHandshake,
      title: t("about.missionText"),
      text: t("about.visionText"),
    },
    {
      icon: BookOpenCheck,
      title: t("about.servicePhilosophy"),
      text: t("about.howWeDecide"),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("about.eyebrow")}
        title={t("about.title")}
        description={t("about.description")}
      />

      {/* ---------- USP: free lab manual creation ---------- */}
      <section
        className="border-b border-line bg-white py-16"
        aria-labelledby="offer-heading"
      >
        <div className="container-page grid items-start gap-10 lg:grid-cols-[1fr_0.85fr]">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-[10.5px] font-bold tracking-[0.12em] text-forest uppercase">
              <Sparkles className="size-3" aria-hidden />{" "}
              {t("about.offerHeading")}
            </span>
            <h2
              id="offer-heading"
              className="mt-3 text-2xl font-bold text-balance sm:text-[28px]"
            >
              {t("about.offerHeading")}
            </h2>
            <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-muted">
              <p>
                {t("about.offerSub1")}
                <strong className="text-ink">
                  {t("about.offerConditionStrong")}
                </strong>{" "}
                {t("offer.condition")}
              </p>
              <p>{t("about.offerSub2")}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="space-y-3">
            <div className="rounded-2xl border border-line bg-canvas p-5">
              <span className="grid size-9 place-items-center rounded-lg bg-white text-forest shadow-sm ring-1 ring-line">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-[14px] font-semibold">
                {t("about.freeCreation")}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                {t("about.freeCreationDesc")}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-canvas p-5">
              <span className="grid size-9 place-items-center rounded-lg bg-white text-forest shadow-sm ring-1 ring-line">
                <Printer className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-[14px] font-semibold">
                {t("about.printingBinding")}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                {t("about.printingBindingDesc")}
              </p>
            </div>
            <FreeLabManualBanner variant="inline" />
          </Reveal>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <h2 className="text-2xl font-bold sm:text-[26px]">
              {t("about.whatWeDo")}
            </h2>
            <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-muted">
              <p>{t("about.whatWeDo1")}</p>
              <p>{t("about.whatWeDo2")}</p>
              <p>{t("about.whatWeDo3")}</p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5">
              <span className="grid size-9 place-items-center rounded-lg bg-mint text-forest">
                <Compass className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-[14px] font-semibold">
                {values[0].title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {values[0].text}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <span className="grid size-9 place-items-center rounded-lg bg-mint text-forest">
                <Eye className="size-4" aria-hidden />
              </span>
              <h3 className="mt-3 text-[14px] font-semibold">
                {values[1].title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {values[1].text}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-white py-16">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <span className="text-[11px] font-bold tracking-[0.16em] text-emerald uppercase">
              {t("about.servicePhilosophy")}
            </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-[26px]">
              {t("about.howWeDecide")}
            </h2>
          </Reveal>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.slice(2).map((v) => (
              <StaggerItem
                key={v.title}
                className="rounded-2xl border border-line bg-canvas p-5"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-white text-forest ring-1 ring-line">
                  <v.icon className="size-4" aria-hidden />
                </span>
                <h3 className="mt-3 text-[13.5px] font-semibold text-ink">
                  {v.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                  {v.text}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <Reveal className="rounded-2xl border border-emerald/25 bg-mint p-6 sm:p-8">
            <h2 className="text-xl font-bold text-forest">
              {t("about.honestyNote")}
            </h2>
            <p className="mt-2.5 max-w-3xl text-[13.5px] leading-relaxed text-forest/80">
              {t("about.honestyText")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button to="/services" iconRight={ArrowRight}>
                {t("about.browseServices")}
              </Button>
              <Button to="/contact" variant="secondary">
                {t("about.contactUs")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
