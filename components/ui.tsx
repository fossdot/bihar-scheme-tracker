import { Icon } from "@/components/Icon";

// ── Shared visual primitives — the standard look for schemes, policies, and beyond.
//    Card = a titled, icon-headed section. FactTile = a stat tile. Row = an icon fact row. ──

export function Card({
  icon,
  title,
  right,
  children,
  className = "",
}: {
  icon?: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-md border border-line ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-2.5">
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className="h-4 w-4 text-muted" />}
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function FactTile({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface p-4">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon name={icon} className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-1.5 font-medium text-ink">{value}</div>
    </div>
  );
}

export function Row({
  icon,
  label,
  value,
}: {
  icon?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <Icon name={icon} className="mt-0.5 h-4 w-4 shrink-0 text-muted" />}
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="font-medium text-ink">{value}</div>
      </div>
    </div>
  );
}

export function Panel({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  const cls =
    tone === "error"
      ? "border-danger/40 bg-surface text-danger"
      : "border-line bg-paper text-muted";
  return (
    <div className={`rounded-md border p-6 text-sm ${cls}`}>{children}</div>
  );
}

/** Shown on data pages when the database isn't configured yet, so the app is
 *  clickable before Postgres is wired up. */
export function ConfigNotice() {
  return (
    <Panel>
      <p className="font-medium text-ink">Database isn’t configured yet.</p>
      <p className="mt-1">
        Set <Code>DATABASE_URL</Code> in <Code>.env.local</Code>, apply the
        migrations in <Code>supabase/migrations/</Code> with <Code>psql</Code>,
        then run <Code>npm run seed</Code>.
      </p>
    </Panel>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-paper px-1 py-0.5 font-mono text-[0.85em] text-ink ring-1 ring-inset ring-line">
      {children}
    </code>
  );
}
