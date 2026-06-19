"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { Panel } from "@/components/ui";
import {
  CATEGORY_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  PERSONA_OPTIONS,
  SOCIAL_CATEGORY_OPTIONS,
} from "@/lib/facets";
import { ago, fmtDate, isStale } from "@/lib/dates";
import { pick, t, type Locale } from "@/lib/i18n";
import {
  BUCKET_META,
  DEFAULT_BUCKETS,
  isUnverified,
} from "@/lib/status";
import type {
  EducationLevel,
  Persona,
  SchemeCategory,
  SchemeListItem,
  SchemeStatus,
  SocialCategory,
  StatusBucket,
} from "@/lib/types";

type Gender = "" | "female" | "male" | "transgender";
type SortKey = "relevance" | "name" | "status" | "verified";

type State = {
  q: string;
  buckets: StatusBucket[];
  personas: Persona[];
  education: EducationLevel | "";
  gender: Gender;
  age: string;
  social: SocialCategory[];
  categories: SchemeCategory[];
  sort: SortKey;
};

const ALL_BUCKETS: StatusBucket[] = ["active", "possibly_active", "inactive"];
const STATUS_RANK: Record<SchemeStatus, number> = {
  active: 0,
  likely_active: 1,
  dormant: 2,
  unknown: 3,
  subsumed: 4,
  superseded: 5,
  lapsed: 6,
};

const defaultState = (): State => ({
  q: "",
  buckets: [...DEFAULT_BUCKETS],
  personas: [],
  education: "",
  gender: "",
  age: "",
  social: [],
  categories: [],
  sort: "relevance",
});

