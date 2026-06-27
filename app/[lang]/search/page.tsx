import type { Metadata } from "next";
import { LiveSearch } from "@/components/LiveSearch";
import { SchemesArt } from "@/components/SchemesArt";
import { ConfigNotice } from "@/components/ui";
import { parseFilters } from "@/lib/facets";
import { altLinks, t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { todayISO } from "@/lib/policy";
import { isDbConfigured, searchSchemes } from "@/lib/queries";
import type { SchemeListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: locale === "hi" ? "योजनाएँ देखें" : "Browse schemes",
    description:
      locale === "hi"
        ? "बिहार व केंद्र सरकार की योजनाएँ क्षेत्र, पात्रता और स्थिति के अनुसार देखें व छाँटें — हर एक की प्रमाण-आधारित स्थिति और आधिकारिक लिंक सहित।"
        : "Browse and filter Bihar & central government schemes by sector, eligibility, and status — each with its evidence-based status and official links.",
    alternates: altLinks(locale, "/search"),
  };
}

/** Flatten Next's searchParams object into a URLSearchParams so the same parseFilters()
 *  used by the JSON API drives the SSR render. */
function toSearchParams(sp: {
  [key: string]: string | string[] | undefined;
}): URLSearchParams {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => out.append(k, x));
    else if (typeof v === "string") out.set(k, v);
  }
  return out;
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = resolveLocale(params.lang);
  const query = toSearchParams(searchParams);
  const initialFilters = parseFilters(query);
  const configured = isDbConfigured();

  // SSR the initial results so shared links / no-JS render; the client takes over live.
  let initialResults: SchemeListItem[] = [];
  if (configured) {
    try {
      initialResults = await searchSchemes(initialFilters);
    } catch {
      initialResults = [];
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-5">
        <SchemesArt className="h-auto w-[132px] shrink-0 text-ink" />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {t(locale, "exploreTitle")}
          </h1>
          <p className="text-sm text-muted">{t(locale, "exploreSubtitle")}</p>
        </div>
      </section>

      {!configured ? (
        <ConfigNotice />
      ) : (
        <LiveSearch
          locale={locale}
          today={todayISO()}
          initialQuery={query.toString()}
          initialResults={initialResults}
        />
      )}
    </div>
  );
}
