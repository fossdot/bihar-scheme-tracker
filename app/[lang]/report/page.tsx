import type { Metadata } from "next";
import { MoneyFlow } from "@/components/MoneyFlow";
import { PrintButton } from "@/components/PrintButton";
import {
  CAPACITY,
  COUNTERPOINT,
  FOUR_NUMBERS,
  HOME_SOURCES,
  OUTCOMES,
  SCENES,
  type ShockStat,
} from "@/lib/education-home";
import { altLinks, localizedHref, pick, t, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { getEducationOverview, headline, type EduProgramme } from "@/lib/education";
import { isDbConfigured } from "@/lib/queries";
import { hostLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  const title = locale === "hi" ? "जवाबदेही रिपोर्ट — बिहार का शिक्षा-धन" : "Accountability briefing — Bihar’s education money";
  const description =
    locale === "hi"
      ? "बिहार के शिक्षा-धन पर एक स्रोत-सहित रिपोर्ट: जारी, निकासी, सत्यापन; ड्रॉपआउट; अंकेक्षण निष्कर्ष — प्रिंट या PDF हेतु।"
      : "A one-document, fully-sourced briefing on Bihar’s education money: released vs spent, dropout, audit findings — ready to print or save as PDF.";
  return { title, description, alternates: altLinks(locale, "/report"), openGraph: { url: localizedHref(locale, "/report"), title, description } };
}

function fmtCr(v: number): string {
  return v >= 100 ? Math.round(v).toLocaleString("en-IN") : v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fundingLabel(p: EduProgramme): string {
  switch (p.funding_source) {
    case "centrally_sponsored":
      return p.centre_share_pct != null && p.state_share_pct != null ? `CSS ${p.centre_share_pct}:${p.state_share_pct}` : "CSS";
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

export default async function Report({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang);
  const p = (b: { en: string; hi: string }) => pick(locale, b.en, b.hi);
  const L = (en: string, hi: string) => (locale === "hi" ? hi : en);

  const overview = isDbConfigured() ? await getEducationOverview().catch(() => null) : null;
  const programmes = (overview?.programmes ?? [])
    .slice()
    .sort((a, b) => (headline(b.allocations)?.amount ?? 0) - (headline(a.allocations)?.amount ?? 0));
  const audits = overview?.audits ?? [];
  const compiled = new Date().toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", { year: "numeric", month: "long", day: "numeric" });

  return (
    <article className="report mx-auto max-w-3xl space-y-12">
      {/* Toolbar — screen only */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="text-xs uppercase tracking-wide text-muted">
          शिक्षा का पैसा · {t(locale, "reportBadge")}
        </div>
        <PrintButton label={t(locale, "reportPrint")} />
      </div>

      {/* SUMMARY — standalone first page in print */}
      <header className="report-hero report-section space-y-5">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-brand-strong">{p(SCENES.hero.eyebrow)}</div>
        <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">{p(SCENES.hero.h1)}</h1>
        <p className="max-w-2xl text-lg text-muted">{p(SCENES.hero.body)}</p>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
          {FOUR_NUMBERS.map((s, i) => (
            <StatTile key={i} stat={s} locale={locale} />
          ))}
        </div>

        <div className="rounded-md border border-line border-l-[3px] border-l-brand bg-surface p-4 text-sm text-ink">
          <span className="font-semibold">{p(SCENES.turn.shouldLabel)}:</span> {p(SCENES.turn.shouldBody)}
        </div>
        <p className="text-xs text-muted">{t(locale, "reportCompiled")} {compiled} · CAG SFAR 2023–24 · UDISE+ 2023–24 / 2024–25</p>
      </header>

      {/* MONEY FLOW */}
      <section className="report-section space-y-3">
        <SectionH n="1">{L("Where the money stops", "पैसा कहाँ रुकता है")}</SectionH>
        <MoneyFlow locale={locale} />
      </section>

      {/* OUTCOMES */}
      <section className="report-section space-y-3">
        <SectionH n="2">{p(SCENES.children.punch)}</SectionH>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">{L("Indicator", "संकेतक")}</th>
                <th className="py-2 px-3 text-right font-medium">{t(locale, "homeBihar")}</th>
                <th className="py-2 pl-3 text-right font-medium">{t(locale, "homeIndia")}</th>
              </tr>
            </thead>
            <tbody>
              {OUTCOMES.rows.map((r, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2 pr-3 text-ink">{p(r.name)}</td>
                  <td className="py-2 px-3 text-right font-semibold tabular-nums text-warn">{r.bihar}%</td>
                  <td className="py-2 pl-3 text-right tabular-nums text-muted">{r.india}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">{p(OUTCOMES.source)}</p>
      </section>

      {/* CAPACITY */}
      <section className="report-section space-y-3">
        <SectionH n="3">{p(SCENES.capacity.punch)}</SectionH>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
          {CAPACITY.map((s, i) => (
            <StatTile key={i} stat={s} locale={locale} />
          ))}
        </div>
      </section>

      {/* PROGRAMMES */}
      {programmes.length > 0 && (
        <section className="report-section space-y-3">
          <SectionH n="4">{t(locale, "homeMoveTitle")}</SectionH>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3 font-medium">{L("Programme", "कार्यक्रम")}</th>
                  <th className="py-2 px-3 font-medium">{L("Type", "प्रकार")}</th>
                  <th className="py-2 px-3 text-right font-medium">{L("Approved", "स्वीकृत")}</th>
                  <th className="py-2 px-3 text-right font-medium">{L("Spent", "व्यय")}</th>
                  <th className="py-2 pl-3 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map((prog) => {
                  const h = headline(prog.allocations);
                  return (
                    <tr key={prog.id} className="border-b border-line align-top">
                      <td className="py-2 pr-3 text-ink">{pick(locale, prog.name_en, prog.name_hi)}</td>
                      <td className="py-2 px-3 text-muted">{fundingLabel(prog)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{h?.amount != null ? `₹${fmtCr(h.amount)} cr` : "—"}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{h?.used != null ? `₹${fmtCr(h.used)} cr` : L("not published", "अप्रकाशित")}</td>
                      <td className="py-2 pl-3 text-right font-semibold tabular-nums">{h?.pct != null ? `${h.pct}%` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* AUDITS */}
      {audits.length > 0 && (
        <section className="report-section space-y-3">
          <SectionH n="5">{t(locale, "homeAuditsTitle")}</SectionH>
          <ul className="space-y-3">
            {audits.map((a, i) => (
              <li key={i} className="border-l-2 border-danger/60 pl-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{a.programme_en ?? a.report_ref ?? "—"}</span>
                  {a.amount_flagged_cr != null && (
                    <span className="text-sm font-semibold tabular-nums text-warn">₹{fmtCr(a.amount_flagged_cr)} cr</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{pick(locale, a.finding_en, a.finding_hi)}</p>
                {a.report_ref && <p className="mt-1 text-xs text-muted">{a.report_ref}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* COUNTERPOINT */}
      <section className="report-section space-y-2">
        <SectionH n="6">{p(COUNTERPOINT.title)}</SectionH>
        <p className="max-w-2xl text-sm text-muted">{p(COUNTERPOINT.body)}</p>
      </section>

      {/* SOURCES */}
      <section className="report-section space-y-3">
        <SectionH n="7">{t(locale, "homeSourcesTitle")}</SectionH>
        <ol className="list-decimal space-y-1.5 pl-5 text-xs text-muted">
          {HOME_SOURCES.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="pt-2 text-xs text-muted">
          {L(
            "Every figure carries its source; spending is never asserted. Where Bihar publishes nothing, an RTI request is the evidence trail.",
            "हर आँकड़ा अपना स्रोत रखता है; व्यय का दावा नहीं किया जाता। जहाँ बिहार कुछ प्रकाशित नहीं करता, वहाँ RTI अनुरोध ही प्रमाण-शृंखला है।"
          )}
          {" · "}
          <a href="https://cag.gov.in/ag/bihar/en/audit-report" target="_blank" rel="noopener noreferrer" className="text-brand-strong underline underline-offset-2">
            {hostLabel("https://cag.gov.in/ag/bihar/en/audit-report")} ↗
          </a>
        </p>
      </section>
    </article>
  );
}

function SectionH({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-baseline gap-2 text-lg font-semibold text-ink">
      <span className="text-sm font-bold text-brand-strong">{n}.</span>
      {children}
    </h2>
  );
}

function StatTile({ stat, locale }: { stat: ShockStat; locale: Locale }) {
  const sub = pick(locale, stat.sub.en, stat.sub.hi);
  return (
    <div className="bg-surface p-4">
      <div className={`text-2xl font-semibold tabular-nums ${stat.tone === "warn" ? "text-warn" : "text-ink"}`}>{stat.value}</div>
      <div className="mt-1 text-[13px] font-medium text-ink">{pick(locale, stat.label.en, stat.label.hi)}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
        {sub && <span>{sub}</span>}
        <span className="whitespace-nowrap rounded-[3px] px-1.5 py-0.5 ring-1 ring-inset ring-line">{stat.src}</span>
      </div>
    </div>
  );
}
