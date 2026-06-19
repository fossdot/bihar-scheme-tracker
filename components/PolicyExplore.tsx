"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PolicyBadge } from "@/components/PolicyBadge";
import { deadlineLabel, validityLabel } from "@/lib/dates";
import { CATEGORY_OPTIONS, categoryLabel } from "@/lib/facets";
import { pick, t, tryT, type Locale } from "@/lib/i18n";
import { policyBucket, policyStatusKey, type PolicyBucket } from "@/lib/policy";
import type { PolicyListItem, SchemeCategory } from "@/lib/types";

const VIEWS: { key: "all" | PolicyBucket; label: Parameters<typeof t>[1] }[] = [
  { key: "all", label: "viewAll" },
  { key: "open", label: "viewOpen" },
  { key: "in_force", label: "viewInForce" },
  { key: "past", label: "viewPast" },
];

export function PolicyExplore({
  locale,
  today,
  policies,
  initialView,
  initialCat,
}: {
  locale: Locale;
  today: string;
  policies: PolicyListItem[];
  initialView: string;
  initialCat: string;
}) {
  const router = useRouter();
  const validView = (["open", "in_force", "past"] as string[]).includes(initialView)
    ? (initialView as PolicyBucket)
    : "all";
  const validCat = CATEGORY_OPTIONS.some((o) => o.value === initialCat)
    ? (initialCat as SchemeCategory)
    : "";
  const [view, setView] = useState<"all" | PolicyBucket>(validView);
  const [cat, setCat] = useState<SchemeCategory | "">(validCat);

  // Persist filters (sessionStorage + URL) so Back restores them — sessionStorage is the reliable
  // path since Next's client cache can re-render /policies unfiltered on Back.
  useEffect(() => {
    const p = new URLSearchParams();
    if (view !== "all") p.set("view", view);
    if (cat) p.set("sector", cat);
    const qs = p.toString();
    try {
      sessionStorage.setItem("bst.policyFilters", qs);
    } catch {
      /* ignore */
    }
    router.replace(qs ? `/policies?${qs}` : "/policies", { scroll: false });
  }, [view, cat, router]);

  // On mount: if the URL carried no filters, restore the last-used ones.
  useEffect(() => {
    if (initialView || initialCat) return;
    try {
      const saved = sessionStorage.getItem("bst.policyFilters");
      if (!saved) return;
      const sp = new URLSearchParams(saved);
      const v = sp.get("view");
      const c = sp.get("sector");
      if (v && (["open", "in_force", "past"] as string[]).includes(v)) setView(v as PolicyBucket);
      if (c && CATEGORY_OPTIONS.some((o) => o.value === c)) setCat(c as SchemeCategory);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only sectors that actually appear, so the dropdown isn't cluttered with empties.
  const presentCats = useMemo(() => {
    const set = new Set<string>();
    policies.forEach((p) => p.categories.forEach((c) => set.add(c)));
    return CATEGORY_OPTIONS.filter((o) => set.has(o.value));
  }, [policies]);

  const shown = useMemo(() => {
    return policies.filter((p) => {
      if (cat && !p.categories.includes(cat)) return false;
      if (view !== "all" && policyBucket(policyStatusKey(p, today)) !== view) return false;
      return true;
    });
  }, [view, cat, policies, today]);

  const selectCls =
    "shrink-0 rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink focus:border-brand";

  return (
    <div className="space-y-5">
      {/* Filters (free-text search lives in the global navbar now) */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={view}
          onChange={(e) => setView(e.target.value as "all" | PolicyBucket)}
          aria-label={t(locale, "policyView")}
          className={selectCls}
        >
          {VIEWS.map((v) => (
            <option key={v.key} value={v.key}>
              {t(locale, v.label)}
            </option>
          ))}
        </select>
        {presentCats.length > 1 && (
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value as SchemeCategory | "")}
            aria-label={t(locale, "sector")}
            className={selectCls}
          >
            <option value="">{t(locale, "allSectors")}</option>
            {presentCats.map((o) => (
              <option key={o.value} value={o.value}>
                {locale === "hi" ? o.hi : o.en}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-sm text-muted">
        <span className="font-medium text-ink">{shown.length}</span>{" "}
        {shown.length === 1 ? t(locale, "policyOne") : t(locale, "policyMany")}
      </p>

      {shown.length === 0 ? (
        <div className="rounded-md border border-line bg-paper p-6 text-sm text-muted">
          {t(locale, "noPolicies")}
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
          {shown.map((p) => {
            const name = pick(locale, p.name_en, p.name_hi);
            const sub =
              locale === "hi"
                ? p.name_en && p.name_hi
                  ? p.name_en
                  : null
                : p.name_hi;
            const summary = pick(locale, p.summary_en, p.summary_hi);
            const dept = pick(locale, p.department_en, p.department_hi);
            const key = policyStatusKey(p, today);
            const rel =
              key === "open"
                ? deadlineLabel(p.consultation_end, today, locale)?.text
                : key === "in_force" || key === "lapsed"
                  ? validityLabel(p.period_end, today, locale)?.text
                  : null;
            return (
              <li key={p.id}>
                <Link href={`/policies/${p.id}`} className="block bg-surface p-4 hover:bg-paper">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink">{name}</h3>
                      {sub && <p className="text-sm text-muted">{sub}</p>}
                    </div>
                    <PolicyBadge policy={p} today={today} locale={locale} size="sm" />
                  </div>
                  {summary && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">{summary}</p>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted">
                    {p.categories.map((c) => (
                      <span key={c} className="rounded border border-line px-2 py-0.5 text-ink">
                        {categoryLabel(locale, c)}
                      </span>
                    ))}
                    {p.policy_type && (
                      <span className="rounded border border-line px-2 py-0.5 text-ink">
                        {tryT(locale, `pt_${p.policy_type}`, p.policy_type)}
                      </span>
                    )}
                    {dept && <span>{dept}</span>}
                    {rel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{rel}</span>
                      </>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
