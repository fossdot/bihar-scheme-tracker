import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Card } from "@/components/ui";
import { GuessTransition } from "@/components/GuessFirst";
import { ScrollyMoneyFlow } from "@/components/ScrollyMoneyFlow";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  CAPACITY,
  COUNTERPOINT,
  FLOW_SCROLLY,
  HOME_SOURCES,
  OUTCOMES,
  SCENES,
  type Bilingual,
  type ShockStat,
} from "@/lib/education-home";
import { altLinks, localizedHref, pick, t, tryT, type Locale } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale";
import { getEducationOverview, headline, type EduAudit, type EduProgramme } from "@/lib/education";
import { isDbConfigured } from "@/lib/queries";
import { hostLabel } from "@/lib/status";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const locale = resolveLocale(params.lang);
  const title = `${t(locale, "appName")} — ${t(locale, "tagline")}`;
  const description =
    locale === "hi"
      ? "बिहार भारत का सबसे ग़रीब राज्य — उसके बच्चों को पढ़ाने के लिए आए पैसे का पीछा: जारी से, निकासी तक, और छात्र तक पहुँचा सत्यापित होने तक। हर आँकड़ा स्रोत-सहित।"
      : "Bihar is India’s poorest state. Follow the money meant to teach its children — from released, to drawn down, to verified as reaching a school. Every figure sourced.";
  return {
    title,
    description,
    alternates: altLinks(locale, "/"),
    openGraph: { url: localizedHref(locale, "/"), title, description },
  };
}

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
  return "text-muted ring-line";
}

