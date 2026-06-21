"use client";

import { useCallback, useEffect, useState } from "react";

type Stats = {
  days: number;
  searchTotal: string;
  viewTotal: string;
  bySurface: { surface: string; n: string; zero: string }[];
  topQueries: { term: string; n: string; avg: string }[];
  zeroQueries: { term: string; n: string }[];
  topSchemes: { name: string; n: string }[];
  topPolicies: { name: string; n: string }[];
};
type View = "loading" | "locked" | "ready" | "unconfigured";

export function AdminClient() {
  const [view, setView] = useState<View>("loading");
  const [stats, setStats] = useState<Stats | null>(null);
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin", { credentials: "same-origin", cache: "no-store" });
      if (res.status === 503) return setView("unconfigured");
      if (res.status === 401) return setView("locked");
      const data = (await res.json()) as { stats?: Stats };
      setStats(data.stats ?? null);
      setView("ready");
    } catch {
      setView("locked");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      setKey("");
      await refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin", { method: "DELETE", credentials: "same-origin" }).catch(() => {});
    setStats(null);
    setView("locked");
  }

  if (view === "loading") return <p className="text-sm text-muted">Loading…</p>;

  if (view === "unconfigured")
    return (
      <p className="text-sm text-warn">
        Analytics dashboard is locked: set a strong <code>ADMIN_KEY</code> (≥ 8 chars) in the
        server environment, then reload.
      </p>
    );

  if (view === "locked" || !stats)
    return (
      <form onSubmit={login} className="max-w-sm space-y-3">
        <label className="block text-sm font-medium text-ink" htmlFor="key">
          Admin key
        </label>
        <input
          id="key"
          type="password"
          autoComplete="current-password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand"
        />
        {error && <p className="text-sm text-danger">Wrong key — try again.</p>}
        <button
          type="submit"
          disabled={busy || !key}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Analytics</h1>
        <button type="button" onClick={logout} className="text-sm font-medium text-muted hover:text-ink">
          Lock
        </button>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
        <Stat label={`Searches · ${stats.days}d`} value={stats.searchTotal} />
        <Stat label={`Page views · ${stats.days}d`} value={stats.viewTotal} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Searches by surface">
          <RankList
            rows={stats.bySurface.map((r) => ({
              label: r.surface,
              n: r.n,
              meta: Number(r.zero) > 0 ? `${r.zero} returned 0` : undefined,
            }))}
            empty="No searches yet."
          />
        </Card>
        <Card title="🔴 Zero-result searches — what to add">
          <RankList rows={stats.zeroQueries.map((r) => ({ label: `“${r.term}”`, n: r.n }))} empty="None — every search returned results." />
        </Card>
        <Card title="Top search queries">
          <RankList rows={stats.topQueries.map((r) => ({ label: `“${r.term}”`, n: r.n, meta: `avg ${r.avg}` }))} empty="No free-text searches yet." />
        </Card>
        <Card title="Most-viewed schemes">
          <RankList rows={stats.topSchemes.map((r) => ({ label: r.name, n: r.n }))} empty="No scheme views logged yet." />
        </Card>
        <Card title="Most-viewed policies">
          <RankList rows={stats.topPolicies.map((r) => ({ label: r.name, n: r.n }))} empty="No policy views logged yet." />
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-5">
      <div className="text-2xl font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-line bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}

function RankList({ rows, empty }: { rows: { label: string; n: string; meta?: string }[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => Number(r.n) || 0), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className="w-10 shrink-0 text-right font-medium tabular-nums text-ink">{r.n}</span>
          <span className="relative min-w-0 flex-1">
            <span className="block truncate text-ink">{r.label}</span>
            <span className="mt-0.5 block h-1 rounded bg-brand/70" style={{ width: `${(Number(r.n) / max) * 100}%` }} />
          </span>
          {r.meta && <span className="shrink-0 text-xs text-muted">{r.meta}</span>}
        </li>
      ))}
    </ul>
  );
}
