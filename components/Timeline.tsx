// Lifecycle timeline (endoflife.date-style Gantt): a horizontal bar over [start … rightEdge]
// with a "now" marker, the active/validity span filled, and optional tick marks (e.g. confirmed
// budget years). Pure + server-safe; data-driven widths via inline style. No external deps.

function toDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export type Tick = { atISO: string; label: string };

export function Timeline({
  startISO,
  endISO,
  today,
  active,
  leftLabel,
  rightLabel,
  ticks = [],
}: {
  startISO: string;
  endISO?: string | null; // null = open-ended / ongoing
  today: string;
  active: boolean; // brand fill vs muted (past)
  leftLabel: string;
  rightLabel: string;
  ticks?: Tick[];
}) {
  const start = toDate(startISO);
  const now = toDate(today);
  if (!start || !now) return null;
  const end = endISO ? toDate(endISO) : null;

  const min = start.getTime();
  const max = Math.max(end ? end.getTime() : now.getTime(), now.getTime());
  const span = max - min || 1;
  const pct = (t: number) => clamp01((t - min) / span) * 100;

  const nowPct = pct(now.getTime());
  const spanEndPct = end ? pct(end.getTime()) : nowPct; // right edge of the validity/active span

  return (
    <div>
      <div className="relative h-2 rounded bg-paper ring-1 ring-inset ring-line">
        {/* elapsed (filled) portion */}
        <div
          className={`absolute inset-y-0 left-0 rounded ${active ? "bg-brand" : "bg-muted"}`}
          style={{ width: `${active ? nowPct : spanEndPct}%`, opacity: active ? 0.9 : 0.45 }}
        />
        {/* remaining validity (active only) — lighter */}
        {active && end && spanEndPct > nowPct && (
          <div
            className="absolute inset-y-0 rounded bg-brand"
            style={{ left: `${nowPct}%`, width: `${spanEndPct - nowPct}%`, opacity: 0.3 }}
          />
        )}
        {/* budget-year (or other) ticks */}
        {ticks.map((tk) => {
          const d = toDate(tk.atISO);
          if (!d) return null;
          return (
            <div
              key={tk.atISO + tk.label}
              className="absolute -top-1 bottom-[-4px] w-px bg-ink/60"
              style={{ left: `${pct(d.getTime())}%` }}
              title={tk.label}
            />
          );
        })}
        {/* now marker */}
        <div
          className="absolute -top-1.5 bottom-[-6px] w-0.5 bg-ink"
          style={{ left: `calc(${nowPct}% - 1px)` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span>{leftLabel}</span>
        {ticks.length > 0 && (
          <span className="hidden gap-2 sm:flex">
            {ticks.map((tk) => (
              <span key={"l" + tk.atISO + tk.label}>{tk.label}</span>
            ))}
          </span>
        )}
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
