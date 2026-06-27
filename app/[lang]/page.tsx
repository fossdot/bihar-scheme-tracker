import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceArt } from "@/components/EvidenceArt";
import { HeroArt } from "@/components/HeroArt";
import { Icon } from "@/components/Icon";
import { PolicyBadge } from "@/components/PolicyBadge";
import { Card, FactTile } from "@/components/ui";
import { altLinks, localizedHref, pick, t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { policyStatusKey, todayISO } from "@/lib/policy";
import { getSchemeCounts, isDbConfigured, listPolicies } from "@/lib/queries";
import type { PolicyListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  const title =
    locale === "hi"
      ? "बिहार योजना ट्रैकर — अपने लिए सरकारी योजनाएँ खोजें"
      : "Bihar Scheme Tracker — Find government schemes you qualify for";
  const description =
    locale === "hi"
      ? "बताइए आप कौन हैं और बिहार व केंद्र सरकार की वे योजनाएँ पाइए जिनके लिए आप पात्र हैं — हर एक की वास्तविक स्थिति, पात्रता, लाभ और आधिकारिक लिंक के साथ।"
      : "Discover the Bihar & central government schemes you're eligible for — with real status, eligibility, benefits, and official apply links. Source-verified, evidence-based.";
  return {
    alternates: altLinks(locale, "/"),
    openGraph: { url: localizedHref(locale, "/"), title, description },
  };
}

export default async function Home({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang);
  const today = todayISO();

  let schemeCount = 0;
  let policyCount = 0;
  let verifiedActive = 0;
  let openDrafts: PolicyListItem[] = [];
  if (isDbConfigured()) {
    try {
      const [counts, policies] = await Promise.all([
        getSchemeCounts(),            // cheap aggregate — no row cap, no undercount
        listPolicies({}),
      ]);
      schemeCount = counts.total;
      verifiedActive = counts.active;
      policyCount = policies.length;
      openDrafts = policies.filter((p) => policyStatusKey(p, today) === "open");
    } catch {
      /* leave zeros — the page still renders */
    }
  }

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {t(locale, "homeTitle")}
          </h1>
          <p className="mt-4 text-ink">{t(locale, "homeBody")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={localizedHref(locale, "/find-my-schemes")}
              className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              {t(locale, "homeCtaFind")} →
            </Link>
            <Link
              href={localizedHref(locale, "/search")}
              className="inline-flex items-center rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-ink"
            >
              {t(locale, "homeCtaExplore")} →
            </Link>
            <Link
              href={localizedHref(locale, "/policies")}
              className="inline-flex items-center rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-ink"
            >
              {t(locale, "homeCtaPolicies")} →
            </Link>
          </div>
        </div>
        {/* Decorative — hidden on phones to keep the hero lean on small/slow devices */}
        <HeroArt className="hidden shrink-0 text-ink md:block md:w-[300px] lg:w-[360px]" />
      </section>

      {/* Coverage & confidence — honest about what this catalogue is */}
      <section className="flex items-center gap-6 rounded-md border border-line bg-surface p-5">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Icon name="info" className="h-4 w-4 text-brand" />
            {t(locale, "coverageTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted">{t(locale, "coverageBody")}</p>
          {verifiedActive > 0 && (
            <p className="mt-3 text-sm text-ink">
              <span className="font-semibold text-brand">{verifiedActive}</span>{" "}
              {t(locale, "coverageStat")}.
            </p>
          )}
        </div>
        {/* Decorative — hidden on phones */}
        <EvidenceArt className="hidden shrink-0 self-center text-ink lg:block lg:w-[150px]" />
      </section>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
        <FactTile icon="check" label={t(locale, "statSchemes")} value={String(schemeCount)} />
        <FactTile icon="doc" label={t(locale, "statPolicies")} value={String(policyCount)} />
        <FactTile icon="info" label={t(locale, "statOpenComments")} value={String(openDrafts.length)} />
      </div>

      {/* Open for public comments — civic call to action */}
      {openDrafts.length > 0 && (
        <Card icon="info" title={t(locale, "openConsultationsTitle")}>
          <p className="-mt-1 text-sm text-muted">{t(locale, "openConsultationsNote")}</p>
          <ul className="mt-3 divide-y divide-line">
            {openDrafts.map((p) => (
              <li key={p.id}>
                <Link
                  href={localizedHref(locale, `/policies/${p.id}`)}
                  className="flex items-start justify-between gap-3 py-3 hover:opacity-80"
                >
                  <span className="min-w-0 font-medium text-ink">
                    {pick(locale, p.name_en, p.name_hi)}
                  </span>
                  <PolicyBadge policy={p} today={today} locale={locale} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Who it's for */}
      <section className="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
        <Cell title={t(locale, "homeForCitizens")} body={t(locale, "homeForCitizensBody")} />
        <Cell title={t(locale, "homeForResearch")} body={t(locale, "homeForResearchBody")} />
        <Cell title={t(locale, "homeHonest")} body={t(locale, "homeHonestBody")} />
      </section>
    </div>
  );
}

function Cell({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-surface p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
