/**
 * Load data/education-spend/*.yaml into the standalone `education.*` Postgres schema.
 * Agencies + funding_programmes are upserted by name_en (IDs preserved); the join/fact tables
 * (programme_agencies, programme_allocations, expenditure_lines, audit_findings) are rebuilt
 * from the YAML each run. Registry links (agency.department_en → departments, programme.scheme_en
 * → schemes) are resolved as SOFT, FK-less lookups; unknown names simply resolve to null.
 * Runs in one transaction.
 *   npm run data:load-education
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { load } from "js-yaml";
import { getPool } from "../lib/db";

const DIR = join(__dirname, "..", "data", "education-spend");
const readYaml = (f: string): any[] => {
  const p = join(DIR, f);
  return existsSync(p) ? ((load(readFileSync(p, "utf8")) ?? []) as any[]) : [];
};

async function main() {
  const agencies = readYaml("agencies.yaml");
  const programmes = readYaml("programmes.yaml");
  const audits = readYaml("audits.yaml");

  const client = await getPool().connect();
  const q = (text: string, params: unknown[] = []) => client.query(text, params);

  async function upsert(table: string, cols: Record<string, unknown>): Promise<string> {
    const found = await q(`select id from education.${table} where name_en = $1`, [cols.name_en]);
    const keys = Object.keys(cols);
    if (found.rows.length) {
      const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
      await q(`update education.${table} set ${sets} where id = $1`, [found.rows[0].id, ...keys.map((k) => cols[k])]);
      return found.rows[0].id;
    }
    const ph = keys.map((_, i) => `$${i + 1}`).join(", ");
    const r = await q(`insert into education.${table} (${keys.join(", ")}) values (${ph}) returning id`, keys.map((k) => cols[k]));
    return r.rows[0].id;
  }
  // Soft, FK-less registry lookups (public schema). Unknown name → null.
  async function softId(table: string, name?: string | null): Promise<string | null> {
    if (!name) return null;
    const r = await q(`select id from ${table} where name_en = $1`, [name]);
    return r.rows.length ? r.rows[0].id : null;
  }

  try {
    await q("BEGIN");

    // 1. Agencies — insert/upsert without parent first, then wire parent + soft department link.
    const agencyId = new Map<string, string>();
    for (const a of agencies) {
      agencyId.set(a.name_en, await upsert("agencies", {
        name_en: a.name_en, name_hi: a.name_hi ?? null, abbrev: a.abbrev ?? null,
        agency_type: a.agency_type, website: a.website ?? null,
        source_url: a.source_url, last_verified: a.last_verified ?? null,
        note_en: a.note_en ?? null, note_hi: a.note_hi ?? null,
      }));
    }
    for (const a of agencies) {
      const parent = a.parent ? agencyId.get(a.parent) ?? null : null;
      const dept = await softId("departments", a.department_en);
      await q(`update education.agencies set parent_agency_id = $2, department_id = $3 where id = $1`,
        [agencyId.get(a.name_en), parent, dept]);
    }

    // 2. Funding programmes — upsert; then wire parent + soft scheme link.
    const progId = new Map<string, string>();
    for (const p of programmes) {
      progId.set(p.name_en, await upsert("funding_programmes", {
        name_en: p.name_en, name_hi: p.name_hi ?? null, funding_source: p.funding_source,
        centre_share_pct: p.centre_share_pct ?? null, state_share_pct: p.state_share_pct ?? null,
        source_url: p.source_url, last_verified: p.last_verified ?? null,
        note_en: p.note_en ?? null, note_hi: p.note_hi ?? null,
      }));
    }
    for (const p of programmes) {
      const parent = p.parent_programme ? progId.get(p.parent_programme) ?? null : null;
      const scheme = await softId("schemes", p.scheme_en);
      await q(`update education.funding_programmes set parent_programme_id = $2, scheme_id = $3 where id = $1`,
        [progId.get(p.name_en), parent, scheme]);
    }

    // District reference map (seeded in the migration).
    const districtId = new Map<string, string>();
    for (const d of (await q(`select id, name_en from education.districts`)).rows) districtId.set(d.name_en, d.id);
    const distOf = (n?: string | null) => (n ? districtId.get(n) ?? null : null);
    const agOf = (n?: string | null) => (n ? agencyId.get(n) ?? null : null);

    // 3. Rebuild join + fact tables from YAML (idempotent full replace of the module's facts).
    await q(`delete from education.programme_agencies`);
    await q(`delete from education.expenditure_lines`);
    await q(`delete from education.programme_allocations`);
    await q(`delete from education.audit_findings`);

    let nRoles = 0, nAlloc = 0, nLines = 0;
    for (const p of programmes) {
      const pid = progId.get(p.name_en)!;
      for (const r of p.agencies ?? []) {
        await q(`insert into education.programme_agencies (programme_id, agency_id, role, note_en) values ($1,$2,$3,$4)
                 on conflict (programme_id, agency_id, role) do nothing`, [pid, agOf(r.agency), r.role, r.note_en ?? null]);
        nRoles++;
      }
      for (const a of p.allocations ?? []) {
        await q(`insert into education.programme_allocations
          (programme_id, agency_id, fiscal_year, district_id,
           approved_cr, approved_provenance, approved_source_url, approved_source_doc,
           released_cr, released_centre_cr, released_state_cr, released_provenance, released_source_url, released_source_doc,
           spent_cr, spent_provenance, spent_source_url, spent_source_doc,
           as_of_date, last_verified, note_en, note_hi)
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
          [pid, agOf(a.agency), a.fiscal_year, distOf(a.district),
           a.approved_cr ?? null, a.approved_provenance ?? null, a.approved_source_url ?? null, a.approved_source_doc ?? null,
           a.released_cr ?? null, a.released_centre_cr ?? null, a.released_state_cr ?? null, a.released_provenance ?? null, a.released_source_url ?? null, a.released_source_doc ?? null,
           a.spent_cr ?? null, a.spent_provenance ?? null, a.spent_source_url ?? null, a.spent_source_doc ?? null,
           a.as_of_date ?? null, a.last_verified, a.note_en ?? null, a.note_hi ?? null]);
        nAlloc++;
      }
      for (const e of p.expenditure_lines ?? []) {
        await q(`insert into education.expenditure_lines
          (programme_id, agency_id, fiscal_year, district_id, category, education_stage, beneficiary_type,
           approved_cr, approved_provenance, approved_source_url, approved_source_doc,
           spent_cr, spent_provenance, spent_source_url, spent_source_doc,
           as_of_date, last_verified, note_en, note_hi)
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
          [pid, agOf(e.agency), e.fiscal_year, distOf(e.district), e.category,
           e.education_stage ?? "not_applicable", e.beneficiary_type ?? "not_applicable",
           e.approved_cr ?? null, e.approved_provenance ?? null, e.approved_source_url ?? null, e.approved_source_doc ?? null,
           e.spent_cr ?? null, e.spent_provenance ?? null, e.spent_source_url ?? null, e.spent_source_doc ?? null,
           e.as_of_date ?? null, e.last_verified, e.note_en ?? null, e.note_hi ?? null]);
        nLines++;
      }
    }

    for (const a of audits) {
      await q(`insert into education.audit_findings
        (source_type, report_ref, programme_id, agency_id, district_id, fiscal_years, finding_en, finding_hi,
         amount_flagged_cr, report_date, provenance, source_url, source_doc, last_verified)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [a.source_type, a.report_ref ?? null, a.programme ? progId.get(a.programme) ?? null : null,
         a.agency ? agencyId.get(a.agency) ?? null : null, distOf(a.district), a.fiscal_years ?? null,
         a.finding_en, a.finding_hi ?? null, a.amount_flagged_cr ?? null, a.report_date ?? null,
         a.provenance, a.source_url, a.source_doc ?? null, a.last_verified ?? null]);
    }

    await q("COMMIT");
    console.log(`Loaded ${agencyId.size} agencies, ${progId.size} programmes, ${nRoles} agency-roles, ${nAlloc} allocations, ${nLines} expenditure lines, ${audits.length} audit findings.`);
  } catch (e) {
    await q("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await getPool().end(); });
