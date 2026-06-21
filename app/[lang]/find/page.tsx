import type { Metadata } from "next";
import Link from "next/link";
import { PolicyBadge } from "@/components/PolicyBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfigNotice } from "@/components/ui";
import { categoryLabel } from "@/lib/facets";
import { localizedHref, pick, t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { todayISO } from "@/lib/policy";
import { isDbConfigured, listPolicies, searchSchemes } from "@/lib/queries";
import { logSearch } from "@/lib/searchlog";
import type { PolicyListItem, SchemeListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: locale === "hi" ? "खोज" : "Search",
    description:
      locale === "hi"
        ? "बिहार सरकार की योजनाएँ व नीतियाँ नाम से खोजें।"
        : "Search Bihar government schemes and policies by name.",
    // Query-driven results page — noindex, so a self-canonical only (no hreflang).
    alternates: { canonical: localizedHref(locale, "/find") },
    robots: { index: false, follow: true },
  };
}

export default async function FindPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = resolveLocale(params.lang);
  const today = todayISO();
  const q = (typeof searchParams.q === "string" ? searchParams.q : "").trim();

  let schemes: SchemeListItem[] = [];
  let policies: PolicyListItem[] = [];
  if (isDbConfigured() && q) {
    try {
      [schemes, policies] = await Promise.all([
        searchSchemes({ q, buckets: ["active", "possibly_active", "inactive"] }),
        listPolicies({ q }),
      ]);
    } catch {
      /* leave empty */
    }
    logSearch({ surface: "navbar", q, resultCount: schemes.length + policies.length });
  }
  const total = schemes.length + policies.length;

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t(locale, "findTitle")}
        </h1>
        <p className="text-sm text-muted">
          {q ? (
            <>
              {total} {total === 1 ? t(locale, "resultsOne") : t(locale, "resultsMany")}{" "}
              {t(locale, "forQuery")} “{q}”
            </>
          ) : (
            t(locale, "findPrompt")
          )}
        </p>
      </section>

      {!isDbConfigured() ? (
        <ConfigNotice />
      ) : q && total === 0 ? (
        <div className="rounded-md border border-line bg-paper p-6 text-sm text-muted">
          {t(locale, "findNothing")} “{q}”.
        </div>
      ) : (
        <div className="space-y-8">
          {schemes.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {t(locale, "navSchemes")} · {schemes.length}
              </h2>
              <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
                {schemes.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={localizedHref(locale, `/schemes/${s.id}`)}
                      className="flex items-start justify-between gap-3 bg-surface p-3 hover:bg-paper"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-ink">
                          {pick(locale, s.name_en, s.name_hi)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted">
                          {s.categories.map((c) => (
                            <span
                              key={c}
                              className="rounded border border-line px-1.5 py-0.5 text-ink"
                            >
                              {categoryLabel(locale, c)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <StatusBadge status={s.status} locale={locale} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {policies.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {t(locale, "navPolicies")} · {policies.length}
              </h2>
              <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
                {policies.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={localizedHref(locale, `/policies/${p.id}`)}
                      className="flex items-start justify-between gap-3 bg-surface p-3 hover:bg-paper"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-ink">
                          {pick(locale, p.name_en, p.name_hi)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted">
                          {p.categories.map((c) => (
                            <span
                              key={c}
                              className="rounded border border-line px-1.5 py-0.5 text-ink"
                            >
                              {categoryLabel(locale, c)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <PolicyBadge policy={p} today={today} locale={locale} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
