import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { FeedbackLink } from "@/components/FeedbackLink";
import { PolicyBadge } from "@/components/PolicyBadge";
import { SidebarList } from "@/components/SidebarList";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { Card, ConfigNotice, FactTile, Panel, Row } from "@/components/ui";
import { deadlineLabel, fmtDate, validityLabel } from "@/lib/dates";
import { categoryLabel } from "@/lib/facets";
import { pick, t, tryT, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { policyStatusKey, todayISO } from "@/lib/policy";
import { getPolicyDetail, isDbConfigured } from "@/lib/queries";
import { hostLabel } from "@/lib/status";
import type { PolicyDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PolicyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const locale = getLocale();
  const today = todayISO();

  if (!isDbConfigured()) {
    return (
      <div className="space-y-4">
        <BackLink locale={locale} />
        <ConfigNotice />
      </div>
    );
  }

  let detail: PolicyDetail | null = null;
  let error: string | null = null;
  try {
    detail = await getPolicyDetail(params.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load policy.";
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

  const { policy, department, successor, schemes, related } = detail;
  const name = pick(locale, policy.name_en, policy.name_hi);
  const sub =
    locale === "hi"
      ? policy.name_en && policy.name_hi
        ? policy.name_en
        : null
      : policy.name_hi;
  const summary = pick(locale, policy.summary_en, policy.summary_hi);
  const statusKey = policyStatusKey(policy, today);
  const rel =
    statusKey === "open"
      ? deadlineLabel(policy.consultation_end, today, locale)?.text
      : statusKey === "in_force" || statusKey === "lapsed"
        ? validityLabel(policy.period_end, today, locale)?.text
        : null;
  const dept = department
    ? pick(locale, department.name_en, department.name_hi)
    : "—";
  const validity =
    policy.period_start && policy.period_end
      ? `${fmtDate(policy.period_start)} → ${fmtDate(policy.period_end)}`
      : policy.period_start
        ? `${fmtDate(policy.period_start)} →`
        : "—";

  // Primary action: comment (open drafts) or read the document.
  const primary =
    statusKey === "open" && policy.consultation_url
      ? { href: policy.consultation_url, label: t(locale, "goToConsultation") }
      : policy.document_url
        ? {
            href: policy.document_url,
            label: t(locale, policy.is_draft ? "readDraft" : "readDocument"),
          }
        : null;

  const aside =
    schemes.length > 0 || related.length > 0 ? (
      <aside className="mt-6 space-y-6 lg:mt-0 lg:sticky lg:top-6">
        <SidebarList
          title={`${t(locale, "schemesUnder")} · ${schemes.length}`}
          icon="check"
          items={schemes.map((s) => ({
            id: s.id,
            href: `/schemes/${s.id}`,
            name: pick(locale, s.name_en, s.name_hi),
            badge: <StatusBadge status={s.status} locale={locale} size="sm" />,
          }))}
        />
        <SidebarList
          title={t(locale, "relatedPolicies")}
          icon="doc"
          items={related.map((p) => ({
            id: p.id,
            href: `/policies/${p.id}`,
            name: pick(locale, p.name_en, p.name_hi),
            badge: <PolicyBadge policy={p} today={today} locale={locale} size="sm" />,
          }))}
        />
      </aside>
    ) : null;

  return (
    <div className="space-y-6">
      <BackLink locale={locale} />
      <div
        className={
          aside
            ? "lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-8"
            : undefined
        }
      >
        <article className="min-w-0 space-y-6">
          <header className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          {policy.categories.map((c) => (
            <span key={c} className="rounded border border-line px-2 py-0.5 text-ink">
              {categoryLabel(locale, c)}
            </span>
          ))}
          {department && (
            <span className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-ink">
              <Icon name="building" className="h-3.5 w-3.5 text-muted" />
              {dept}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{name}</h1>
            {sub && <p className="mt-0.5 text-muted">{sub}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <PolicyBadge policy={policy} today={today} locale={locale} />
            {rel && <span className="text-xs text-muted">{rel}</span>}
            {primary && (
              <a
                href={primary.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark sm:w-auto sm:justify-start"
              >
                <Icon name="external" className="h-4 w-4" />
                {primary.label}
              </a>
            )}
          </div>
        </div>

        {summary && <p className="max-w-3xl text-ink">{summary}</p>}
      </header>

      {/* Key facts */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
        <FactTile
          icon="doc"
          label={t(locale, "policyTypeLabel")}
          value={policy.policy_type ? tryT(locale, `pt_${policy.policy_type}`, policy.policy_type) : "—"}
        />
        <FactTile icon="calendar" label={t(locale, "validity")} value={validity} />
        <FactTile icon="building" label={t(locale, "department")} value={dept} />
        <FactTile icon="check" label={t(locale, "lastVerified")} value={fmtDate(policy.last_verified) ?? "—"} />
      </div>

      {/* Lifecycle timeline — validity window with a "now" marker */}
      {policy.period_start && (
        <Card icon="calendar" title={t(locale, "timeline")}>
          <Timeline
            startISO={policy.period_start}
            endISO={policy.period_end}
            today={today}
            active={statusKey === "in_force"}
            leftLabel={fmtDate(policy.period_start)!}
            rightLabel={
              fmtDate(policy.period_end) ??
              (statusKey === "superseded"
                ? t(locale, "supersededLabel")
                : t(locale, "ongoing"))
            }
          />
        </Card>
      )}

      {/* Schemes under this policy + related policies → moved to the right sidebar for visibility */}

      {/* Public consultation — only for drafts */}
      {policy.is_draft && (
        <Card icon="info" title={t(locale, "consultation")}>
          <p className="text-sm text-ink">
            {statusKey === "open"
              ? t(locale, "consultationOpenNote")
              : t(locale, "consultationClosedNote")}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-4 border-t border-line pt-3 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-muted">{t(locale, "commentDeadline")}</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {fmtDate(policy.consultation_end) ?? t(locale, "deadlineVerify")}
              </dd>
            </div>
          </dl>

          {(policy.how_to_comment_en || policy.how_to_comment_hi) && (
            <div className="mt-4 border-t border-line pt-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                {t(locale, "howToCommentTitle")}
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-ink">
                {pick(locale, policy.how_to_comment_en, policy.how_to_comment_hi)}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {policy.consultation_url && (
              <a
                href={policy.consultation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand hover:text-white"
              >
                <Icon name="external" className="h-4 w-4" />
                {t(locale, "goToConsultation")}
              </a>
            )}
            {policy.document_url && (
              <a
                href={policy.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:border-ink"
              >
                <Icon name="doc" className="h-4 w-4 text-muted" />
                {t(locale, "readDraft")}
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Superseded → point onward */}
      {successor && (
        <Panel>
          <span className="text-ink">
            {locale === "hi" ? "इसे प्रतिस्थापित किया गया: " : "Superseded by: "}
          </span>
          <Link
            href={`/policies/${successor.id}`}
            className="font-medium text-brand underline underline-offset-2"
          >
            {pick(locale, successor.name_en, successor.name_hi)}
          </Link>
        </Panel>
      )}

      {/* Research mode — honest, not yet tracked */}
      <PolicyImpact locale={locale} />

      {/* Sources */}
      <Card icon="doc" title={t(locale, "sourcesTitle")}>
        <ul className="space-y-1.5 text-sm">
          <SourceLink label={t(locale, "primarySource")} url={policy.source_url} />
          {policy.document_url && policy.document_url !== policy.source_url && (
            <SourceLink
              label={t(locale, policy.is_draft ? "readDraft" : "readDocument")}
              url={policy.document_url}
            />
          )}
          {department?.website && (
            <SourceLink label={t(locale, "department")} url={department.website} />
          )}
        </ul>
        <div className="mt-3 border-t border-line pt-3">
          <FeedbackLink entity={policy.name_en} label={t(locale, "reportIssue")} />
        </div>
      </Card>

      </article>
        {aside}
      </div>
    </div>
  );
}

const PDIMS = ["pdim_investment", "pdim_jobs", "pdim_units", "pdim_outlay"] as const;

function PolicyImpact({ locale }: { locale: Locale }) {
  return (
    <Card icon="chart" title={t(locale, "dataImpact")}>
      <p className="-mt-1 text-sm text-muted">{t(locale, "policyImpactNote")}</p>
      <h3 className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
        {t(locale, "provenanceTitle")}
      </h3>
      <div className="mt-2 divide-y divide-line rounded-md border border-line">
        {PDIMS.map((d) => (
          <div key={d} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <span className="text-ink">{t(locale, d)}</span>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-inset ring-line">
              {t(locale, "prov_rti_needed")}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BackLink({ locale }: { locale: Locale }) {
  return (
    <Link href="/policies" className="text-sm font-medium text-brand hover:underline">
      {t(locale, "backToPolicies")}
    </Link>
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
        {hostLabel(url)} ↗
      </a>
    </li>
  );
}
