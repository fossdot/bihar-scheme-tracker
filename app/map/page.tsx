import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PolicyBadge } from "@/components/PolicyBadge";
import { ConfigNotice } from "@/components/ui";
import { pick, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { todayISO } from "@/lib/policy";
import { getPolicyMap, isDbConfigured } from "@/lib/queries";
import { STATUS_META } from "@/lib/status";
import type { PolicyMapGroup } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const locale = getLocale();
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
                href={`/policies/${g.policy.id}`}
                className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 hover:bg-line/40"
              >
                <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-ink">
                  <Icon name="doc" className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate">{pick(locale, g.policy.name_en, g.policy.name_hi)}</span>
                </span>
                <PolicyBadge policy={g.policy} today={today} locale={locale} size="sm" />
              </Link>

              {/* Schemes = child nodes */}
              <div className="flex flex-wrap gap-2 p-4">
                {g.schemes.map((s) => {
                  const meta = STATUS_META[s.status] ?? STATUS_META.unknown;
                  return (
                    <Link
                      key={s.id}
                      href={`/schemes/${s.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink hover:border-ink"
                      title={locale === "hi" ? meta.hi : meta.en}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
                        aria-hidden="true"
                      />
                      {pick(locale, s.name_en, s.name_hi)}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
