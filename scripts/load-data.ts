/**
 * Load the data/ YAML files into Postgres — the apply step after a PR merges.
 * Upserts by name_en so existing IDs (and therefore /schemes/<id> URLs) are PRESERVED;
 * new entries are inserted. Runs in a transaction. Then run `npm run data:dump` to
 * regenerate the baked deploy seed, and redeploy.
 *   npm run data:load
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { load } from "js-yaml";
import { getPool } from "../lib/db";

const ROOT = join(__dirname, "..", "data");
const PRUNE = process.argv.includes("--prune"); // delete DB rows no longer present in YAML
type Row = Record<string, any>;

type Q = (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;

// Flag (or, with --prune, remove) rows whose name_en is no longer backed by a YAML file.
async function reportOrphans(q: Q, table: string, present: Set<string>, prune: boolean) {
  const { rows } = await q(`select id, name_en from ${table}`);
  const orphans = rows.filter((r) => !present.has(r.name_en));
  if (!orphans.length) return;
  for (const o of orphans) {
    if (prune) {
      // Null inbound successor links first so the FK doesn't block the delete.
      if (table === "schemes") await q(`update schemes set successor_scheme_id = null where successor_scheme_id = $1`, [o.id]);
      if (table === "policies") await q(`update policies set superseded_by = null where superseded_by = $1`, [o.id]);
      await q(`delete from ${table} where id = $1`, [o.id]); // budget_allocations / links cascade
      console.log(`  ✗ pruned orphan ${table}: "${o.name_en}"`);
    } else {
      console.log(`  ⚠ orphan ${table} (in DB, no YAML): "${o.name_en}" — rerun with --prune to delete`);
    }
  }
}

function readDir(sub: string): Row[] {
  const dir = join(ROOT, sub);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map((f) => load(readFileSync(join(dir, f), "utf8")) as Row);
}

async function main() {
  const schemes = readDir("schemes");
  const policies = readDir("policies");
  const client = await getPool().connect();
  const q = (text: string, params: unknown[] = []) => client.query(text, params);

  async function upsert(table: string, cols: Record<string, unknown>): Promise<string> {
    const found = await q(`select id from ${table} where name_en = $1`, [cols.name_en]);
    const keys = Object.keys(cols);
    if (found.rows.length) {
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
      await q(`update ${table} set ${sets} where id = $1`, [found.rows[0].id, ...keys.map((k) => cols[k])]);
      return found.rows[0].id;
    }
    const ph = keys.map((_, i) => `$${i + 1}`).join(", ");
    const r = await q(`insert into ${table} (${keys.join(", ")}) values (${ph}) returning id`, keys.map((k) => cols[k]));
    return r.rows[0].id;
  }

  try {
    await q("BEGIN");

    // 1. Departments (deduped from both schemes + policies), keyed by name_en.
    const deptId = new Map<string, string>();
    for (const r of [...schemes, ...policies]) {
      const name = r.department_en;
      if (!name || deptId.has(name)) continue;
      deptId.set(name, await upsert("departments", {
        name_en: name, name_hi: r.department_hi ?? null, website: r.department_website ?? null,
      }));
    }

    // 2. Policies (without successor link yet), keyed by name_en.
    const policyId = new Map<string, string>();
    for (const p of policies) {
      policyId.set(p.name_en, await upsert("policies", {
        name_en: p.name_en, name_hi: p.name_hi ?? null,
        department_id: p.department_en ? deptId.get(p.department_en) ?? null : null,
        summary_en: p.summary_en ?? null, summary_hi: p.summary_hi ?? null,
        categories: p.categories ?? [], policy_type: p.policy_type ?? null,
        period_start: p.period_start ?? null, period_end: p.period_end ?? null,
        status: p.status ?? "unknown", document_url: p.document_url ?? null,
        is_draft: p.is_draft ?? false, consultation_url: p.consultation_url ?? null,
        consultation_start: p.consultation_start ?? null, consultation_end: p.consultation_end ?? null,
        how_to_comment_en: p.how_to_comment_en ?? null, how_to_comment_hi: p.how_to_comment_hi ?? null,
        source_url: p.source_url, last_verified: p.last_verified,
      }));
    }
    // 2b. Policy successor links.
    for (const p of policies) {
      if (p.successor_policy && policyId.has(p.successor_policy))
        await q(`update policies set superseded_by = $2 where id = $1`, [policyId.get(p.name_en), policyId.get(p.successor_policy)]);
    }

    // 3. Schemes (without successor link yet), keyed by name_en — IDs preserved.
    const schemeId = new Map<string, string>();
    for (const s of schemes) {
      schemeId.set(s.name_en, await upsert("schemes", {
        name_en: s.name_en, name_hi: s.name_hi ?? null,
        department_id: s.department_en ? deptId.get(s.department_en) ?? null : null,
        categories: s.categories ?? [], launch_date: s.launch_date ?? null,
        objective_en: s.objective_en ?? null, objective_hi: s.objective_hi ?? null,
        eligibility_en: s.eligibility_en ?? null, eligibility_hi: s.eligibility_hi ?? null,
        benefit_type: s.benefit_type ?? null, benefit_detail: s.benefit_detail ?? null,
        target_beneficiary: s.target_beneficiary ?? null,
        personas: s.personas ?? [], education_levels: s.education_levels ?? [],
        gender_eligibility: s.gender_eligibility ?? "any", social_categories: s.social_categories ?? [],
        min_age: s.min_age ?? null, max_age: s.max_age ?? null, income_ceiling: s.income_ceiling ?? null,
        requires_bpl: s.requires_bpl ?? false, domicile: s.domicile ?? "bihar",
        is_for_disabled: s.is_for_disabled ?? false, is_for_startups: s.is_for_startups ?? false,
        land_ownership: s.land_ownership ?? null, application_portal_url: s.application_portal_url ?? null,
        status: s.status, status_evidence: s.status_evidence,
        last_budget_year: s.last_budget_year ?? null, last_notification_date: s.last_notification_date ?? null,
        source_url: s.source_url, last_verified: s.last_verified,
      }));
    }
    // 3b. Scheme successor links.
    for (const s of schemes) {
      if (s.successor_scheme && schemeId.has(s.successor_scheme))
        await q(`update schemes set successor_scheme_id = $2 where id = $1`, [schemeId.get(s.name_en), schemeId.get(s.successor_scheme)]);
    }

    // 4. Budget allocations + policy links: replace per scheme (idempotent).
    for (const s of schemes) {
      const id = schemeId.get(s.name_en)!;
      await q(`delete from budget_allocations where scheme_id = $1`, [id]);
      for (const b of s.budget_allocations ?? [])
        await q(`insert into budget_allocations (scheme_id, fiscal_year, allocated_cr, revised_cr, source_url) values ($1,$2,$3,$4,$5)`,
          [id, b.fiscal_year, b.allocated_cr ?? null, b.revised_cr ?? null, b.source_url]);
      await q(`delete from scheme_policy_links where scheme_id = $1`, [id]);
      for (const pn of s.policies ?? [])
        if (policyId.has(pn)) await q(`insert into scheme_policy_links (scheme_id, policy_id) values ($1,$2) on conflict do nothing`, [id, policyId.get(pn)]);
    }

    // 5. Orphans: rows in the DB whose YAML file was renamed/deleted. The upsert path
    //    never removes them, so a deleted scheme would otherwise linger (and keep serving
    //    a stale /schemes/<id> page). Report by default; delete only with --prune.
    await reportOrphans(q, "schemes", new Set(schemeId.keys()), PRUNE);
    await reportOrphans(q, "policies", new Set(policyId.keys()), PRUNE);

    await q("COMMIT");
    console.log(`Loaded ${schemes.length} schemes, ${policies.length} policies, ${deptId.size} departments.`);
  } catch (e) {
    await q("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await getPool().end(); });
