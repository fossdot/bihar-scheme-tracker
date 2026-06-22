import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Always answer 204 No Content — the beacon is fire-and-forget and must never surface an
// error to the visitor. Uncached (it's under /api, excluded from the edge cache + middleware).
const noContent = () =>
  new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });

// Derive locale + entity from the (public) path, e.g. /hi/schemes/<uuid> → {hi, scheme, uuid}.
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const DETAIL = new RegExp(`^/(en|hi)/(schemes|policies)/(${UUID})`);
const LOCALIZED = /^\/(en|hi)(\/|$)/; // only real localized routes are logged

// Best-effort per-IP rate limit so the open beacon can't be used to flood the table.
const hits = new Map<string, { n: number; resetAt: number }>();
function rateLimited(): boolean {
  const ip = (headers().get("cf-connecting-ip") || headers().get("x-forwarded-for") || "?").split(",")[0].trim();
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || e.resetAt < now) { hits.set(ip, { n: 1, resetAt: now + 60_000 }); return false; }
  e.n += 1;
  return e.n > 120; // >120 views/min from one IP → drop
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return noContent();
  try {
    const raw = await req.text();
    if (raw.length > 2048) return noContent(); // ignore oversized bodies
    const body = JSON.parse(raw) as { path?: unknown; event?: unknown; page?: unknown; total?: unknown };
    const path = typeof body.path === "string" ? body.path.slice(0, 512) : "";
    // Only log genuine localized routes — ignores junk/spam paths and bounds the data shape.
    if (!LOCALIZED.test(path) || rateLimited()) return noContent();

    // Finder pagination beacon: a deliberate move past page 1. Logged into search_events under
    // a 'paginate' surface (q = null, so it never pollutes query-term analytics) — tells us
    // whether people page deeper than the first 20 results. No schema change needed.
    if (body.event === "paginate") {
      const page = typeof body.page === "number" && Number.isFinite(body.page)
        ? Math.min(Math.max(2, Math.trunc(body.page)), 999) : null; // page 1 isn't a paginate click
      const total = typeof body.total === "number" && Number.isFinite(body.total)
        ? Math.min(Math.max(0, Math.trunc(body.total)), 100_000) : 0;
      if (page) {
        await query(
          `insert into search_events (surface, q, filters, result_count) values ('paginate', null, $1::jsonb, $2)`,
          [JSON.stringify({ page }), total],
        ).catch(() => {});
      }
      return noContent();
    }

    const detail = DETAIL.exec(path);
    const locale = LOCALIZED.exec(path)?.[1] ?? null;
    const entityType = detail ? (detail[2] === "schemes" ? "scheme" : "policy") : null;
    const entityId = detail ? detail[3] : null;

    // Parameterized — no injection. Best-effort: swallow errors (table may not exist yet).
    await query(
      `insert into page_views (path, locale, entity_type, entity_id) values ($1, $2, $3, $4)`,
      [path, locale, entityType, entityId],
    ).catch(() => {});
  } catch {
    /* malformed body — ignore */
  }
  return noContent();
}
