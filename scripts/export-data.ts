/**
 * Export the database into reviewable, per-entity YAML files under data/.
 * This is the migration from imperative seed scripts → declarative data files
 * (the contributor-editable source of truth). Re-runnable: clears and rewrites
 * data/schemes + data/policies.
 *   npm run data:export
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { dump } from "js-yaml";
import { getPool, query } from "../lib/db";

const ROOT = join(__dirname, "..", "data");
const seenSlugs = new Set<string>();

function slug(name: string): string {
  let s = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  let candidate = s, n = 2;
  while (seenSlugs.has(candidate)) candidate = `${s}-${n++}`;
  seenSlugs.add(candidate);
  return candidate;
}

const YAML_OPTS = { lineWidth: 100, noRefs: true, sortKeys: false, quotingType: '"' as const };

/** Build an ordered object: required + facets always present; optional scalars only if set;
 *  arrays/refs only if non-empty. Keeps files consistent and template-like. */
function ordered(row: Record<string, unknown>, order: string[], always: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of order) {
    const v = row[k];
    if (always.has(k)) { out[k] = v ?? null; continue; }
    if (v === null || v === undefined) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

async function exportSchemes() {
  const dir = join(ROOT, "schemes");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const rows = await query<Record<string, unknown>>(
    `select s.*, d.name_en as dep_en, d.name_hi as dep_hi, d.website as dep_web,
            succ.name_en as succ_name
     from schemes s
     left join departments d on d.id = s.department_id
     left join schemes succ on succ.id = s.successor_scheme_id
     order by s.name_en`
  );

  const order = [
    "name_en", "name_hi", "department_en", "department_hi", "department_website",
    "categories", "launch_date", "objective_en", "objective_hi", "eligibility_en",
    "eligibility_hi", "benefit_type", "benefit_detail", "target_beneficiary",
    "personas", "education_levels", "gender_eligibility", "social_categories",
    "min_age", "max_age", "income_ceiling", "requires_bpl", "domicile",
    "is_for_disabled", "is_for_startups", "land_ownership",
    "status", "status_evidence", "last_budget_year", "last_notification_date",
    "source_url", "application_portal_url", "successor_scheme", "policies", "budget_allocations",
    "metrics",
  ];
  const always = new Set([
    "name_en", "categories", "personas", "education_levels", "gender_eligibility",
    "social_categories", "min_age", "max_age", "income_ceiling", "requires_bpl",
    "domicile", "is_for_disabled", "is_for_startups", "land_ownership",
    "status", "status_evidence", "source_url", "last_verified",
  ]);

  for (const r of rows) {
    const id = r.id as string;
    const policies = (await query<{ name_en: string }>(
      `select p.name_en from scheme_policy_links l join policies p on p.id = l.policy_id
       where l.scheme_id = $1 order by p.name_en`, [id]
    )).map((x) => x.name_en);
    const budget = await query<Record<string, unknown>>(
      `select fiscal_year, allocated_cr, revised_cr, source_url from budget_allocations
       where scheme_id = $1 order by fiscal_year`, [id]
    );
    const metrics = await query<Record<string, unknown>>(
      `select dimension, fiscal_year, label, value, unit, provenance, as_of_date, source_url, note
       from scheme_metrics where scheme_id = $1
       order by dimension, fiscal_year nulls first, label`, [id]
    );
    const flat: Record<string, unknown> = {
      ...r,
      department_en: r.dep_en, department_hi: r.dep_hi, department_website: r.dep_web,
      successor_scheme: r.succ_name ?? null,
      policies, budget_allocations: budget, metrics,
      last_verified: r.last_verified,
    };
    const obj = ordered(flat, [...order, "last_verified"], always);
    writeFileSync(join(dir, `${slug(r.name_en as string)}.yaml`), dump(obj, YAML_OPTS));
  }
  return rows.length;
}

async function exportPolicies() {
  const dir = join(ROOT, "policies");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const rows = await query<Record<string, unknown>>(
    `select p.*, d.name_en as dep_en, d.name_hi as dep_hi, d.website as dep_web,
            su.name_en as succ_name
     from policies p
     left join departments d on d.id = p.department_id
     left join policies su on su.id = p.superseded_by
     order by p.name_en`
  );
  const order = [
    "name_en", "name_hi", "department_en", "department_hi", "department_website",
    "summary_en", "summary_hi", "categories", "policy_type", "period_start", "period_end",
    "status", "successor_policy", "document_url", "is_draft", "consultation_url",
    "consultation_start", "consultation_end", "how_to_comment_en", "how_to_comment_hi",
    "source_url", "last_verified",
  ];
  const always = new Set(["name_en", "status", "is_draft", "source_url", "last_verified"]);

  for (const r of rows) {
    const flat: Record<string, unknown> = {
      ...r,
      department_en: r.dep_en, department_hi: r.dep_hi, department_website: r.dep_web,
      successor_policy: r.succ_name ?? null,
    };
    const obj = ordered(flat, order, always);
    writeFileSync(join(dir, `${slug(r.name_en as string)}.yaml`), dump(obj, YAML_OPTS));
  }
  return rows.length;
}

async function main() {
  mkdirSync(ROOT, { recursive: true });
  const s = await exportSchemes();
  seenSlugs.clear();
  const p = await exportPolicies();
  console.log(`Exported ${s} schemes → data/schemes/, ${p} policies → data/policies/`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await getPool().end(); });
