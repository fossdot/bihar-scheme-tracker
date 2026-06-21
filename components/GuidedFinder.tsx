"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import {
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  PERSONA_OPTIONS,
  SOCIAL_CATEGORY_OPTIONS,
} from "@/lib/facets";
import { pick, t, type Locale } from "@/lib/i18n";
import type { SchemeListItem } from "@/lib/types";

// Income bands → a representative annual ₹ figure used for eligibility matching
// (a scheme admits the citizen if its income ceiling is null or ≥ this).
const INCOME_BANDS: { value: number; en: string; hi: string }[] = [
  { value: 50000, en: "Below ₹1 lakh", hi: "₹1 लाख से कम" },
  { value: 175000, en: "₹1–2.5 lakh", hi: "₹1–2.5 लाख" },
  { value: 400000, en: "₹2.5–6 lakh", hi: "₹2.5–6 लाख" },
  { value: 700000, en: "Above ₹6 lakh", hi: "₹6 लाख से अधिक" },
];

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-brand bg-brand text-white"
          : "border-line bg-surface text-ink hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Question({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  // fieldset + legend so each question is announced as a labelled group to screen readers.
  return (
    <fieldset className="m-0 min-w-0 border-0 border-t border-line p-0 py-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 p-0">
        <span className="text-base font-semibold text-ink">{label}</span>
        {hint && <span className="ml-2 text-sm text-muted">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

export function GuidedFinder({ locale }: { locale: Locale }) {
  const [personas, setPersonas] = useState<string[]>([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [social, setSocial] = useState("");
  const [education, setEducation] = useState("");
  const [income, setIncome] = useState<number | null>(null);
  const [disability, setDisability] = useState<"" | "yes" | "no">("");
  const [results, setResults] = useState<SchemeListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0); // guards against a slow earlier search overwriting a newer one

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const single = (cur: string, v: string, set: (x: string) => void) => set(cur === v ? "" : v);

  async function submit() {
    setLoading(true);
    const params = new URLSearchParams();
    if (personas.length) params.set("persona", personas.join(","));
    if (age) params.set("age", age);
    if (gender) params.set("gender", gender);
    if (social) params.set("social", social);
    if (education) params.set("education", education);
    if (income != null) params.set("income", String(income));
    if (disability === "no") params.set("disabled", "false");
    if (disability === "yes") params.set("disabled", "true");
    params.set("surface", "guided"); // tag for the search log (analytics)
    const myId = ++reqId.current;
    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = (await res.json()) as { results?: unknown };
      if (myId !== reqId.current) return; // a newer search superseded this one
      setResults(Array.isArray(data.results) ? (data.results as SchemeListItem[]) : []);
    } catch {
      if (myId === reqId.current) setResults([]);
    } finally {
      if (myId === reqId.current) {
        setLoading(false);
        requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    }
  }

  function reset() {
    setPersonas([]); setAge(""); setGender(""); setSocial(""); setEducation("");
    setIncome(null); setDisability(""); setResults(null);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-line bg-surface p-5 sm:p-6">
        <Question label={t(locale, "qWho")} hint={t(locale, "selectAllApply")}>
          <div className="flex flex-wrap gap-2">
            {PERSONA_OPTIONS.map((o) => (
              <Chip key={o.value} label={locale === "hi" ? o.hi : o.en}
                selected={personas.includes(o.value)} onClick={() => toggle(personas, o.value, setPersonas)} />
            ))}
          </div>
        </Question>

        <Question label={t(locale, "qAge")} hint={t(locale, "optionalHint")}>
          <input
            type="number" inputMode="numeric" min={0} max={120} value={age}
            onChange={(e) => setAge(e.target.value)} placeholder={t(locale, "agePlaceholder")}
            aria-label={t(locale, "qAge")}
            className="w-32 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand"
          />
        </Question>

        <Question label={t(locale, "qGender")} hint={t(locale, "optionalHint")}>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((o) => (
              <Chip key={o.value} label={locale === "hi" ? o.hi : o.en}
                selected={gender === o.value} onClick={() => single(gender, o.value, setGender)} />
            ))}
          </div>
        </Question>

        <Question label={t(locale, "qSocial")} hint={t(locale, "optionalHint")}>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_CATEGORY_OPTIONS.map((o) => (
              <Chip key={o.value} label={locale === "hi" ? o.hi : o.en}
                selected={social === o.value} onClick={() => single(social, o.value, setSocial)} />
            ))}
          </div>
        </Question>

        <Question label={t(locale, "qEducation")} hint={t(locale, "optionalHint")}>
          <div className="flex flex-wrap gap-2">
            {EDUCATION_OPTIONS.map((o) => (
              <Chip key={o.value} label={locale === "hi" ? o.hi : o.en}
                selected={education === o.value} onClick={() => single(education, o.value, setEducation)} />
            ))}
          </div>
        </Question>

        <Question label={t(locale, "qIncome")} hint={t(locale, "optionalHint")}>
          <div className="flex flex-wrap gap-2">
            {INCOME_BANDS.map((b) => (
              <Chip key={b.value} label={locale === "hi" ? b.hi : b.en}
                selected={income === b.value} onClick={() => setIncome(income === b.value ? null : b.value)} />
            ))}
          </div>
        </Question>

        <Question label={t(locale, "qDisability")} hint={t(locale, "optionalHint")}>
          <div className="flex flex-wrap gap-2">
            <Chip label={t(locale, "yes")} selected={disability === "yes"} onClick={() => setDisability(disability === "yes" ? "" : "yes")} />
            <Chip label={t(locale, "no")} selected={disability === "no"} onClick={() => setDisability(disability === "no" ? "" : "no")} />
          </div>
        </Question>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button" onClick={submit} disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <Icon name="search" className="h-4 w-4" />
          {loading ? t(locale, "searching") : t(locale, "showMySchemes")}
        </button>
        {results !== null && (
          <button type="button" onClick={reset} className="text-sm font-medium text-muted hover:text-ink">
            {t(locale, "clearAnswers")}
          </button>
        )}
      </div>

      {/* Results */}
      <div ref={resultsRef} aria-live="polite">
        {results !== null && (
          <div className="space-y-4">
            <h2 className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-ink">{results.length}</span>
              <span className="text-ink">{t(locale, "schemesForYou")}</span>
            </h2>
            <p className="text-sm text-muted">{t(locale, "guidedNote")}</p>
            {results.length === 0 ? (
              <p className="rounded-md border border-line bg-paper p-4 text-sm text-ink">
                {t(locale, "noMatches")}
              </p>
            ) : (
              <ul className="space-y-3">
                {results.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/schemes/${s.id}`}
                      className="block rounded-md border border-line bg-surface p-4 hover:border-ink"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium text-ink">{pick(locale, s.name_en, s.name_hi)}</span>
                        <StatusBadge status={s.status} locale={locale} size="sm" />
                      </div>
                      {s.benefit_type && <div className="mt-1 text-sm text-muted">{s.benefit_type}</div>}
                      {pick(locale, s.objective_en, s.objective_hi) && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-ink">
                          {pick(locale, s.objective_en, s.objective_hi)}
                        </p>
                      )}
                      <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand">
                        {t(locale, "viewDetails")} →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
