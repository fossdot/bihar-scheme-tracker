"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { PopState, ProvPopover, popFrom, provChipClass } from "@/components/Provenance";
import { EXPLORER_TEXT, RGSA_TRAINED } from "@/lib/education-home";
import { pick, t, tryT, type Locale } from "@/lib/i18n";
import type { EduAllocation, EduAudit, EduProgramme } from "@/lib/education";

// Programme explorer v2 — pick a programme, follow its money year by year and stage by stage,
// flip to ONE shared ₹ scale (the honest drama: skilling money nearly disappears), scrub RGSA's
// years, compare two side by side. Every ₹ figure is a provenance tap.

const fmtCr = (v: number) =>
  v >= 100 ? Math.round(v).toLocaleString("en-IN") : v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const fmtIN = (n: number) => Math.round(n).toLocaleString("en-IN");
const fillTpl = (tpl: string, tokens: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (_, k) => tokens[k] ?? "");

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

const committedOf = (a: EduAllocation) => a.approved_cr ?? a.released_cr ?? null;
/** ≥3 dated periods with released figures → render as a time-series scrubber (RGSA today). */
const isTimeSeries = (p: EduProgramme) => p.allocations.filter((a) => a.released_cr != null).length >= 3;

export function ProgrammeExplorer({
  programmes,
  audits,
  locale,
}: {
  programmes: EduProgramme[];
  audits: EduAudit[];
  locale: Locale;
}) {
  const [selId, setSelId] = useState(programmes[0]?.id ?? "");
  const [cmpId, setCmpId] = useState("");
  const [scale, setScale] = useState<"own" | "shared">("own");
  const [tsIdx, setTsIdx] = useState<number | null>(null);
  const [pop, setPop] = useState<PopState | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Shared-₹-scale ceiling: the largest committed sum across every programme's allocations.
  const maxCommitted = useMemo(
    () => Math.max(1, ...programmes.flatMap((p) => p.allocations.map((a) => committedOf(a) ?? 0))),
    [programmes]
  );

  const sel = programmes.find((p) => p.id === selId) ?? programmes[0];
  const cmp = cmpId ? (programmes.find((p) => p.id === cmpId) ?? null) : null;
  if (!sel) return null;

  const openProv = (e: React.MouseEvent<HTMLElement>, info: Parameters<typeof popFrom>[2]) => {
    e.stopPropagation();
    setPop(popFrom(e, boxRef.current, info));
  };

  const PvBtn = ({ text, info }: { text: string; info: Parameters<typeof popFrom>[2] }) => (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(e) => openProv(e, info)}
      className="cursor-pointer border-b border-dotted border-muted text-xs tabular-nums text-ink hover:border-brand-strong hover:text-brand-strong"
    >
      {text}
    </button>
  );

  const YearBlock = ({ a, p }: { a: EduAllocation; p: EduProgramme }) => {
    const committed = committedOf(a);
    const cLab = a.approved_cr != null ? t(locale, "progApproved") : t(locale, "progReleased");
    const cProv = a.approved_cr != null ? a.approved_provenance : a.released_provenance;
    const cSrc = (a.approved_cr != null ? a.approved_source_url : a.released_source_url) ?? p.source_url;
    const cDoc = a.approved_cr != null ? a.approved_source_doc : a.released_source_doc;
    const pct = a.spent_cr != null && committed ? Math.round((a.spent_cr / committed) * 100) : null;
    const trackW = scale === "shared" && committed ? Math.max(0.5, (committed / maxCommitted) * 100) : 100;
    const note = pick(locale, a.note_en, a.note_hi);

    return (
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-xs">
          <span className="font-bold tabular-nums text-ink">{a.fiscal_year}</span>
          {committed != null && (
            <span>
              <PvBtn
                text={`₹${fmtCr(committed)} cr`}
                info={{
                  title: `${pick(locale, p.name_en, p.name_hi)} — ${cLab} (${a.fiscal_year})`,
                  value: `₹${fmtCr(committed)} cr`,
                  doc: cDoc ?? undefined,
                  prov: cProv ?? undefined,
                  src: cSrc ?? undefined,
                }}
              />{" "}
              <span className="text-muted">{cLab}</span>
            </span>
          )}
          {a.spent_cr != null && (
            <span>
              <PvBtn
                text={`₹${fmtCr(a.spent_cr)} cr`}
                info={{
                  title: `${pick(locale, p.name_en, p.name_hi)} — ${t(locale, "progSpent")} (${a.fiscal_year})`,
                  value: `₹${fmtCr(a.spent_cr)} cr`,
                  doc: a.spent_source_doc ?? undefined,
                  prov: a.spent_provenance ?? undefined,
                  src: a.spent_source_url ?? p.source_url,
                }}
              />{" "}
              <span className="text-muted">{t(locale, "progSpent")}</span>
            </span>
          )}
          {pct != null && (
            <span className="ml-auto text-muted">
              <b className="tabular-nums text-ink">{pct}%</b> {t(locale, "eduPctSpent")}
            </span>
          )}
        </div>

        {a.spent_cr != null && committed ? (
          <div
            className="relative mt-2 h-6 overflow-hidden rounded border border-line bg-paper transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${trackW}%` }}
          >
            <div
              className="h-full rounded-l bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${Math.min(100, (a.spent_cr / committed) * 100)}%` }}
            />
          </div>
        ) : (
          <div
            className="mt-2 flex h-6 items-center gap-1.5 rounded border border-dashed border-line px-2.5 text-[11px] text-muted"
            style={{ width: `${Math.max(trackW, 34)}%` }}
          >
            <Icon name="info" className="h-3 w-3 shrink-0" />
            {t(locale, "eduSpendRtiNeeded")}
          </div>
        )}
        {note && <p className="mt-1.5 max-w-xl text-[11.5px] text-muted">{note}</p>}
      </div>
    );
  };

  const ScrubBlock = ({ p }: { p: EduProgramme }) => {
    const series = p.allocations.filter((a) => a.released_cr != null);
    const maxR = Math.max(1, ...series.map((a) => a.released_cr ?? 0));
    const i = Math.min(tsIdx ?? series.length - 1, series.length - 1);
    const cur = series[i];
    const trained = RGSA_TRAINED[cur.fiscal_year];
    const trackW = scale === "shared" ? Math.max(0.5, (maxR / maxCommitted) * 100) : 100;

    return (
      <div>
        <div className="flex max-w-[420px] justify-between text-[11px] text-muted">
          {series.map((a, j) => (
            <span key={a.fiscal_year} className={j === i ? "font-bold text-ink" : ""}>
              {a.fiscal_year}
            </span>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={series.length - 1}
          step={1}
          value={i}
          onChange={(e) => setTsIdx(+e.target.value)}
          aria-label="Fiscal year"
          aria-valuetext={cur.fiscal_year}
          className="range-brand mt-1 w-[min(420px,100%)]"
        />

        <div className="mt-2 flex flex-wrap gap-8">
          <div>
            <div className="text-[10.5px] uppercase tracking-wide text-muted">{pick(locale, EXPLORER_TEXT.releasedLabel.en, EXPLORER_TEXT.releasedLabel.hi)}</div>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={(e) =>
                openProv(e, {
                  title: `${pick(locale, p.name_en, p.name_hi)} — ${t(locale, "progReleased")} (${cur.fiscal_year})`,
                  value: `₹${fmtCr(cur.released_cr ?? 0)} cr`,
                  doc: cur.released_source_doc ?? undefined,
                  prov: cur.released_provenance ?? undefined,
                  src: cur.released_source_url ?? p.source_url,
                })
              }
              className={`cursor-pointer border-b border-dotted border-muted text-2xl font-bold tabular-nums hover:border-brand-strong ${
                cur.released_cr === 0 ? "text-warn" : "text-ink"
              }`}
            >
              ₹{fmtCr(cur.released_cr ?? 0)} cr
            </button>
          </div>
          {trained != null && (
            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-muted">{pick(locale, EXPLORER_TEXT.trainedLabel.en, EXPLORER_TEXT.trainedLabel.hi)}</div>
              <div className="text-2xl font-bold tabular-nums text-ink">{fmtIN(trained)}</div>
            </div>
          )}
        </div>

        <div
          className="relative mt-2.5 h-6 max-w-[420px] overflow-hidden rounded border border-line bg-paper"
          style={{ width: `${trackW}%`, minWidth: "60px" }}
        >
          <div
            className="h-full rounded-l bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${((cur.released_cr ?? 0) / maxR) * 100}%` }}
          />
        </div>

        {cur.released_cr === 0 && trained != null && (
          <div className="mt-3 max-w-xl rounded border border-dashed border-line bg-paper px-3 py-2 text-[12.5px] text-muted">
            <b className="text-warn">{fillTpl(pick(locale, EXPLORER_TEXT.mismatch.en, EXPLORER_TEXT.mismatch.hi), { n: fmtIN(trained) })}</b>
          </div>
        )}
        <p className="mt-2 text-[11.5px] text-muted">
          {pick(locale, EXPLORER_TEXT.trainedSrc.en, EXPLORER_TEXT.trainedSrc.hi)} · {t(locale, "eduSpendRtiNeeded")}
        </p>
      </div>
    );
  };

  const CardFor = ({ p }: { p: EduProgramme }) => {
    const mine = audits.filter((a) => a.programme_en === p.name_en);
    const nodal = pick(locale, p.nodal_en, p.nodal_hi) || p.nodal_abbrev;
    return (
      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="border-b border-line bg-paper px-4 py-3">
          <h3 className="inline text-[15px] font-semibold text-ink">{pick(locale, p.name_en, p.name_hi)}</h3>{" "}
          <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted ring-1 ring-inset ring-line">
            {fundingLabel(p)}
          </span>
          <div className="mt-1 text-[11.5px] text-muted">
            {nodal && (
              <>
                {t(locale, "eduNodal")}: <span className="text-ink">{nodal}</span> ·{" "}
              </>
            )}
            <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-strong underline underline-offset-2">
              source ↗
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4">
          {isTimeSeries(p) ? <ScrubBlock p={p} /> : p.allocations.map((a, i) => <YearBlock key={i} a={a} p={p} />)}

          {mine.length > 0 && (
            <div className="border-t border-line pt-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                <Icon name="info" className="h-3.5 w-3.5" />
                {t(locale, "eduAuditTitle")}
              </div>
              <ul className="mt-2 space-y-2.5">
                {mine.map((a, i) => (
                  <li key={i} className="border-l-2 border-danger/60 pl-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-ink">{a.report_ref ?? "—"}</span>
                      {a.amount_flagged_cr != null && (
                        <span className="text-xs font-semibold tabular-nums text-warn">
                          ₹{fmtCr(a.amount_flagged_cr)} cr {t(locale, "eduAuditFlagged")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">{pick(locale, a.finding_en, a.finding_hi)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {a.provenance && (
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${provChipClass(a.provenance)}`}>
                          {tryT(locale, `prov_${a.provenance}`, a.provenance)}
                        </span>
                      )}
                      {a.source_url && (
                        <a
                          href={a.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-brand-strong underline underline-offset-2"
                        >
                          source ↗
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={boxRef} className="relative">
      <p className="mb-3 text-sm text-muted">{t(locale, "progExploreHint")}</p>

      {/* programme chips */}
      <div role="group" aria-label={t(locale, "eduProgrammes")} className="flex flex-wrap gap-2">
        {programmes.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === selId}
            onClick={() => {
              setSelId(p.id);
              if (cmpId === p.id) setCmpId("");
              setTsIdx(null);
            }}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13.5px] ${
              p.id === selId
                ? "border-brand bg-brand/5 font-semibold text-ink"
                : "border-line text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {pick(locale, p.name_en, p.name_hi)}
            <span className="rounded bg-paper px-1.5 py-0.5 text-[10px] font-medium text-muted ring-1 ring-inset ring-line">
              {fundingLabel(p)}
            </span>
          </button>
        ))}
      </div>

      {/* controls */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span role="group" aria-label="Scale" className="inline-flex overflow-hidden rounded-md border border-line">
          {(["own", "shared"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scale === s}
              onClick={() => setScale(s)}
              className={`px-3 py-1.5 text-xs ${scale === s ? "bg-brand font-semibold text-white" : "bg-surface text-muted hover:text-ink"}`}
            >
              {pick(locale, EXPLORER_TEXT[s === "own" ? "scaleOwn" : "scaleShared"].en, EXPLORER_TEXT[s === "own" ? "scaleOwn" : "scaleShared"].hi)}
            </button>
          ))}
        </span>

        <label htmlFor="cmp" className="text-muted">
          {t(locale, "progCompare")}
        </label>
        <select
          id="cmp"
          value={cmpId}
          onChange={(e) => setCmpId(e.target.value)}
          className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-brand"
        >
          <option value="">—</option>
          {programmes
            .filter((p) => p.id !== selId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {pick(locale, p.name_en, p.name_hi)}
              </option>
            ))}
        </select>
        {cmpId && (
          <button type="button" onClick={() => setCmpId("")} className="text-brand-strong hover:underline">
            {t(locale, "progClear")}
          </button>
        )}
      </div>

      <p className="mt-2 min-h-[1.4em] text-[11.5px] text-muted">
        {pick(locale, scale === "shared" ? EXPLORER_TEXT.noteShared.en : EXPLORER_TEXT.noteOwn.en, scale === "shared" ? EXPLORER_TEXT.noteShared.hi : EXPLORER_TEXT.noteOwn.hi)}{" "}
        · {pick(locale, EXPLORER_TEXT.tapHint.en, EXPLORER_TEXT.tapHint.hi)}
      </p>

      {/* detail panel(s) */}
      <div className={`mt-4 ${cmp ? "grid gap-5 lg:grid-cols-2 lg:items-start" : ""}`}>
        <CardFor p={sel} />
        {cmp && <CardFor p={cmp} />}
      </div>

      <ProvPopover pop={pop} locale={locale} onClose={() => setPop(null)} />
    </div>
  );
}
