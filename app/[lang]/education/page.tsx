import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Card, ConfigNotice, Panel } from "@/components/ui";
import { altLinks, localizedHref, pick, t, tryT, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { isDbConfigured } from "@/lib/queries";
import { hostLabel } from "@/lib/status";
import { getEducationOverview, headline, type EduProgramme } from "@/lib/education";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: t(locale, "eduTitle"),
    description: t(locale, "eduSubtitle"),
    alternates: altLinks(locale, "/education"),
  };
}

// ₹ crore: large sums lose nothing to rounding; small ones (skilling) keep two decimals.
function fmtCr(v: number): string {
  return v >= 100
    ? Math.round(v).toLocaleString("en-IN")
    : v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fundingLabel(p: EduProgramme): string {
  switch (p.funding_source) {
    case "centrally_sponsored":
      return p.centre_share_pct != null && p.state_share_pct != null
        ? `CSS ${p.centre_share_pct}:${p.state_share_pct}`
        : "CSS";
    case "central_sector":
      return "Central";
    case "state_scheme":
      return "State";
    case "externally_aided":
      return "Externally aided";
    default:
      return "Mixed";
  }
}

function provClass(p: string | null | undefined): string {
  if (p === "published" || p === "rti_received") return "text-brand-strong ring-brand/40";
  if (p === "reported" || p === "rti_filed") return "text-warn ring-warn/40";
  return "text-muted ring-line"; // rti_needed / estimated / none
}

function ProvChip({ p, locale }: { p: string | null | undefined; locale: Locale }) {
  if (!p) return null;
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${provClass(p)}`}>
      {tryT(locale, `prov_${p}`, p)}
    </span>
  );
}

function SourceChip({ url }: { url: string | null | undefined }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-brand-strong underline underline-offset-2"
    >
      {hostLabel(url)} ↗
    </a>
  );
}

export default async function EducationPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang);

  if (!isDbConfigured()) {
    return (
      <div className="space-y-6">
        <PageHeader locale={locale} />
        <ConfigNotice />
      </div>
    );
  }

  let data: Awaited<ReturnType<typeof getEducationOverview>> | null = null;
  try {
    data = await getEducationOverview();
  } catch (e) {
    console.error("education overview load failed:", e);
    return (
      <div className="space-y-6">
        <PageHeader locale={locale} />
        <Panel tone="error">{t(locale, "loadError")}</Panel>
      </div>
    );
  }

  const { programmes, audits, stats } = data;

  return (
    <div className="space-y-6">
      <PageHeader locale={locale} />

      {/* Summary strip — DB-derived, honest aggregates. */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
        <Stat label={t(locale, "eduStatProgrammes")} value={String(stats.programmes)} />
        <Stat label={`${t(locale, "eduStatFlagged")} (₹ cr)`} value={fmtCr(stats.flaggedCr)} tone="warn" />
        <Stat label={t(locale, "eduStatRti")} value={String(stats.rtiPending)} />
      </div>

      {/* Programme by programme — allocated vs spent. */}
      <Card icon="rupee" title={t(locale, "eduProgrammes")}>
        <div className="space-y-6">
          {programmes.map((p) => (
            <ProgrammeRow key={p.id} p={p} locale={locale} />
          ))}
        </div>
      </Card>

      {/* Audit findings. */}
      {audits.length > 0 && (
        <Card icon="info" title={t(locale, "eduAuditTitle")}>
          <ul className="space-y-4">
            {audits.map((a, i) => (
              <li key={i} className="border-l-2 border-danger/60 pl-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    {a.programme_en ?? a.report_ref ?? "—"}
                  </span>
                  {a.amount_flagged_cr != null && (
                    <span className="text-sm font-semibold tabular-nums text-warn">
                      ₹{fmtCr(a.amount_flagged_cr)} cr {t(locale, "eduAuditFlagged")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{pick(locale, a.finding_en, a.finding_hi)}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {a.report_ref && <span className="text-xs text-muted">{a.report_ref}</span>}
                  <ProvChip p={a.provenance} locale={locale} />
                  <SourceChip url={a.source_url} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="flex items-start gap-2 rounded-md border border-line bg-paper p-4 text-sm text-muted">
        <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
        {t(locale, "eduSourceNote")}
      </p>
    </div>
  );
}

function PageHeader({ locale }: { locale: Locale }) {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{t(locale, "eduTitle")}</h1>
      <p className="max-w-3xl text-muted">{t(locale, "eduSubtitle")}</p>
    </header>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "warn" ? "text-warn" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function ProgrammeRow({ p, locale }: { p: EduProgramme; locale: Locale }) {
  const h = headline(p.allocations);
  const name = pick(locale, p.name_en, p.name_hi);
  const note = pick(locale, h?.note_en ?? p.note_en, h?.note_hi ?? p.note_hi);
  const hasPct = h && h.pct != null && h.amount != null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">{name}</span>
          <span className="rounded bg-paper px-1.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-line">
            {fundingLabel(p)}
          </span>
        </div>
        {h?.amount != null && (
          <div className="text-sm text-muted">
            {h.used != null ? (
              <>
                <span className="font-semibold text-ink tabular-nums">₹{fmtCr(h.used)} cr</span>{" "}
                {t(locale, "eduSpentOf")}{" "}
                <span className="tabular-nums">₹{fmtCr(h.amount)} cr</span>
              </>
            ) : (
              <span className="tabular-nums">₹{fmtCr(h.amount)} cr</span>
            )}
          </div>
        )}
      </div>

      {/* Bar: green fill = spent share; or an honest "RTI needed" strip when spend is unpublished. */}
      <div className="mt-2">
        {hasPct ? (
          <div className="flex items-center gap-3">
            <div className="relative h-7 flex-1 overflow-hidden rounded border border-line bg-paper">
              <div className="h-full bg-brand" style={{ width: `${Math.min(100, Math.max(2, h!.pct!))}%` }} />
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
              {h!.pct}% <span className="font-normal text-muted">{t(locale, "eduPctSpent")}</span>
            </span>
            <ProvChip p={h!.usedProv} locale={locale} />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded border border-dashed border-line bg-paper px-3 py-2 text-xs text-muted">
            <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
            {t(locale, "eduSpendRtiNeeded")}
          </div>
        )}
      </div>

      {/* Nodal agency + note + sources */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {p.nodal_abbrev && (
          <span>
            {t(locale, "eduNodal")}: <span className="text-ink">{p.nodal_abbrev}</span>
          </span>
        )}
        <ProvChip p={h?.amountProv} locale={locale} />
        <SourceChip url={h?.amountSrc ?? p.source_url} />
      </div>
      {note && <p className="mt-1.5 text-xs text-muted">{note}</p>}
    </div>
  );
}