const csv = (raw: string | null) =>
  (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

function parseState(qs: string): State {
  const p = new URLSearchParams(qs);
  const d = defaultState();
  const buckets = csv(p.get("buckets")).filter((v) =>
    ALL_BUCKETS.includes(v as StatusBucket)
  ) as StatusBucket[];
  const sort = (p.get("sort") ?? "") as SortKey;
  return {
    q: p.get("q") ?? "",
    buckets: buckets.length ? buckets : d.buckets,
    personas: csv(p.get("persona")) as Persona[],
    education: (p.get("education") ?? "") as EducationLevel | "",
    gender: (p.get("gender") ?? "") as Gender,
    age: p.get("age") ?? "",
    social: csv(p.get("social")) as SocialCategory[],
    categories: csv(p.get("category")) as SchemeCategory[],
    sort: (["name", "status", "verified", "relevance"] as SortKey[]).includes(sort)
      ? sort
      : "relevance",
  };
}

// State → URL params. Keep param names in sync with lib/facets.ts parseFilters().
function buildParams(s: State): string {
  const p = new URLSearchParams();
  if (s.q.trim()) p.set("q", s.q.trim());
  if (s.personas.length) p.set("persona", s.personas.join(","));
  if (s.education) p.set("education", s.education);
  if (s.gender) p.set("gender", s.gender);
  if (s.age.trim()) p.set("age", s.age.trim());
  if (s.social.length) p.set("social", s.social.join(","));
  if (s.categories.length) p.set("category", s.categories.join(","));
  if (!sameSet(s.buckets, DEFAULT_BUCKETS)) p.set("buckets", s.buckets.join(","));
  if (s.sort !== "relevance") p.set("sort", s.sort);
  return p.toString();
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function ageBand(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${min}–${max}`;
  if (min != null) return `${min}+`;
  if (max != null) return `≤${max}`;
  return null;
}

const hasEligibility = (s: State) =>
  s.personas.length > 0 ||
  s.social.length > 0 ||
  s.education !== "" ||
  s.gender !== "" ||
  s.age.trim() !== "";

export function LiveSearch({
  locale,
  today,
  initialQuery,
  initialResults,
}: {
  locale: Locale;
  today: string;
  initialQuery: string; // initial URL query string (e.g. "persona=student&age=22")
  initialResults: SchemeListItem[];
}) {
  const [state, setState] = useState<State>(() => parseState(initialQuery));
  const [results, setResults] = useState<SchemeListItem[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile
  const [resultView, setResultView] = useState<"cards" | "table">("table");
  const [eligOpen, setEligOpen] = useState(() => hasEligibility(parseState(initialQuery)));
  const firstRun = useRef(true);
  const router = useRouter();

  const paramsStr = useMemo(() => buildParams(state), [state]);
  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));

  // Refetch only when a SERVER-affecting param changes (sort is client-side).
  const serverParams = useMemo(() => {
    const p = new URLSearchParams(paramsStr);
    p.delete("sort");
    return p.toString();
  }, [paramsStr]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?${serverParams}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { results?: SchemeListItem[] };
        setResults(data.results ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Search failed.");
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [serverParams]);

  // Persist filters to sessionStorage AND the URL. sessionStorage is the reliable restore path:
  // Next's client cache can re-render /search as first loaded (unfiltered) on Back, so on mount
  // we re-apply the saved filters. The URL stays in sync for shareable links.
  useEffect(() => {
    try {
      sessionStorage.setItem("bst.schemeFilters", paramsStr);
    } catch {
      /* ignore */
    }
    router.replace(paramsStr ? `/search?${paramsStr}` : "/search", { scroll: false });
  }, [paramsStr, router]);

  // On mount: if the URL carried no filters, restore the last-used ones (survives Back).
  useEffect(() => {
    if (initialQuery) return; // URL already specifies filters → respect them
    try {
      const saved = sessionStorage.getItem("bst.schemeFilters");
      if (saved) {
        setState(parseState(saved));
        setEligOpen(hasEligibility(parseState(saved)));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const display = useMemo(() => {
    const arr = [...results];
    if (state.sort === "name")
      arr.sort((a, b) =>
        pick(locale, a.name_en, a.name_hi).localeCompare(
          pick(locale, b.name_en, b.name_hi)
        )
      );
    else if (state.sort === "status")
      arr.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
    else if (state.sort === "verified")
      arr.sort((a, b) => (b.last_verified ?? "").localeCompare(a.last_verified ?? ""));
    return arr;
  }, [results, state.sort, locale]);

  const anyFilter = paramsStr.length > 0;
  const label = (en: string, hi: string) => (locale === "hi" ? hi : en);

  return (
    <div className="space-y-6">
      {/* Mobile filters toggle (free-text search lives in the global navbar now) */}
      <button
        type="button"
        onClick={() => setFiltersOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-line px-3 py-2 text-sm font-medium text-ink lg:hidden"
        aria-expanded={filtersOpen}
      >
        <span>{t(locale, "filters")}</span>
        <span className="text-muted">{filtersOpen ? "▲" : "▼"}</span>
      </button>

      <div className="lg:flex lg:gap-8">
        {/* ── Left filter sidebar ── */}
        <aside
          className={`${filtersOpen ? "block" : "hidden"} space-y-6 lg:sticky lg:top-4 lg:block lg:w-64 lg:shrink-0 lg:self-start`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">{t(locale, "filters")}</h2>
            {anyFilter && (
              <button
                type="button"
                onClick={() => setState(defaultState())}
                className="text-sm font-medium text-brand hover:underline"
              >
                {t(locale, "clearAll")}
              </button>
            )}
          </div>

          {/* Status */}
          <Group title={t(locale, "status")}>
            <div className="space-y-1.5">
              {ALL_BUCKETS.map((b) => (
                <Check
                  key={b}
                  checked={state.buckets.includes(b)}
                  onChange={() => set({ buckets: toggle(state.buckets, b) })}
                  label={label(BUCKET_META[b].en, BUCKET_META[b].hi)}
                />
              ))}
            </div>
          </Group>

          {/* Sector */}
          <Group title={t(locale, "sector")}>
            <ChipWrap>
              {CATEGORY_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  on={state.categories.includes(o.value)}
                  onClick={() => set({ categories: toggle(state.categories, o.value) })}
                >
                  {label(o.en, o.hi)}
                </Chip>
              ))}
            </ChipWrap>
          </Group>

          {/* Who it's for — collapsible (citizen eligibility) */}
          <div>
            <button
              type="button"
              onClick={() => setEligOpen((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted"
              aria-expanded={eligOpen}
            >
              <span>{t(locale, "eligibilityGroup")}</span>
              <span>{eligOpen ? "▲" : "▼"}</span>
            </button>
            {eligOpen && (
              <div className="mt-3 space-y-4">
                <div>
                  <Legend>{t(locale, "iAmA")}</Legend>
                  <ChipWrap>
                    {PERSONA_OPTIONS.map((o) => (
                      <Chip
                        key={o.value}
                        on={state.personas.includes(o.value)}
                        onClick={() => set({ personas: toggle(state.personas, o.value) })}
                      >
                        {label(o.en, o.hi)}
                      </Chip>
                    ))}
                  </ChipWrap>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Box label={t(locale, "age")}>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={state.age}
                      onChange={(e) => set({ age: e.target.value })}
                      placeholder="22"
                      className="w-full rounded-md border border-line px-2.5 py-2 text-sm text-ink placeholder:text-muted focus:border-brand"
                    />
                  </Box>
                  <Box label={t(locale, "gender")}>
                    <select
                      value={state.gender}
                      onChange={(e) => set({ gender: e.target.value as Gender })}
                      className="w-full rounded-md border border-line bg-surface px-2 py-2 text-sm text-ink focus:border-brand"
                    >
                      <option value="">{t(locale, "any")}</option>
                      {GENDER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {label(o.en, o.hi)}
                        </option>
                      ))}
                    </select>
                  </Box>
                </div>
                <Box label={t(locale, "education")}>
                  <select
                    value={state.education}
                    onChange={(e) =>
                      set({ education: e.target.value as EducationLevel | "" })
                    }
                    className="w-full rounded-md border border-line bg-surface px-2 py-2 text-sm text-ink focus:border-brand"
                  >
                    <option value="">{t(locale, "any")}</option>
                    {EDUCATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {label(o.en, o.hi)}
                      </option>
                    ))}
                  </select>
                </Box>
                <div>
                  <Legend>{t(locale, "socialCategory")}</Legend>
                  <ChipWrap>
                    {SOCIAL_CATEGORY_OPTIONS.map((o) => (
                      <Chip
                        key={o.value}
                        on={state.social.includes(o.value)}
                        onClick={() => set({ social: toggle(state.social, o.value) })}
                      >
                        {label(o.en, o.hi)}
                      </Chip>
                    ))}
                  </ChipWrap>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ── Results ── */}
        <div className="mt-6 min-w-0 flex-1 lg:mt-0">
          {error ? (
            <Panel tone="error">{error}</Panel>
          ) : display.length === 0 ? (
            <Panel>{anyFilter ? t(locale, "noResults") : t(locale, "noSchemes")}</Panel>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                <p className="text-sm text-muted">
                  <span className="font-medium text-ink">{display.length}</span>{" "}
                  {display.length === 1
                    ? t(locale, "resultsOne")
                    : t(locale, "resultsMany")}
                  {hasEligibility(state) ? ` ${t(locale, "matchingProfile")}` : ""}
                  {loading && (
                    <span className="ml-2 text-xs">{t(locale, "searching")}</span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <div className="inline-flex overflow-hidden rounded-md border border-line text-xs">
                    {(["cards", "table"] as const).map((v) => {
                      const on = resultView === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setResultView(v)}
                          className={
                            on
                              ? "bg-brand px-2.5 py-1 font-medium text-white"
                              : "bg-surface px-2.5 py-1 text-ink hover:bg-paper"
                          }
                        >
                          {t(locale, v === "cards" ? "viewCards" : "viewTable")}
                        </button>
                      );
                    })}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    {t(locale, "sortBy")}
                    <select
                      value={state.sort}
                      onChange={(e) => set({ sort: e.target.value as SortKey })}
                      className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-brand"
                    >
                      <option value="relevance">{t(locale, "sortRelevance")}</option>
                      <option value="name">{t(locale, "sortName")}</option>
                      <option value="status">{t(locale, "sortStatus")}</option>
                      <option value="verified">{t(locale, "sortVerified")}</option>
                    </select>
                  </label>
                </div>
              </div>

              {resultView === "table" ? (
                <SchemeTable rows={display} locale={locale} today={today} />
              ) : (
              <ul className="divide-y divide-line">
                {display.map((s) => {
                  const band = ageBand(s.min_age, s.max_age);
                  const name = pick(locale, s.name_en, s.name_hi);
                  const sub =
                    locale === "hi"
                      ? s.name_en && s.name_hi
                        ? s.name_en
                        : null
                      : s.name_hi;
                  const dept = pick(locale, s.department_en, s.department_hi);
                  const objUnverified = isUnverified(s.objective_en);
                  const blurb = objUnverified
                    ? null
                    : pick(locale, s.objective_en, s.objective_hi);
                  return (
                    <li key={s.id}>
                      <Link href={`/schemes/${s.id}`} className="block py-4 hover:bg-paper">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-ink">{name}</h3>
                            {sub && <p className="text-sm text-muted">{sub}</p>}
                          </div>
                          <StatusBadge status={s.status} locale={locale} size="sm" />
                        </div>
                        {blurb && (
                          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{blurb}</p>
                        )}
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted">
                          {s.categories.map((c) => (
                            <Tag key={c}>
                              {label(
                                CATEGORY_OPTIONS.find((o) => o.value === c)?.en ?? c,
                                CATEGORY_OPTIONS.find((o) => o.value === c)?.hi ?? c
                              )}
                            </Tag>
                          ))}
                          {s.benefit_type && <Tag>{s.benefit_type}</Tag>}
                          {band && (
                            <span>
                              {t(locale, "age")} {band}
                            </span>
                          )}
                          {objUnverified && (
                            <span className="text-warn">{t(locale, "detailsUnverified")}</span>
                          )}
                        </div>
                        {(dept || s.last_verified) && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                            {dept && <span>{dept}</span>}
                            {dept && s.last_verified && <span>·</span>}
                            {s.last_verified && (
                              <span>
                                {t(locale, "verified")}{" "}
                                {ago(s.last_verified, today, locale) ?? fmtDate(s.last_verified)}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={
        on
          ? "rounded-md border border-brand bg-brand px-2.5 py-1 text-sm font-medium text-white"
          : "rounded-md border border-line bg-surface px-2.5 py-1 text-sm text-ink hover:border-ink"
      }
    >
      {children}
    </button>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-line accent-brand"
      />
      {label}
    </label>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-line px-2 py-0.5 text-ink">{children}</span>
  );
}

/** Dense, scannable status table — the researcher's bird's-eye (endoflife.date-style).
 *  Reuses the already-filtered + sorted rows; sort is driven by the shared Sort control. */
function SchemeTable({
  rows,
  locale,
  today,
}: {
  rows: SchemeListItem[];
  locale: Locale;
  today: string;
}) {
  const cat = (c: string) =>
    locale === "hi"
      ? CATEGORY_OPTIONS.find((o) => o.value === c)?.hi ?? c
      : CATEGORY_OPTIONS.find((o) => o.value === c)?.en ?? c;
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">{t(locale, "colScheme")}</th>
            <th className="px-3 py-2 font-medium">{t(locale, "sector")}</th>
            <th className="px-3 py-2 font-medium">{t(locale, "status")}</th>
            <th className="px-3 py-2 font-medium">{t(locale, "colBudget")}</th>
            <th className="px-3 py-2 font-medium">{t(locale, "verified")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((s) => {
            const a = ago(s.last_verified, today, locale);
            const stale = isStale(s.last_verified, today);
            return (
              <tr key={s.id} className="hover:bg-paper">
                <td className="px-3 py-2.5 align-top">
                  <Link
                    href={`/schemes/${s.id}`}
                    className="font-medium text-ink hover:underline"
                  >
                    {pick(locale, s.name_en, s.name_hi)}
                  </Link>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div className="flex flex-wrap gap-1">
                    {s.categories.map((c) => (
                      <span
                        key={c}
                        className="rounded border border-line px-1.5 py-0.5 text-xs text-muted"
                      >
                        {cat(c)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 align-top">
                  <StatusBadge status={s.status} locale={locale} size="sm" />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 align-top text-muted">
                  {s.last_budget_year ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 align-top text-muted">
                  {a ?? "—"}
                  {stale && (
                    <span className="ml-1 text-warn">· {t(locale, "needsReverification")}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
