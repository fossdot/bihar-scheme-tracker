"use client";

import { useEffect, useRef, useState } from "react";
import { FLOW_SCROLLY } from "@/lib/education-home";
import { pick, type Locale } from "@/lib/i18n";

// The signature centerpiece: a pinned money bar that transforms as four narrative steps scroll
// past it (released → parked → unverifiable). One shared scale, so the confirmed green visibly
// shrinks. State is driven by whichever step is crossing the middle of the viewport.
export function ScrollyMoneyFlow({ locale }: { locale: Locale }) {
  const [state, setState] = useState<string>(FLOW_SCROLLY.steps[0].state);
  const stepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodes = stepsRef.current?.querySelectorAll<HTMLElement>("[data-state]");
    if (!nodes || nodes.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const s = (e.target as HTMLElement).dataset.state;
          if (e.isIntersecting && s) setState(s);
        });
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const active = FLOW_SCROLLY.steps.find((s) => s.state === state) ?? FLOW_SCROLLY.steps[0];

  return (
    <div className="scrolly">
      {/* Pinned stage */}
      <div className="scrolly-stage">
        <div className="w-[min(440px,86%)]" data-state={state}>
          <div className="text-[11px] uppercase tracking-wide text-muted">
            {pick(locale, FLOW_SCROLLY.kicker.en, FLOW_SCROLLY.kicker.hi)}
          </div>
          <div className={`mt-1 text-5xl font-bold tracking-tight tabular-nums ${active.warn ? "text-warn" : "text-ink"}`}>
            {active.num}
          </div>
          <div className="mt-2 min-h-[2.6em] text-[15px] text-muted">{pick(locale, active.cap.en, active.cap.hi)}</div>

          <div className="mbar mt-5">
            <div className="mseg mseg-green" />
            <div className="mseg mseg-amber" />
          </div>

          <div className="mt-3.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-brand" />
              {pick(locale, FLOW_SCROLLY.legend.green.en, FLOW_SCROLLY.legend.green.hi)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "rgb(var(--warn) / .32)" }} />
              {pick(locale, FLOW_SCROLLY.legend.parked.en, FLOW_SCROLLY.legend.parked.hi)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-[3px] border border-dashed border-line" />
              {pick(locale, FLOW_SCROLLY.legend.unverified.en, FLOW_SCROLLY.legend.unverified.hi)}
            </span>
          </div>

          <a
            href={FLOW_SCROLLY.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-[11px] text-muted underline underline-offset-2 hover:text-ink"
          >
            {FLOW_SCROLLY.source} ↗
          </a>
        </div>
      </div>

      {/* Narrative steps */}
      <div className="scrolly-steps" ref={stepsRef}>
        {FLOW_SCROLLY.steps.map((s) => (
          <div key={s.state} data-state={s.state} className="scrolly-step">
            <div className="max-w-[44ch] rounded-md border border-line bg-surface/90 p-6 backdrop-blur-sm md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              <div className="text-xs font-bold tracking-[0.15em] text-brand-strong">{s.n}</div>
              <h3 className="mt-2 text-balance text-2xl font-bold leading-tight tracking-tight text-ink md:text-3xl">
                {pick(locale, s.heading.en, s.heading.hi)}
              </h3>
              <p className="mt-3 text-[15px] text-muted">{pick(locale, s.body.en, s.body.hi)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
