import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PolicyBadge } from "@/components/PolicyBadge";
import { ConfigNotice } from "@/components/ui";
import { altLinks, localizedHref, pick, t } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { todayISO } from "@/lib/policy";
import { getPolicyMap, isDbConfigured } from "@/lib/queries";
import { STATUS_META } from "@/lib/status";
import type { PolicyMapGroup } from "@/lib/queries";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: locale === "hi" ? "योजना–नीति मानचित्र" : "Scheme–policy map",
    description:
      locale === "hi"
        ? "बिहार की योजनाएँ अपने नीति-ढाँचों के अंतर्गत कैसे आती हैं — एक दृश्य मानचित्र।"
        : "How Bihar's schemes sit under their policy frameworks — a visual map.",
    alternates: altLinks(locale, "/map"),
  };
}

export default async function MapPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang);
  const today = todayISO();

  let groups: PolicyMapGroup[] = [];
  if (isDbConfigured()) {
    try {
      groups = await getPolicyMap();
    } catch {
      groups = [];
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t(locale, "mapTitle")}
        </h1>
        <p className="text-sm text-muted">{t(locale, "mapSubtitle")}</p>
      </section>

      {!isDbConfigured() ? (
        <ConfigNotice />
      ) : groups.length === 0 ? (
        <div className="rounded-md border border-line bg-paper p-6 text-sm text-muted">
          {t(locale, "mapEmpty")}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section
              key={g.policy.id}
              className="overflow-hidden rounded-md border border-line"
            >
              {/* Policy = parent node */}
              <Link
                href={localizedHref(locale, `/policies/${g.policy.id}`)}
                className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 hover:bg-line/40"
              >
                <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-ink">
                  <Icon name="doc" className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate">{pick(locale, g.policy.name_en, g.policy.name_hi)}</span>
                </span>
                <PolicyBadge policy={g.policy} today={today} locale={locale} size="sm" />
              </Link>

              {/* Schemes = child nodes, drawn as a branching tree from the policy */}
              <ul className="list-none p-3 pl-4">
                {g.schemes.map((s, i) => {
                  const meta = STATUS_META[s.status] ?? STATUS_META.unknown;
                  const last = i === g.schemes.length - 1;
                  return (
                    <li key={s.id} className="relative pl-6 leading-8">
                      {/* vertical trunk (stops at the tick on the last child) */}
                      <span
                        className="absolute left-1.5 top-0 w-px bg-line"
                        style={{ height: last ? "1rem" : "100%" }}
                        aria-hidden="true"
                      />
                      {/* horizontal branch to this node */}
                      <span
                        className="absolute left-1.5 top-4 h-px w-3 bg-line"
                        aria-hidden="true"
                      />
                      <Link
                        href={localizedHref(locale, `/schemes/${s.id}`)}
                        className="flex min-w-0 items-center gap-2 text-sm hover:underline"
                        title={locale === "hi" ? meta.hi : meta.en}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 break-words text-ink">{pick(locale, s.name_en, s.name_hi)}</span>
                        {/* status conveyed by colour dot for sighted users; sr-only text for the rest */}
                        <span className="sr-only">— {locale === "hi" ? meta.hi : meta.en}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
