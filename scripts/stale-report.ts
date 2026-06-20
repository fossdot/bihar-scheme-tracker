/**
 * Freshness report — the re-verification queue. Lists schemes + policies by how long since
 * they were last verified (stalest first), so re-verification is targeted, not guesswork.
 * The project is "designed for staleness": run this on a cadence (e.g. quarterly), then re-run
 * the verification pass on the entries at the top.
 *   npm run data:stale            (all, stalest first)
 *   npm run data:stale -- 180     (only those older than N days)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const STALE_DAYS = 365; // matches lib/dates isStale — the hard "outdated" line
const DUE_DAYS = 180; // soft "due for review"

function age(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso + "T00:00:00Z").getTime();
  return Math.floor((Date.now() - then) / 86_400_000);
}
function band(days: number | null): string {
  if (days == null) return "  never";
  if (days >= STALE_DAYS) return "🔴 STALE";
  if (days >= DUE_DAYS) return "🟠 due  ";
  return "🟢 fresh";
}

async function main() {
  const minDays = Number(process.argv[2]) || 0;
  const rows = await query<{ kind: string; name_en: string; status: string; last_verified: string | null }>(
    `select 'scheme' as kind, name_en, status::text, last_verified::text from schemes
     union all
     select 'policy' as kind, name_en, status::text, last_verified::text from policies`
  );
  const ranked = rows
    .map((r) => ({ ...r, days: age(r.last_verified) }))
    .filter((r) => (r.days ?? Number.MAX_SAFE_INTEGER) >= minDays)
    .sort((a, b) => (b.days ?? 1e9) - (a.days ?? 1e9));

  const stale = ranked.filter((r) => (r.days ?? 1e9) >= STALE_DAYS).length;
  const due = ranked.filter((r) => (r.days ?? 1e9) >= DUE_DAYS && (r.days ?? 1e9) < STALE_DAYS).length;

  console.log(`Freshness report — ${ranked.length} entries${minDays ? ` older than ${minDays} days` : ""}`);
  console.log(`  🔴 stale (>${STALE_DAYS}d): ${stale}   🟠 due (>${DUE_DAYS}d): ${due}\n`);
  for (const r of ranked) {
    const d = r.days == null ? "  —  " : `${String(r.days).padStart(4)}d`;
    console.log(`${band(r.days)}  ${d}  ${r.kind.padEnd(6)} ${r.name_en}`);
  }
  if (!stale && !due) console.log("\n✓ Everything is fresh.");
  else console.log(`\nNext: re-verify the entries above (rerun the verification pass), then update status_evidence + last_verified.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await getPool().end(); });
