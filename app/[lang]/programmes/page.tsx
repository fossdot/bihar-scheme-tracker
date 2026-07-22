import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Card, ConfigNotice, Panel } from "@/components/ui";
import { GuessVerified } from "@/components/GuessFirst";
import { ProgrammeExplorer } from "@/components/ProgrammeExplorer";
import { RupeeWaterfall } from "@/components/RupeeWaterfall";
import { TangibleConverter } from "@/components/TangibleConverter";
import { PROG_SECTIONS, type Bilingual } from "@/lib/education-home";
import { altLinks, pick, t, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { isDbConfigured } from "@/lib/queries";
import { hostLabel } from "@/lib/status";
import { getEducationOverview } from "@/lib/education";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  return {
    title: t(locale, "eduTitle"),
    description: t(locale, "eduSubtitle"),
    alternates: altLinks(locale, "/programmes"),
  };
}

// ₹ crore: large sums lose nothing to rounding; small ones (skilling) keep two decimals.
function fmtCr(v: number): string {
  return v >= 100 ? Math.round(v).toLocaleString("en-IN") : v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default async function ProgrammesPage({ params }: { params: { lang: string } }) {
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
  // Findings not tied to a single programme (e.g. the SNA fund-flow, which spans all schemes).
  const otherAudits = audits.filter((a) => !a.programme_en);

  return (
    <div className="space-y-6">
      <PageHeader locale={locale} />

      {/* Summary strip — DB-derived, honest aggregates. */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line">
        <Stat label={t(locale, "eduStatProgrammes")} value={String(stats.programmes)} />
        <Stat label={`${t(locale, "eduStatFlagged")} (₹ cr)`} value={fmtCr(stats.flaggedCr)} tone="warn" />
        <Stat label={t(locale, "eduStatRti")} value={String(stats.rtiPending)} />
      </div>

      {/* The narrative arc: guess → follow the rupee → make it tangible → explore & compare. */}
      <SectionHead s={PROG_SECTIONS.guess} locale={locale} />
      <GuessVerified locale={locale} />

      <SectionHead s={PROG_SECTIONS.follow} locale={locale} />
      <RupeeWaterfall locale={locale} />

      <SectionHead s={PROG_SECTIONS.feel} locale={locale} />
      <TangibleConverter locale={locale} />

      <SectionHead s={PROG_SECTIONS.explore} locale={locale} />
      <ProgrammeExplorer programmes={programmes} audits={audits} locale={locale} />

      {/* System-wide audit findings (not tied to one programme). */}
      {otherAudits.length > 0 && (
        <Card icon="info" title={t(locale, "progOtherFindings")}>
          <ul className="space-y-4">
            {otherAudits.map((a, i) => (
              <li key={i} className="border-l-2 border-danger/60 pl-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{a.report_ref ?? "—"}</span>
                  {a.amount_flagged_cr != null && (
                    <span className="text-sm font-semibold tabular-nums text-warn">
                      ₹{fmtCr(a.amount_flagged_cr)} cr {t(locale, "eduAuditFlagged")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{pick(locale, a.finding_en, a.finding_hi)}</p>
                {a.source_url && (
                  <a
                    href={a.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-strong underline underline-offset-2"
                  >
                    {hostLabel(a.source_url)} ↗
                  </a>
                )}
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

function SectionHead({
  s,
  locale,
}: {
  s: { eyebrow: Bilingual; title: Bilingual; lede?: Bilingual };
  locale: Locale;
}) {
  return (
    <header className="pt-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-strong">{pick(locale, s.eyebrow.en, s.eyebrow.hi)}</div>
      <h2 className="mt-1.5 max-w-[26ch] text-balance text-xl font-bold leading-tight tracking-tight text-ink sm:text-2xl">
        {pick(locale, s.title.en, s.title.hi)}
      </h2>
      {s.lede && <p className="mt-2 max-w-3xl text-sm text-muted">{pick(locale, s.lede.en, s.lede.hi)}</p>}
    </header>
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
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "warn" ? "text-warn" : "text-ink"}`}>{value}</div>
    </div>
  );
}
