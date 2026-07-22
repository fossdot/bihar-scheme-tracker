import { Icon } from "@/components/Icon";
import { FLOW, type FlowStep } from "@/lib/education-home";
import { pick, type Locale } from "@/lib/i18n";

// The signature graphic. Every bar shares one scale (₹31,145 cr released), so the confirmed green
// visibly shrinks down the funnel — 100% → 53% → 0% — while the money that stopped is called out in
// amber (parked) and the unverifiable end is a dashed, empty bar. Green only ever encodes confirmed
// money; amber is the semantic "warning"; the dashed ground is "we cannot see it." All sourced.
export function MoneyFlow({ locale }: { locale: Locale }) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-surface">
      {/* Header — title + subtitle, compact source link that never pushes the row off-screen. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 border-b border-line bg-paper px-4 py-3">
        <div className="flex min-w-0 items-start gap-2">
          <Icon name="chart" className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" />
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-ink">{pick(locale, FLOW.title.en, FLOW.title.hi)}</h2>
            <p className="mt-0.5 max-w-prose text-xs text-muted">{pick(locale, FLOW.subtitle.en, FLOW.subtitle.hi)}</p>
          </div>
        </div>
        <a
          href={FLOW.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 whitespace-nowrap text-[11px] text-muted underline underline-offset-2 hover:text-ink"
        >
          {FLOW.sourceShort} ↗
        </a>
      </div>

      <div className="p-4">
        {/* Legend */}
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> {pick(locale, FLOW.legend.green.en, FLOW.legend.green.hi)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-warn/30" /> {pick(locale, FLOW.legend.parked.en, FLOW.legend.parked.hi)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm border border-dashed border-line" /> {pick(locale, FLOW.legend.unverified.en, FLOW.legend.unverified.hi)}
          </span>
        </div>

        {/* Steps — one shared scale */}
        <div className="space-y-4">
          {FLOW.steps.map((s) => (
            <Step key={s.key} s={s} locale={locale} />
          ))}
        </div>

        <p className="mt-5 flex items-start gap-2.5 rounded-md border border-dashed border-line bg-paper p-3.5 text-[13px] text-muted">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{pick(locale, FLOW.blackHole.en, FLOW.blackHole.hi)}</span>
        </p>
      </div>
    </section>
  );
}

function Step({ s, locale }: { s: FlowStep; locale: Locale }) {
  const fullyUnverified = s.greenPct === 0 && s.loss?.tone === "unverified";
  const noteText = s.loss ? pick(locale, s.loss.label.en, s.loss.label.hi) : s.caption ? pick(locale, s.caption.en, s.caption.hi) : "";

  return (
    <div className="grid gap-x-4 gap-y-2 sm:grid-cols-[168px_1fr] sm:items-center">
      <div>
        <div className="text-[13px] font-semibold text-ink">{pick(locale, s.label.en, s.label.hi)}</div>
        <div className={`text-lg font-semibold tabular-nums ${s.greenPct === 0 ? "text-warn" : "text-ink"}`}>{s.amountLabel}</div>
      </div>

      <div>
        <div className={`relative h-9 w-full overflow-hidden rounded bg-paper ${fullyUnverified ? "border border-dashed border-line" : "border border-line"}`}>
          {s.greenPct > 0 && <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${s.greenPct}%` }} />}
          {s.loss?.tone === "parked" && (
            <div className="absolute inset-y-0 bg-warn/25" style={{ left: `${s.greenPct}%`, width: `${s.loss.pct}%` }} />
          )}
          {fullyUnverified && (
            <div className="absolute inset-0 flex items-center gap-1.5 px-3 text-xs text-muted">
              <Icon name="info" className="h-3.5 w-3.5 shrink-0" />
              {pick(locale, FLOW.legend.unverified.en, FLOW.legend.unverified.hi)} — {locale === "hi" ? "कोई वाउचर नहीं" : "no vouchers"}
            </div>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
              s.chip.tone === "good" ? "text-brand-strong ring-brand/40" : "text-warn ring-warn/40"
            }`}
          >
            {pick(locale, s.chip.text.en, s.chip.text.hi)}
          </span>
          {noteText && (
            <span className={`text-xs ${s.loss?.tone === "parked" ? "text-warn" : "text-muted"}`}>{noteText}</span>
          )}
        </div>
      </div>
    </div>
  );
}
