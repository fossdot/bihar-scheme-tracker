import Link from "next/link";
import { PolicyBadge } from "@/components/PolicyBadge";
import { Card, FactTile } from "@/components/ui";
import { pick, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { policyStatusKey, todayISO } from "@/lib/policy";
import { isDbConfigured, listPolicies, searchSchemes } from "@/lib/queries";
import type { PolicyListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = getLocale();
  const today = todayISO();

  let schemeCount = 0;
  let policyCount = 0;
  let openDrafts: PolicyListItem[] = [];
  if (isDbConfigured()) {
    try {
      const [schemes, policies] = await Promise.all([
        searchSchemes({ buckets: ["active", "possibly_active", "inactive"] }),
        listPolicies({}),
      ]);
      schemeCount = schemes.length;
      policyCount = policies.length;
      openDrafts = policies.filter((p) => policyStatusKey(p, today) === "open");
    } catch {
      /* leave zeros — the page still renders */
    }
  }

  return (
    <div className="space-y-10">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          {t(locale, "homeTitle")}
        </h1>
        <p className="mt-4 text-ink">{t(locale, "homeBody")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            {t(locale, "homeCtaExplore")} →
          </Link>
          <Link
            href="/policies"
            className="inline-flex items-center rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-ink"
          >
            {t(locale, "homeCtaPolicies")} →
          </Link>
        </div>
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
                  href={`/policies/${p.id}`}
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
