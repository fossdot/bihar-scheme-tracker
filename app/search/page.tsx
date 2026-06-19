import { LiveSearch } from "@/components/LiveSearch";
import { ConfigNotice } from "@/components/ui";
import { parseFilters } from "@/lib/facets";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { isDbConfigured, searchSchemes } from "@/lib/queries";
import type { SchemeListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

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
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = getLocale();
  const params = toSearchParams(searchParams);
  const initialFilters = parseFilters(params);
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
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t(locale, "exploreTitle")}
        </h1>
        <p className="text-sm text-muted">{t(locale, "exploreSubtitle")}</p>
      </section>

      {!configured ? (
        <ConfigNotice />
      ) : (
        <LiveSearch
          locale={locale}
          initialQuery={params.toString()}
          initialResults={initialResults}
        />
      )}
    </div>
  );
}