export default async function Home({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang);
  const p = (b: Bilingual) => pick(locale, b.en, b.hi);

  const overview = isDbConfigured() ? await getEducationOverview().catch(() => null) : null;
  const programmes = (overview?.programmes ?? [])
    .slice()
    .sort((a, b) => (headline(b.allocations)?.amount ?? 0) - (headline(a.allocations)?.amount ?? 0))
    .slice(0, 4);
  const audits = (overview?.audits ?? []).slice(0, 3);

  const childRows = OUTCOMES.rows.map((r) => ({
    label: p(r.name),
    value: `${t(locale, "homeBihar")} ${r.bihar}% · ${t(locale, "homeIndia")} ${r.india}%`,
  }));

  return (
    <div className="space-y-20 sm:space-y-28">
      {/* HERO */}
      <section className="flex min-h-[86vh] flex-col justify-center">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-brand-strong">{p(SCENES.hero.eyebrow)}</div>
        <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          {p(SCENES.hero.h1)}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{p(SCENES.hero.body)}</p>
        <div className="mt-10 flex items-center gap-2.5 text-sm text-muted">
          <span className="scrollcue-dot" aria-hidden="true" />
          {p(SCENES.hero.cue)}
        </div>
      </section>

      {/* SIGNATURE pinned money-flow */}
      <ScrollyMoneyFlow locale={locale} />
      <Evidence
        summary={p(SCENES.seeEvidence)}
        rows={FLOW_SCROLLY.evidence.map((e) => ({ label: p(e.label), value: e.value }))}
        source={FLOW_SCROLLY.source}
        sourceUrl={FLOW_SCROLLY.sourceUrl}
      />

      {/* THE CHILDREN */}
      <section>
        <p className="reveal text-xs font-semibold uppercase tracking-wide text-muted">{p(SCENES.children.kicker)}</p>
        <h2 className="reveal mt-3 max-w-[20ch] text-balance text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          {p(SCENES.children.punch)}
        </h2>
        <p className="reveal mt-4 max-w-2xl text-muted">{p(SCENES.children.lede)}</p>
        <div className="reveal mt-6">
          <GuessTransition locale={locale} />
        </div>
        <div className="mt-6">
          <Evidence summary={p(SCENES.seeEvidence)} rows={childRows} source={p(OUTCOMES.source)} sourceUrl={OUTCOMES.sourceUrl} />
        </div>
      </section>

      {/* CAPACITY */}
      <section>
        <p className="reveal text-xs font-semibold uppercase tracking-wide text-muted">{p(SCENES.capacity.kicker)}</p>
        <h2 className="reveal mt-3 max-w-[22ch] text-balance text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          {p(SCENES.capacity.punch)}
        </h2>
        <div className="reveal mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
          {CAPACITY.map((s, i) => (
            <StatTile key={i} stat={s} locale={locale} />
          ))}
        </div>
      </section>

      {/* COUNTERPOINT */}
      <section className="reveal rounded-md border border-line border-l-[3px] border-l-brand bg-surface p-6">
        <h2 className="text-xl font-bold text-ink">{p(COUNTERPOINT.title)}</h2>
        <p className="mt-2 max-w-3xl text-muted">{p(COUNTERPOINT.body)}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {COUNTERPOINT.figs.map((f, i) => (
            <span key={i} className="text-muted">
              <span className="text-ink">{p(f.label)}</span> <SrcRef>{f.src}</SrcRef>
            </span>
          ))}
        </div>
      </section>

      {/* MONEY, PROGRAMME BY PROGRAMME (live DB) */}
      {programmes.length > 0 && (
        <Card icon="rupee" title={t(locale, "homeMoveTitle")} className="reveal bg-surface">
          <p className="-mt-1 mb-4 text-sm text-muted">{t(locale, "homeMoveNote")}</p>
          <div className="space-y-4">
            {programmes.map((prog) => (
              <ProgrammeMini key={prog.id} prog={prog} locale={locale} />
            ))}
          </div>
          <Link href={localizedHref(locale, "/programmes")} className="mt-4 inline-block text-sm text-brand-strong hover:underline">
            {t(locale, "homeSeeProgrammes")}
          </Link>
        </Card>
      )}

      {/* WHAT THE AUDITORS FOUND (live DB) */}
      {audits.length > 0 && (
        <Card icon="info" title={t(locale, "homeAuditsTitle")} className="reveal bg-surface">
          <ul className="space-y-4">
            {audits.map((a, i) => (
              <AuditItem key={i} a={a} locale={locale} />
            ))}
          </ul>
          <Link href={localizedHref(locale, "/programmes")} className="mt-4 inline-block text-sm text-brand-strong hover:underline">
            {t(locale, "homeSeeAudits")}
          </Link>
        </Card>
      )}

      {/* THE TURN / ACTION */}
      <section className="reveal">
        <h2 className="max-w-[22ch] text-balance text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          {p(SCENES.turn.punch)}
        </h2>
        <div className="mt-6 rounded-md border border-line border-l-[3px] border-l-brand bg-surface p-6 sm:p-7">
          <p className="text-[15px] text-ink">
            <span className="font-semibold">{p(SCENES.turn.shouldLabel)}:</span> {p(SCENES.turn.shouldBody)}
          </p>
          <div className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">{t(locale, "plainDoTitle")}</div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href={localizedHref(locale, "/find-my-schemes")}
              className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              {t(locale, "plainDoClaim")} →
            </Link>
            <Link
              href={localizedHref(locale, "/rti")}
              className="inline-flex items-center rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-ink"
            >
              {t(locale, "plainDoRti")} →
            </Link>
          </div>
        </div>
      </section>

      {/* SOURCES */}
      <section className="reveal border-t border-line pt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">{t(locale, "homeSourcesTitle")}</h2>
        <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-xs text-muted sm:grid-cols-2">
          {HOME_SOURCES.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <ScrollReveal />
    </div>
  );
}

// ── helpers ──

function SrcRef({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-[3px] px-1.5 py-0.5 text-[10.5px] text-muted ring-1 ring-inset ring-line">
      {children}
    </span>
  );
}

/** Progressive-disclosure evidence box (native <details>, no JS). */
function Evidence({
  summary,
  rows,
  source,
  sourceUrl,
}: {
  summary: string;
  rows: { label: string; value: string }[];
  source: string;
  sourceUrl?: string;
}) {
  return (
    <details className="reveal group max-w-[70ch] rounded-md border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-brand-strong [&::-webkit-details-marker]:hidden">
        <span className="transition-transform group-open:rotate-90">▸</span>
        {summary}
      </summary>
      <div className="border-t border-line px-4 pb-4 pt-3 text-sm text-muted">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1">
          {rows.map((r, i) => (
            <Fragment key={i}>
              <dt className="text-muted">{r.label}</dt>
              <dd className="m-0 tabular-nums text-ink">{r.value}</dd>
            </Fragment>
          ))}
        </dl>
        <p className="mt-3">
          {source}
          {sourceUrl && (
            <>
              {" · "}
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-strong underline underline-offset-2">
                {hostLabel(sourceUrl)} ↗
              </a>
            </>
          )}
        </p>
      </div>
    </details>
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
        <SrcRef>{stat.src}</SrcRef>
      </div>
    </div>
  );
}

function ProgrammeMini({ prog, locale }: { prog: EduProgramme; locale: Locale }) {
  const h = headline(prog.allocations);
  const name = pick(locale, prog.name_en, prog.name_hi);
  const hasPct = h && h.pct != null && h.amount != null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{name}</span>
          <span className="rounded bg-paper px-1.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-inset ring-line">
            {fundingLabel(prog)}
          </span>
        </div>
        {h?.amount != null && (
          <div className="text-[13px] text-muted">
            {h.used != null ? (
              <>
                <span className="font-semibold tabular-nums text-ink">₹{fmtCr(h.used)} cr</span> {t(locale, "eduSpentOf")}{" "}
                <span className="tabular-nums">₹{fmtCr(h.amount)} cr</span>
              </>
            ) : (
              <span className="tabular-nums">₹{fmtCr(h.amount)} cr</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-2">
        {hasPct ? (
          <div className="flex items-center gap-3">
            <div className="relative h-5 flex-1 overflow-hidden rounded border border-line bg-paper">
              <div className="h-full bg-brand" style={{ width: `${Math.min(100, Math.max(2, h!.pct!))}%` }} />
            </div>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
              {h!.pct}% <span className="font-normal text-muted">{t(locale, "eduPctSpent")}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded border border-dashed border-line bg-paper px-3 py-1.5 text-xs text-muted">
            <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
            {t(locale, "eduSpendRtiNeeded")}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        {(h?.usedProv ?? h?.amountProv) && (
          <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${provClass(h?.usedProv ?? h?.amountProv)}`}>
            {tryT(locale, `prov_${h?.usedProv ?? h?.amountProv}`, h?.usedProv ?? h?.amountProv ?? "")}
          </span>
        )}
        {(h?.usedSrc ?? h?.amountSrc ?? prog.source_url) && (
          <a
            href={h?.usedSrc ?? h?.amountSrc ?? prog.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-strong underline underline-offset-2"
          >
            {hostLabel(h?.usedSrc ?? h?.amountSrc ?? prog.source_url)} ↗
          </a>
        )}
      </div>
    </div>
  );
}

function AuditItem({ a, locale }: { a: EduAudit; locale: Locale }) {
  return (
    <li className="border-l-2 border-danger/60 pl-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{a.programme_en ?? a.report_ref ?? "—"}</span>
        {a.amount_flagged_cr != null && (
          <span className="text-sm font-semibold tabular-nums text-warn">
            ₹{fmtCr(a.amount_flagged_cr)} cr {t(locale, "eduAuditFlagged")}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{pick(locale, a.finding_en, a.finding_hi)}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        {a.report_ref && a.programme_en && <span className="text-xs text-muted">{a.report_ref}</span>}
        {a.provenance && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${provClass(a.provenance)}`}>
            {tryT(locale, `prov_${a.provenance}`, a.provenance)}
          </span>
        )}
        {a.source_url && (
          <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand-strong underline underline-offset-2">
            {hostLabel(a.source_url)} ↗
          </a>
        )}
      </div>
    </li>
  );
}
