import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin · analytics",
  robots: { index: false, follow: false },
};

const COOKIE = "bst_admin";

// ── auth ──────────────────────────────────────────────────────────────────────
function adminKey(): string | null {
  const k = process.env.ADMIN_KEY;
  return k && k.length >= 8 ? k : null; // refuse to unlock if unset / too weak
}
function isAuthed(): boolean {
  const k = adminKey();
  return !!k && cookies().get(COOKIE)?.value === k;
}

async function login(formData: FormData) {
  "use server";
  const k = adminKey();
  const supplied = String(formData.get("key") ?? "");
  if (k && supplied === k) {
    cookies().set(COOKIE, k, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/admin",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/admin");
  }
  redirect("/admin?e=1");
}

async function logout() {
  "use server";
  cookies().delete(COOKIE);
  redirect("/admin");
}

// ── data ──────────────────────────────────────────────────────────────────────
const DAYS = 30;
const SINCE = `now() - interval '${DAYS} days'`;
const q = <T,>(sql: string) => query<T>(sql).catch(() => [] as T[]);

async function loadStats() {
  const [
    searchTotal,
    bySurface,
    topQueries,
    zeroQueries,
    viewTotal,
    topSchemes,
    topPolicies,
  ] = await Promise.all([
    q<{ n: string }>(`select count(*)::text n from search_events where created_at >= ${SINCE}`),
    q<{ surface: string; n: string; zero: string }>(
      `select surface, count(*)::text n, count(*) filter (where result_count=0)::text zero
         from search_events where created_at >= ${SINCE} group by surface order by count(*) desc`,
    ),
    q<{ term: string; n: string; avg: string }>(
      `select lower(q) term, count(*)::text n, round(avg(result_count))::text avg
         from search_events where created_at >= ${SINCE} and q is not null
         group by lower(q) order by count(*) desc limit 15`,
    ),
    q<{ term: string; n: string }>(
      `select lower(q) term, count(*)::text n
         from search_events where created_at >= ${SINCE} and q is not null and result_count = 0
         group by lower(q) order by count(*) desc limit 15`,
    ),
    q<{ n: string }>(`select count(*)::text n from page_views where created_at >= ${SINCE}`),
    q<{ name: string; n: string }>(
      `select s.name_en name, count(*)::text n
         from page_views v join schemes s on s.id = v.entity_id
         where v.entity_type = 'scheme' and v.created_at >= ${SINCE}
         group by s.name_en order by count(*) desc limit 15`,
    ),
    q<{ name: string; n: string }>(
      `select p.name_en name, count(*)::text n
         from page_views v join policies p on p.id = v.entity_id
         where v.entity_type = 'policy' and v.created_at >= ${SINCE}
         group by p.name_en order by count(*) desc limit 10`,
    ),
  ]);
  return {
    searchTotal: searchTotal[0]?.n ?? "0",
    bySurface,
    topQueries,
    zeroQueries,
    viewTotal: viewTotal[0]?.n ?? "0",
    topSchemes,
    topPolicies,
  };
}

// ── UI ────────────────────────────────────────────────────────────────────────
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

export default async function AdminPage() {
  if (!adminKey()) {
    return (
      <Shell>
        <p className="text-sm text-warn">
          Analytics dashboard is locked: set a strong <code>ADMIN_KEY</code> (≥ 8 chars) in the
          server environment, then reload.
        </p>
      </Shell>
    );
  }

  if (!isAuthed()) {
    return (
      <Shell>
        <form action={login} className="max-w-sm space-y-3">
          <label className="block text-sm font-medium text-ink" htmlFor="key">
            Admin key
          </label>
          <input
            id="key"
            name="key"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand"
          />
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Unlock
          </button>
        </form>
      </Shell>
    );
  }

  const s = await loadStats();
  return (
    <Shell authed>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
        <Stat label={`Searches · ${DAYS}d`} value={s.searchTotal} />
        <Stat label={`Page views · ${DAYS}d`} value={s.viewTotal} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Searches by surface">
          <RankList
            rows={s.bySurface.map((r) => ({
              label: r.surface,
              n: r.n,
              meta: Number(r.zero) > 0 ? `${r.zero} returned 0` : undefined,
            }))}
            empty="No searches yet."
          />
        </Card>

        <Card title="🔴 Zero-result searches — what to add">
          <RankList
            rows={s.zeroQueries.map((r) => ({ label: `“${r.term}”`, n: r.n }))}
            empty="None — every search returned results."
          />
        </Card>

        <Card title="Top search queries">
          <RankList
            rows={s.topQueries.map((r) => ({ label: `“${r.term}”`, n: r.n, meta: `avg ${r.avg}` }))}
            empty="No free-text searches yet."
          />
        </Card>

        <Card title="Most-viewed schemes">
          <RankList
            rows={s.topSchemes.map((r) => ({ label: r.name, n: r.n }))}
            empty="No scheme views logged yet."
          />
        </Card>

        <Card title="Most-viewed policies">
          <RankList
            rows={s.topPolicies.map((r) => ({ label: r.name, n: r.n }))}
            empty="No policy views logged yet."
          />
        </Card>
      </div>
    </Shell>
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

function Shell({ children, authed }: { children: React.ReactNode; authed?: boolean }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Analytics</h1>
        {authed && (
          <form action={logout}>
            <button type="submit" className="text-sm font-medium text-muted hover:text-ink">
              Lock
            </button>
          </form>
        )}
      </header>
      {children}
    </div>
  );
}
