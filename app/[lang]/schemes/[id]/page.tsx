import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Field } from "@/components/Field";
import { FeedbackLink } from "@/components/FeedbackLink";
import { SidebarList } from "@/components/SidebarList";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { Card, ConfigNotice, FactTile, Panel, Row } from "@/components/ui";
import {
  categoryLabel,
  educationLabel,
  genderLabel,
  personaLabel,
  socialLabel,
} from "@/lib/facets";
import { ago, fmtDate, isStale } from "@/lib/dates";
import { altLinks, localizedHref, pick, t, tryT, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { todayISO } from "@/lib/policy";
import { getSchemeDetail, isDbConfigured } from "@/lib/queries";
import { hostLabel, isUnverified, splitEvidence } from "@/lib/status";
import type {
  BudgetAllocation,
  DataProvenance,
  MetricDimension,
  Scheme,
  SchemeDetail,
  SchemeMetric,
} from "@/lib/types";

export const dynamic = "force-dynamic";

// Cached per request so generateMetadata + the page share one fetch (no double query).
const getDetail = cache((id: string) => getSchemeDetail(id));

export async function generateMetadata({ params }: { params: { lang: string; id: string } }): Promise<Metadata> {
  const locale = resolveLocale(params.lang);
  if (!isDbConfigured()) return {};
  try {
    const detail = await getDetail(params.id);
    if (!detail) return {};
    const name = pick(locale, detail.scheme.name_en, detail.scheme.name_hi);
    const raw =
      pick(locale, detail.scheme.objective_en, detail.scheme.objective_hi) ||
      detail.scheme.benefit_detail ||
      "";
    const description = raw.replace(/\s+/g, " ").trim().slice(0, 200) || undefined;
    return {
      title: name,
      description,
      alternates: altLinks(locale, `/schemes/${params.id}`),
      openGraph: {
        title: `${name} · Bihar Scheme Tracker`,
        description,
        type: "article",
        url: localizedHref(locale, `/schemes/${params.id}`),
        locale: locale === "hi" ? "hi_IN" : "en_IN",
        alternateLocale: locale === "hi" ? "en_IN" : "hi_IN",
      },
    };
  } catch {
    return {};
  }
}

export default async function SchemeDetailPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const locale = resolveLocale(params.lang);

  if (!isDbConfigured()) {
    return (
      <div className="space-y-4">
        <BackLink locale={locale} />
        <ConfigNotice />
      </div>
    );
  }

  let detail: SchemeDetail | null = null;
  let error: string | null = null;
  try {
    detail = await getDetail(params.id);
  } catch (e) {
    console.error("scheme detail load failed:", e); // log details server-side, never to the user
    error = t(locale, "loadError");
  }

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink locale={locale} />
        <Panel tone="error">{error}</Panel>
      </div>
    );
  }
  if (!detail) notFound();

  const { scheme, department, allocations, metrics, policies, successor, similar } = detail;
  const name = pick(locale, scheme.name_en, scheme.name_hi);
  const sub =
    locale === "hi"
      ? scheme.name_en && scheme.name_hi
        ? scheme.name_en
        : null
      : scheme.name_hi;
  const objective = pick(locale, scheme.objective_en, scheme.objective_hi);
  const elig = eligibilityFacts(scheme, locale);
  const today = todayISO();
  const budgetTicks = Array.from(
    new Set(
      metrics
        .filter(
          (m) =>
            (m.dimension === "budget" || m.dimension === "beneficiaries") &&
            m.fiscal_year &&
            m.value != null
        )
        .map((m) => m.fiscal_year as string)
    )
  )
    .sort()
    .map((fy) => ({ atISO: `${fy.slice(0, 4)}-04-01`, label: `FY${fy}` }));

  const aside =
    similar.length > 0 ? (
      <aside className="mt-6 space-y-6 lg:mt-0 lg:sticky lg:top-6">
        <SidebarList
          title={t(locale, "similarSchemes")}
          icon="check"
          items={similar.map((s) => ({
            id: s.id,
            href: localizedHref(locale, `/schemes/${s.id}`),
            name: pick(locale, s.name_en, s.name_hi),
            badge: <StatusBadge status={s.status} locale={locale} size="sm" />,
          }))}
        />
      </aside>
    ) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: pick(locale, scheme.name_en, scheme.name_hi),
    description:
      (pick(locale, scheme.objective_en, scheme.objective_hi) || scheme.benefit_detail || "").slice(0, 300) ||
      undefined,
    inLanguage: locale === "hi" ? "hi-IN" : "en-IN",
    serviceType: scheme.benefit_type || undefined,
    areaServed: { "@type": "AdministrativeArea", name: "Bihar, India" },
    provider: department ? { "@type": "GovernmentOrganization", name: department.name_en } : undefined,
    url: `https://yojana.bodhya.net${localizedHref(locale, `/schemes/${scheme.id}`)}`,
    ...(scheme.application_portal_url ? { serviceUrl: scheme.application_portal_url } : {}),
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackLink locale={locale} />
      <div
        className={
          aside
            ? "lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-8"
            : undefined
        }
      >
        <article className="min-w-0 space-y-6">
          {/* Hero */}
      <header className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          {scheme.categories.map((c) => (
            <span key={c} className="rounded border border-line px-2 py-0.5 text-ink">
              {categoryLabel(locale, c)}
            </span>
          ))}
          {department && (
            <span className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-ink">
              <Icon name="building" className="h-3.5 w-3.5 text-muted" />
              {pick(locale, department.name_en, department.name_hi)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{name}</h1>
            {sub && <p className="mt-0.5 text-muted">{sub}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <StatusBadge status={scheme.status} locale={locale} />
            {scheme.application_portal_url && (
              <a
                href={scheme.application_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark sm:w-auto sm:justify-start"
              >
                <Icon name="external" className="h-4 w-4" />
                {t(locale, "applyCta")}
                <span className="sr-only"> {t(locale, "opensNewTab")}</span>
              </a>
            )}
          </div>
        </div>

        {objective && !isUnverified(scheme.objective_en) && (
          <p className="max-w-3xl text-ink">{objective}</p>
        )}

        {policies.length > 0 && (
          <p className="text-sm text-muted">
            {t(locale, "partOf")}:{" "}
            {policies.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ", "}
                <Link
                  href={localizedHref(locale, `/policies/${p.id}`)}
                  className="font-medium text-brand hover:underline"
                >
                  {pick(locale, p.name_en, p.name_hi)}
                </Link>
              </span>
            ))}
          </p>
        )}
      </header>

      {/* Inactive scheme → point the citizen onward to its successor */}
      {successor && (
        <Panel>
          <span className="text-ink">{t(locale, "inactiveSuccessor")} </span>
          <Link
            href={localizedHref(locale, `/schemes/${successor.id}`)}
            className="font-medium text-brand underline underline-offset-2"
          >
            {pick(locale, successor.name_en, successor.name_hi)}
          </Link>
        </Panel>
      )}

      {/* Key facts — at a glance */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
        <FactTile icon="rupee" label={t(locale, "benefitType")} value={scheme.benefit_type ?? "—"} />
        <FactTile icon="user" label={t(locale, "forLabel")} value={elig.personas} />
        <FactTile icon="calendar" label={t(locale, "age")} value={elig.age} />
        <FactTile icon="cap" label={t(locale, "education")} value={elig.education} />
      </div>

      {/* Lifecycle timeline — launched → now, with confirmed budget-year ticks */}
      {scheme.launch_date && (
        <Card icon="calendar" title={t(locale, "timeline")}>
          <Timeline
            startISO={scheme.launch_date}
            endISO={null}
            today={today}
            active={scheme.status === "active" || scheme.status === "likely_active"}
            leftLabel={`${t(locale, "launched")} ${fmtDate(scheme.launch_date)}`}
            rightLabel={t(locale, "nowLabel")}
            ticks={budgetTicks}
          />
        </Card>
      )}

      {/* Who can apply — visual eligibility + full official text */}
      <Card icon="check" title={t(locale, "whoCanApply")}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Row icon="user" label={t(locale, "forLabel")} value={elig.personas} />
          <Row icon="calendar" label={t(locale, "age")} value={elig.age} />
          <Row icon="cap" label={t(locale, "education")} value={elig.education} />
          <Row icon="users" label={t(locale, "gender")} value={elig.gender} />
          <Row icon="users" label={t(locale, "socialCategory")} value={elig.social} />
          <Row icon="rupee" label={t(locale, "incomeLabel")} value={elig.income} />
          <Row icon="pin" label={t(locale, "domicileLabel")} value={elig.domicile} />
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <Field
            locale={locale}
            label={t(locale, "eligibility")}
            value={pick(locale, scheme.eligibility_en, scheme.eligibility_hi)}
          />
        </div>
      </Card>

      {/* Benefit & details */}
      <Card icon="info" title={t(locale, "details")}>
        <dl className="-mt-3">
          <Field locale={locale} label={t(locale, "benefitType")} value={scheme.benefit_type} />
          <Field locale={locale} label={t(locale, "benefitDetail")} value={scheme.benefit_detail} />
          <Field
            locale={locale}
            label={t(locale, "targetBeneficiary")}
            value={scheme.target_beneficiary}
          />
          <Field locale={locale} label={t(locale, "launchDate")} value={fmtDate(scheme.launch_date)} />
        </dl>
      </Card>

      {/* Status & evidence — the WHY behind the status (CLAUDE.md: no status without it). */}
      <StatusEvidence scheme={scheme} locale={locale} />

      {/* Data & impact — research-mode metrics with honest provenance. */}
      <DataImpact metrics={metrics} allocations={allocations} locale={locale} />

      {/* Sources — never drop the source link (CLAUDE.md). */}
      <Card icon="doc" title={t(locale, "sourcesTitle")}>
        <ul className="space-y-1.5 text-sm">
          <SourceLink label={t(locale, "primarySource")} url={scheme.source_url} />
          {scheme.application_portal_url && (
            <SourceLink
              label={t(locale, "applicationPortal")}
              url={scheme.application_portal_url}
            />
          )}
          {department?.website && (
            <SourceLink label={t(locale, "department")} url={department.website} />
          )}
        </ul>
        <div className="mt-3 border-t border-line pt-3">
          <FeedbackLink entity={scheme.name_en} label={t(locale, "reportIssue")} />
        </div>
      </Card>

      </article>
        {aside}
      </div>
    </div>
  );
}

// ── Eligibility values, resolved + localised (shared by the tiles and the Who-can-apply card) ──
function eligibilityFacts(scheme: Scheme, locale: Locale) {
  const yrs = t(locale, "yearsSuffix");
  const age =
    scheme.min_age != null && scheme.max_age != null
      ? `${scheme.min_age}–${scheme.max_age} ${yrs}`
      : scheme.min_age != null
        ? `${scheme.min_age}+ ${yrs}`
        : scheme.max_age != null
          ? `≤ ${scheme.max_age} ${yrs}`
          : t(locale, "anyAge");
  const personaParts = scheme.personas.map((p) => personaLabel(locale, p));
  if (scheme.is_for_disabled) personaParts.push(t(locale, "personsWithDisabilities"));
  return {
    personas: personaParts.length
      ? personaParts.join(", ")
      : t(locale, "anyoneNoOccupation"),
    age,
    education: scheme.education_levels.length
      ? `${scheme.education_levels.map((e) => educationLabel(locale, e)).join(", ")} (${t(locale, "orAbove")})`
      : t(locale, "any"),
    gender:
      scheme.gender_eligibility === "any"
        ? t(locale, "any")
        : genderLabel(locale, scheme.gender_eligibility),
    social: scheme.social_categories.length
      ? scheme.social_categories.map((s) => socialLabel(locale, s)).join(", ")
      : t(locale, "allCategories"),
    income: scheme.requires_bpl
      ? t(locale, "bplRequired")
      : scheme.income_ceiling != null
        ? `₹${scheme.income_ceiling.toLocaleString("en-IN")}`
        : t(locale, "noIncomeBar"),
    domicile:
      scheme.domicile === "bihar" ? t(locale, "biharResident") : t(locale, "any"),
  };
}

function StatusEvidence({ scheme, locale }: { scheme: Scheme; locale: Locale }) {
  const { prose, sources } = splitEvidence(scheme.status_evidence);
  const verifiedAgo = ago(scheme.last_verified, todayISO(), locale);
  const verifiedText = scheme.last_verified
    ? verifiedAgo
      ? `${fmtDate(scheme.last_verified)} · ${verifiedAgo}`
      : fmtDate(scheme.last_verified)
    : null;
  return (
    <Card
      icon="info"
      title={t(locale, "statusEvidence")}
      right={<StatusBadge status={scheme.status} locale={locale} size="sm" />}
    >
      <p className="whitespace-pre-line text-sm text-ink">
        {prose || t(locale, "noEvidence")}
      </p>
      {sources.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-muted">{t(locale, "sourcesTitle")}:</span>
          {sources.map((u) => (
            <SourceChip key={u} url={u} />
          ))}
        </div>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3 text-xs sm:grid-cols-3">
        <Meta label={t(locale, "lastBudgetYear")} value={scheme.last_budget_year} />
        <Meta label={t(locale, "lastNotification")} value={fmtDate(scheme.last_notification_date)} />
        <Meta label={t(locale, "lastVerified")} value={verifiedText} />
      </dl>
      {isStale(scheme.last_verified, todayISO()) && (
        <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-warn">
          <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
          {t(locale, "mayBeOutdated")}
        </p>
      )}
    </Card>
  );
}

// ── Research mode: financial + beneficiary series with honest, per-dimension provenance ──
const DIMENSIONS: MetricDimension[] = [
  "budget",
  "beneficiaries",
  "district",
  "demographics",
  "outcomes",
];
const DIM_ICON: Record<MetricDimension, string> = {
  budget: "rupee",
  beneficiaries: "users",
  district: "pin",
  demographics: "users",
  outcomes: "check",
};

// Which dimensions are PUBLIC (budget docs / portals — no RTI) vs RTI-gated, plus a fallback
// note when a scheme has no data yet for that dimension. Budget is NEVER "RTI needed".
const DIM_PUBLIC = new Set<MetricDimension>(["budget", "beneficiaries"]);
const DIM_NOTE: Record<MetricDimension, { en: string; hi: string }> = {
  budget: { en: "From budget.bihar.gov.in (public — to extract)", hi: "budget.bihar.gov.in से (सार्वजनिक — निकालना है)" },
  beneficiaries: { en: "From department reports / portal", hi: "विभागीय रिपोर्ट / पोर्टल से" },
  district: { en: "District-wise — needs an RTI", hi: "ज़िलेवार — RTI आवश्यक" },
  demographics: { en: "Category / gender — needs an RTI", hi: "श्रेणी / लिंग — RTI आवश्यक" },
  outcomes: { en: "Completion / outcomes — needs an RTI", hi: "पूर्णता / परिणाम — RTI आवश्यक" },
};

function provClass(p: string): string {
  if (p === "published" || p === "rti_received") return "text-brand ring-brand/40";
  if (p === "reported" || p === "rti_filed") return "text-warn ring-warn/40";
  return "text-muted ring-line"; // rti_needed, public_todo, estimated
}

function DataImpact({
  metrics,
  allocations,
  locale,
}: {
  metrics: SchemeMetric[];
  allocations: BudgetAllocation[];
  locale: Locale;
}) {
  const num = (v: number) => v.toLocaleString("en-IN");
  const byDim = (d: MetricDimension) => metrics.filter((m) => m.dimension === d);
  const valueRows = (d: MetricDimension) =>
    byDim(d).filter((m) => m.fiscal_year && m.value != null);

  const budgetVals = valueRows("budget");
  const benVals = valueRows("beneficiaries");
  const years = Array.from(
    new Set([...budgetVals, ...benVals].map((m) => m.fiscal_year as string))
  ).sort();
  const maxBudget = Math.max(0, ...budgetVals.map((m) => Number(m.value)));
  const maxBen = Math.max(0, ...benVals.map((m) => Number(m.value)));
  const valueSources = Array.from(
    new Set([...budgetVals, ...benVals].map((m) => m.source_url).filter(Boolean))
  ) as string[];
  const lbl = (label: string | null) =>
    label ? tryT(locale, `lbl_${label}`, label) : "";

  return (
    <Card icon="chart" title={t(locale, "dataImpact")}>
      <p className="-mt-1 text-sm text-muted">{t(locale, "dataImpactNote")}</p>

      {years.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-md border border-line">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">{t(locale, "fiscalYear")}</th>
                <th scope="col" className="px-3 py-2 font-medium">{t(locale, "funds")}</th>
                <th scope="col" className="px-3 py-2 font-medium">{t(locale, "people")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {years.map((y) => {
                const b = budgetVals.find((m) => m.fiscal_year === y);
                const p = benVals.find((m) => m.fiscal_year === y);
                return (
                  <tr key={y}>
                    <td className="whitespace-nowrap px-3 py-3 align-top font-medium text-ink">
                      {y}
                    </td>
                    <td className="px-3 py-3">
                      {b ? (
                        <BarCell value={Number(b.value)} max={maxBudget} text={`₹${num(Number(b.value))} cr`} sub={lbl(b.label)} />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {p ? (
                        <BarCell value={Number(p.value)} max={maxBen} text={num(Number(p.value))} sub={lbl(p.label)} />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {valueSources.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-muted">{t(locale, "sourcesTitle")}:</span>
          {valueSources.map((u) => (
            <SourceChip key={u} url={u} />
          ))}
        </p>
      )}

      {/* Provenance — where each dimension comes from, or that an RTI is needed. */}
      <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">
        {t(locale, "provenanceTitle")}
      </h3>
      <div className="mt-2 divide-y divide-line rounded-md border border-line">
        {DIMENSIONS.map((dim) => {
          const rows = byDim(dim);
          const valued = rows.find((r) => r.value != null);
          const statusRow = rows.find((r) => r.fiscal_year === null) ?? rows[0];
          // Budget/beneficiaries are PUBLIC: when absent they're "to add", never "RTI needed".
          const key = valued
            ? valued.provenance
            : statusRow
              ? statusRow.provenance
              : DIM_PUBLIC.has(dim)
                ? "public_todo"
                : "rti_needed";
          const note =
            rows.find((r) => r.note)?.note ??
            (locale === "hi" ? DIM_NOTE[dim].hi : DIM_NOTE[dim].en);
          const src = rows.find((r) => r.source_url)?.source_url ?? null;
          return (
            <div key={dim} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
              <div className="flex min-w-0 items-start gap-2.5">
                <Icon name={DIM_ICON[dim]} className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <div className="text-ink">{tryT(locale, `dim_${dim}`, dim)}</div>
                  {note && <div className="mt-0.5 text-xs text-muted">{note}</div>}
                  {src && (
                    <div className="mt-1">
                      <SourceChip url={src} />
                    </div>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${provClass(key)}`}
              >
                {tryT(locale, `prov_${key}`, key)}
              </span>
            </div>
          );
        })}
      </div>

      {allocations.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-md border border-line">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-paper text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">{t(locale, "fiscalYear")}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">{t(locale, "allocatedBE")}</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">{t(locale, "revisedRE")}</th>
                <th scope="col" className="px-3 py-2 font-medium">{t(locale, "source")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {allocations.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2 font-medium text-ink">{a.fiscal_year}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink">{a.allocated_cr ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink">{a.revised_cr ?? "—"}</td>
                  <td className="px-3 py-2">
                    <SourceChip url={a.source_url} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function BarCell({
  value,
  max,
  text,
  sub,
}: {
  value: number;
  max: number;
  text: string;
  sub: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="min-w-[7rem]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium tabular-nums text-ink">{text}</span>
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-paper">
        <div className="h-full rounded bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value ?? "—"}</dd>
    </div>
  );
}

function BackLink({ locale }: { locale: Locale }) {
  return (
    <Link href={localizedHref(locale, "/search")} className="text-sm font-medium text-brand hover:underline">
      {t(locale, "backToExplore")}
    </Link>
  );
}

function SourceChip({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-medium text-brand underline underline-offset-2"
    >
      {hostLabel(url)} ↗
    </a>
  );
}

function SourceLink({ label, url }: { label: string; url: string }) {
  return (
    <li className="flex flex-wrap items-baseline gap-2">
      <span className="text-muted">{label}:</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all font-medium text-brand underline underline-offset-2"
      >
        {url} ↗
      </a>
    </li>
  );
}
