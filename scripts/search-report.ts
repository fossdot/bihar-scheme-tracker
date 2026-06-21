/**
 * What people are searching for — the demand signal that tells us what data to add.
 * Reads the search_events log. The headline is ZERO-RESULT searches: queries/profiles that
 * returned nothing are exactly the schemes/keywords people want and we don't have.
 *   npm run data:searches            (last 30 days)
 *   npm run data:searches -- 7       (last N days)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

async function main() {
  const days = Number(process.argv[2]) || 30;
  const since = `now() - interval '${days} days'`;

  const [{ total }] = await query<{ total: string }>(
    `select count(*)::text as total from search_events where created_at >= ${since}`
  );
  console.log(`\nSearch activity — last ${days} days: ${total} searches\n`);
  if (Number(total) === 0) {
    console.log("(no searches logged yet — share the site and check back)");
    return;
  }

  console.log("── by surface ──");
  for (const r of await query<{ surface: string; n: string; zero: string }>(
    `select surface, count(*)::text n, count(*) filter (where result_count = 0)::text zero
       from search_events where created_at >= ${since} group by surface order by count(*) desc`
  )) console.log(`  ${r.surface.padEnd(8)} ${r.n.padStart(5)} searches · ${r.zero} returned 0`);

  console.log("\n── top free-text queries ──");
  const topq = await query<{ q: string; n: string; avg: string }>(
    `select lower(q) q, count(*)::text n, round(avg(result_count))::text avg
       from search_events where created_at >= ${since} and q is not null
       group by lower(q) order by count(*) desc limit 20`
  );
  if (topq.length) topq.forEach((r) => console.log(`  ${r.n.padStart(4)}×  "${r.q}"  (avg ${r.avg} results)`));
  else console.log("  (none)");

  console.log("\n🔴 ZERO-RESULT free-text searches (what to add / alias) ──");
  const zeroq = await query<{ q: string; n: string }>(
    `select lower(q) q, count(*)::text n from search_events
       where created_at >= ${since} and q is not null and result_count = 0
       group by lower(q) order by count(*) desc limit 25`
  );
  if (zeroq.length) zeroq.forEach((r) => console.log(`  ${r.n.padStart(4)}×  "${r.q}"`));
  else console.log("  ✓ none — every free-text search returned something");

  console.log("\n🔴 ZERO-RESULT eligibility profiles (finder/guided) ──");
  const zerof = await query<{ filters: unknown; n: string }>(
    `select filters, count(*)::text n from search_events
       where created_at >= ${since} and q is null and result_count = 0 and filters <> '{}'::jsonb
       group by filters order by count(*) desc limit 20`
  );
  if (zerof.length) zerof.forEach((r) => console.log(`  ${r.n.padStart(4)}×  ${JSON.stringify(r.filters)}`));
  else console.log("  ✓ none — every eligibility profile matched at least one scheme");
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await getPool().end(); });
