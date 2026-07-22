"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { PopState, ProvPopover, popFrom } from "@/components/Provenance";
import { FLOW_SCROLLY, WATERFALL, type WfSeg } from "@/lib/education-home";
import { pick, type Locale } from "@/lib/i18n";

// Follow-the-rupee: FY24 SNA money drawn to one scale, every segment a provenance tap
// (overview first, details on demand). Green = confirmed, amber = parked, dashed = unverifiable.

export function RupeeWaterfall({ locale }: { locale: Locale }) {
  const [pop, setPop] = useState<PopState | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const segCls = (k: WfSeg["kind"]) =>
    k === "g"
      ? "bg-brand hover:brightness-110"
      : k === "a"
        ? "bg-warn/25 hover:brightness-105"
        : k === "d"
          ? "border-[1.5px] border-dashed border-line bg-transparent"
          : "pointer-events-none bg-paper";

  const labCls = (k: WfSeg["kind"]) =>
    k === "g"
      ? "justify-end text-white"
      : k === "a"
        ? "justify-end text-ink"
        : "justify-start font-normal text-muted";

  return (
    <div ref={boxRef} className="relative overflow-hidden rounded-md border border-line bg-surface p-5">
      {/* legend + source */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-brand" /> {pick(locale, FLOW_SCROLLY.legend.green.en, FLOW_SCROLLY.legend.green.hi)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-warn/25" /> {pick(locale, FLOW_SCROLLY.legend.parked.en, FLOW_SCROLLY.legend.parked.hi)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-[3px] border border-dashed border-line" />{" "}
            {pick(locale, FLOW_SCROLLY.legend.unverified.en, FLOW_SCROLLY.legend.unverified.hi)}
          </span>
        </div>
        <a
          href={WATERFALL.srcUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted underline underline-offset-2 hover:text-ink"
        >
          {WATERFALL.srcLabel} ↗
        </a>
      </div>

      {/* rows */}
      <div className="mt-5 flex max-w-[860px] flex-col gap-5">
        {WATERFALL.rows.map((row, ri) => (
          <div key={ri} className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[150px_1fr] sm:items-center">
            <div>
              <div className="text-[13px] font-semibold text-ink">{pick(locale, row.name.en, row.name.hi)}</div>
              <div className="text-xs tabular-nums text-muted">{row.amt}</div>
            </div>
            <div className="flex h-10 w-full gap-0.5">
              {row.segs.map((s, si) =>
                s.kind === "ghost" ? (
                  <span key={si} className={`h-full min-w-[3px] rounded ${segCls(s.kind)}`} style={{ width: `${s.pct}%` }} />
                ) : (
                  <button
                    key={si}
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`${s.pop ? pick(locale, s.pop.title.en, s.pop.title.hi) : ""}${s.pop?.value ? `, ${s.pop.value}` : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      s.pop &&
                        setPop(
                          popFrom(e, boxRef.current, {
                            title: pick(locale, s.pop.title.en, s.pop.title.hi),
                            value: s.pop.value,
                            doc: pick(locale, s.pop.doc.en, s.pop.doc.hi),
                            prov: s.pop.prov,
                            src: s.pop.src,
                          })
                        );
                    }}
                    className={`relative h-full min-w-[3px] cursor-pointer rounded ${segCls(s.kind)}`}
                    style={{ width: `${s.pct}%` }}
                  >
                    {s.label && (
                      <span
                        className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-nowrap px-2.5 text-[11.5px] font-semibold ${labCls(s.kind)}`}
                      >
                        {pick(locale, s.label.en, s.label.hi)}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-muted">
        <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
        {pick(
          locale,
          "Tap a segment — the exact figure, its provenance, and the source document.",
          "किसी खंड पर टैप करें — सटीक आँकड़ा, उसका स्रोत व दस्तावेज़।"
        )}
      </p>

      <ProvPopover pop={pop} locale={locale} onClose={() => setPop(null)} />
    </div>
  );
}
