import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Search, X, CircleHelp } from "lucide-react";
import { PageHero } from "../../components/layout/PageHero";
import { Input } from "../../components/ui/Field";
import { PillTabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useI18n } from "../../i18n/I18nContext";

function AccordionGroup({ items, defaultOpen = -1 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {items.map((item, i) => {
        const active = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(active ? -1 : i)}
              aria-expanded={active}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-canvas"
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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
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

export default function Faq() {
  const { t, tl } = useI18n();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");

  const groups = tl("faq.groups");
  const allItems = tl("faq.items");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups
      .filter((g) => group === "All" || g.label === group)
      .map((g) => ({
        ...g,
        items: allItems
          .filter((i) => i.group === g.id)
          .filter(
            (i) => !needle || `${i.q} ${i.a}`.toLowerCase().includes(needle),
          ),
      }))
      .filter((g) => g.items.length);
  }, [q, group, groups, allItems]);

  return (
    <>
      <PageHero
        eyebrow={t("faqPage.eyebrow")}
        title={t("faqPage.title")}
        description={t("faqPage.description")}
      />

      <section className="py-12">
        <div className="container-page">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("faqPage.searchPlaceholder")}
                aria-label="Search FAQs"
                className="pl-10"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              )}
            </div>
            <PillTabs
              options={["All", ...groups.map((g) => g.label)]}
              value={group}
              onChange={setGroup}
              layoutId="faq-tab"
            />
          </div>

          <div className="mt-8 space-y-8">
            {filtered.length === 0 ? (
              <EmptyState
                icon={CircleHelp}
                title={t("faqPage.emptyTitle")}
                description={t("faqPage.emptyBody")}
                actionLabel={t("faqPage.contactCta")}
                actionTo="/contact"
              />
            ) : (
              filtered.map((g) => (
                <div key={g.label}>
                  <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold tracking-[0.1em] text-emerald uppercase">
                    <span
                      className="size-1.5 rounded-full bg-emerald"
                      aria-hidden
                    />{" "}
                    {g.label}
                  </h2>
                  <AccordionGroup items={g.items} defaultOpen={0} />
                </div>
              ))
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-6">
            <div>
              <h2 className="text-base font-bold">Still need help?</h2>
              <p className="mt-1 text-[13px] text-muted">
                Send a message, or raise a ticket from your dashboard once
                you're signed in.
              </p>
            </div>
            <div className="flex gap-2">
              <Button to="/contact">Contact us</Button>
              <Button to="/dashboard/support" variant="secondary">
                Support tickets
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
