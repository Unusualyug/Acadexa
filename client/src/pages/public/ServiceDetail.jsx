import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileUp,
  Info,
  RefreshCcw,
  ShieldCheck,
  XCircle,
  ArrowRight,
  ListChecks,
} from "lucide-react";
import { api } from "../../lib/api";
import { ServiceIcon } from "../../components/ui/ServiceIcon";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Reveal } from "../../components/animations/Reveal";
import { FreeLabManualBanner } from "../../components/marketing/FreeLabManualBanner";
import { ContactPrintingInfo } from "../../components/marketing/ContactPrintingInfo";
import { money } from "../../lib/utils";
import { PriceTable, ChargeTable } from "../../components/ui/PriceTable";
import { useSettings } from "../../hooks/useSettings";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../i18n/I18nContext";

function List({ title, items, icon: Icon, tone = "mint" }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
        <Icon className="size-4 text-forest" aria-hidden />
        {title}
      </h3>
      <ul className="mt-2.5 space-y-2">
        {items.map((i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[13px] leading-relaxed text-muted"
          >
            <span
              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${tone === "danger" ? "bg-danger/70" : "bg-emerald"}`}
              aria-hidden
            />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ServiceDetail() {
  const { t, tl } = useI18n();
  const { slug } = useParams();
  const { user } = useAuth();
  const { settings } = useSettings();
  const extraCharges = settings?.pricing?.additionalCharges || [];
  const { data, isLoading, isError } = useQuery({
    queryKey: ["service", slug],
    queryFn: async () => (await api.get(`/services/slug/${slug}`)).data.service,
  });

  if (isLoading) {
    return (
      <div className="container-page py-14">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-5 h-10 w-2/3" />
        <Skeleton className="mt-4 h-4 w-1/2" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container-page py-20">
        <EmptyState
          title={t("serviceDetail.notFoundTitle")}
          description={t("serviceDetail.notFoundBody")}
          actionLabel={t("serviceDetail.notFoundCta")}
          actionTo="/services"
        />
      </div>
    );
  }

  const s = data;
  const requestHref =
    user?.role === "student"
      ? `/dashboard/requests/new?service=${s._id}`
      : `/register?next=${encodeURIComponent(`/dashboard/requests/new?service=${s._id}`)}`;

  // Build "What You'll Get" deliverables from service data
  const deliverables = [];
  if (s.revisionLimit > 0)
    deliverables.push({
      label: t("whatYoullGet.revisions"),
      value: `${s.revisionLimit} revision${s.revisionLimit === 1 ? "" : "s"}`,
    });
  deliverables.push({
    label: t("whatYoullGet.delivery"),
    value: s.turnaroundEstimate,
  });
  if (s.slug === "practical-lab-manual-support") {
    deliverables.push({
      label: t("whatYoullGet.printCopy"),
      value: "Printed and bound lab manual",
    });
    deliverables.push({
      label: t("whatYoullGet.digitalCopy"),
      value: "Digital PDF copy",
    });
    deliverables.push({
      label: t("whatYoullGet.scannedCopy"),
      value: "Scanned copy of the bound manual",
    });
  } else if (s.slug === "printing-binding") {
    deliverables.push({
      label: t("whatYoullGet.printCopy"),
      value: "Printed and bound documents",
    });
    deliverables.push({
      label: t("whatYoullGet.digitalCopy"),
      value: "Digital proof before printing",
    });
  }

  const conditions = [
    { label: t("whatYoullGet.conditions"), items: s.included || [] },
    {
      label: t("whatYoullGet.exclusions"),
      items: s.excluded || [],
      tone: "danger",
    },
    {
      label: t("whatYoullGet.customerResponsibilities"),
      items: s.requirements || [],
    },
  ];

  return (
    <>
      <section className="mesh-hero border-b border-line">
        <div className="container-page py-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-forest"
          >
            <ArrowLeft className="size-3.5" aria-hidden />{" "}
            {t("serviceDetail.back")}
          </Link>
          <Reveal className="mt-5 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl bg-forest text-white">
                  <ServiceIcon name={s.icon} className="size-6" />
                </span>
                <div>
                  <Badge tone="neutral">{s.category}</Badge>
                  <h1 className="mt-1.5 font-display text-[1.8rem] leading-tight font-extrabold text-ink sm:text-[2.2rem]">
                    {s.name}
                  </h1>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">
                {s.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-forest" aria-hidden />{" "}
                  {s.turnaroundEstimate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <RefreshCcw className="size-4 text-forest" aria-hidden />{" "}
                  {s.revisionLimit} revision{s.revisionLimit === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileUp className="size-4 text-forest" aria-hidden />{" "}
                  {s.acceptedFormats?.join(" · ")}
                </span>
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-[0_20px_44px_-30px_rgba(20,83,45,0.5)]">
              <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
                {s.startingPrice > 0 ? t("money.startingFrom") : "Pricing"}
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold text-forest">
                {s.startingPrice > 0
                  ? money(s.startingPrice, s.currency)
                  : t("money.quotedPerJob")}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                {t("serviceDetail.priceNote")}
              </p>
              <Button
                to={requestHref}
                className="mt-5 w-full"
                iconRight={ArrowRight}
              >
                {t("serviceDetail.request")}
              </Button>
              <Button
                to="/contact?intent=quote"
                variant="secondary"
                className="mt-2 w-full"
              >
                {t("serviceDetail.ask")}
              </Button>
              <div className="mt-4 space-y-2 border-t border-line pt-4 text-[11.5px] text-muted">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald" aria-hidden />{" "}
                  {t("serviceDetail.approvedBefore")}
                </p>
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald" aria-hidden />{" "}
                  {s.revisionPolicy}
                </p>
              </div>
            </aside>
          </Reveal>

          {["practical-lab-manual-support", "printing-binding"].includes(
            s.slug,
          ) && (
            <>
              <Reveal className="mt-6">
                <FreeLabManualBanner variant="hero" />
              </Reveal>
              <div className="mt-4">
                <ContactPrintingInfo delay={0.05} />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-8">
            {/* "What You'll Get" checklist — ABOVE pricing */}
            <Reveal>
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-bold text-ink">
                  {t("whatYoullGet.heading")}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                  {t("serviceDetail.whatYoullGetIntro")}
                </p>

                {/* Deliverables grid */}
                <div className="mt-5">
                  <h3 className="text-[13px] font-semibold text-ink">
                    {t("whatYoullGet.deliverables")}
                  </h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {deliverables.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-3"
                      >
                        <CheckCircle2
                          className="mt-0.5 size-4 shrink-0 text-emerald"
                          aria-hidden
                        />
                        <div>
                          <p className="text-[12.5px] font-semibold text-ink">
                            {d.label}
                          </p>
                          <p className="text-[11.5px] leading-relaxed text-muted">
                            {d.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conditions / exclusions / responsibilities */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {conditions.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-line bg-white p-4"
                    >
                      <h3 className="text-[12.5px] font-semibold text-ink">
                        {c.label}
                      </h3>
                      <ul className="mt-2.5 space-y-1.5 text-[12px] leading-relaxed text-muted">
                        {c.items.map((item, j) => (
                          <li
                            key={j}
                            className={`flex items-start gap-1.5 ${c.tone === "danger" ? "text-danger/80" : "text-muted"}`}
                          >
                            <span
                              className={`mt-1 size-1 shrink-0 rounded-full ${c.tone === "danger" ? "bg-danger/70" : "bg-emerald"}`}
                              aria-hidden
                            />
                            {item}
                          </li>
                        ))}
                        {c.items.length === 0 && (
                          <p className="text-[11.5px] text-slate-400 italic">
                            —
                          </p>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Price sheet */}
            {s.priceTable?.length > 0 && (
              <Reveal>
                <div className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
                    <h2 className="text-lg font-bold text-ink">
                      {t("serviceDetail.priceSheet")}
                    </h2>
                    <span className="rounded-full border border-emerald/25 bg-mint px-2.5 py-0.5 text-[11px] font-semibold text-forest">
                      {t("serviceDetail.payPerWork")}
                    </span>
                  </div>
                  {s.priceNote && (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                      {s.priceNote}
                    </p>
                  )}
                  <PriceTable rows={s.priceTable} className="mt-3" />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <ChargeTable
                      rows={
                        s.additionalCharges?.length
                          ? s.additionalCharges
                          : extraCharges
                      }
                      title={t("serviceDetail.additionalCharges")}
                    />
                    <div className="rounded-2xl border border-emerald/25 bg-mint p-4">
                      <p className="text-[12.5px] font-semibold text-forest">
                        {t("serviceDetail.notSureTitle")}
                      </p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-forest/80">
                        {t("serviceDetail.notSureBody")}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}

            <Reveal>
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-bold text-ink">
                  {t("serviceDetail.included")}
                </h2>
                <div className="mt-3 grid gap-6 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
                  <List
                    title={t("serviceDetail.includedWork")}
                    items={s.included}
                    icon={CheckCircle2}
                  />
                  <List
                    title={t("serviceDetail.notIncluded")}
                    items={s.excluded}
                    icon={XCircle}
                    tone="danger"
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-bold text-ink">
                  {t("serviceDetail.requirements")}
                </h2>
                <div className="mt-3 rounded-xl border border-line bg-white p-5">
                  <List
                    title={t("serviceDetail.requirementsTitle")}
                    items={s.requirements}
                    icon={ListChecks}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-bold text-ink">
                  {t("serviceDetail.terms")}
                </h2>
                <div className="mt-3 space-y-3 rounded-xl border border-line bg-white p-5 text-[13px] leading-relaxed text-muted">
                  <p>
                    <strong className="text-ink">
                      {t("serviceDetail.termsPricing")}:
                    </strong>{" "}
                    {s.pricingModel === "fixed"
                      ? t("serviceDetail.termsPricingFixed")
                      : t("serviceDetail.termsPricingCustom")}
                  </p>
                  <p>
                    <strong className="text-ink">
                      {t("serviceDetail.termsTurnaround")}:
                    </strong>{" "}
                    {s.turnaroundEstimate}.{" "}
                    {t("serviceDetail.termsTurnaroundBody")}
                  </p>
                  <p>
                    <strong className="text-ink">
                      {t("serviceDetail.termsRevisions")}:
                    </strong>{" "}
                    {s.revisionPolicy}
                  </p>
                  <p className="flex items-start gap-2 rounded-xl bg-mint p-3.5 text-forest">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      <strong className="font-semibold">
                        {t("serviceDetail.integrity")}:
                      </strong>{" "}
                      {s.integrityNotes}
                    </span>
                  </p>
                </div>
              </div>
            </Reveal>

            {s.faqs?.length > 0 && (
              <Reveal delay={0.15}>
                <div className="rounded-2xl border border-line bg-white p-5">
                  <h2 className="text-lg font-bold text-ink">
                    {t("serviceDetail.serviceFaqs")}
                  </h2>
                  <div className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                    {s.faqs.map((f) => (
                      <div key={f.question} className="p-5">
                        <p className="text-[13.5px] font-semibold text-ink">
                          {f.question}
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted">
                          {f.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>

          <aside className="space-y-4">
            <Reveal className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-[13.5px] font-semibold text-ink">
                {t("serviceDetail.process")}
              </h2>
              <ol className="mt-3 space-y-3">
                {(tl("serviceDetail.processSteps") || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-mint text-[10px] font-bold text-forest">
                      {i + 1}
                    </span>
                    <span className="text-[12.5px] leading-relaxed text-muted">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal
              delay={0.05}
              className="rounded-2xl border border-emerald/25 bg-mint p-5"
            >
              <h2 className="text-[13.5px] font-semibold text-forest">
                {t("serviceDetail.confidentiality")}
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-forest/80">
                {t("serviceDetail.confidentialityBody")}
              </p>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
