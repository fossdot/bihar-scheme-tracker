import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

// Uncached analytics API behind the admin gate. The /admin PAGE is a data-free shell (safe
// for the CDN to cache); all auth state + data come from here, which never travels as
// cacheable HTML — so the gate can't be defeated by any CDN cache configuration.
export const dynamic = "force-dynamic";

const COOKIE = "bst_admin";
const noStore = { "cache-control": "no-store" };

function adminKey(): string | null {
  const k = process.env.ADMIN_KEY;
  return k && k.length >= 8 ? k : null; // unset / too weak → stays locked
}
function authed(): boolean {
  const k = adminKey();
  return !!k && cookies().get(COOKIE)?.value === k;
}

const DAYS = 30;
const SINCE = `now() - interval '${DAYS} days'`;
const q = <T,>(sql: string) => query<T>(sql).catch(() => [] as T[]);

async function loadStats() {
  const [searchTotal, bySurface, topQueries, zeroQueries, viewTotal, topSchemes, topPolicies] =
    await Promise.all([
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
    days: DAYS,
    searchTotal: searchTotal[0]?.n ?? "0",
    viewTotal: viewTotal[0]?.n ?? "0",
    bySurface,
    topQueries,
    zeroQueries,
    topSchemes,
    topPolicies,
  };
}

// GET → stats if authed; 401 otherwise. 503 if the key isn't configured.
export async function GET() {
  if (!adminKey()) return NextResponse.json({ error: "not_configured" }, { status: 503, headers: noStore });
  if (!authed()) return NextResponse.json({ authed: false }, { status: 401, headers: noStore });
  const stats = await loadStats();
  return NextResponse.json({ authed: true, stats }, { headers: noStore });
}

// POST { key } → sets the gate cookie on a match.
export async function POST(req: NextRequest) {
  const k = adminKey();
  if (!k) return NextResponse.json({ error: "not_configured" }, { status: 503, headers: noStore });
  const supplied = await req.json().then((b) => String(b?.key ?? "")).catch(() => "");
  if (supplied !== k) return NextResponse.json({ authed: false }, { status: 401, headers: noStore });
  const res = NextResponse.json({ authed: true }, { headers: noStore });
  // path "/" so the cookie reaches /api/admin (a /admin-scoped cookie wouldn't be sent there).
  res.cookies.set(COOKIE, k, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}

// DELETE → log out.
export async function DELETE() {
  const res = NextResponse.json({ authed: false }, { headers: noStore });
  res.cookies.set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
