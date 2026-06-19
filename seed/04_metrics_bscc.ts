/**
 * Research-mode metrics — Bihar Student Credit Card Scheme (2026-06-19).
 * The first scheme given a full "Data & impact" series, sourced WITHOUT RTI from public
 * reporting. Run after seed.ts + 02_verify.ts.
 *
 *   npm run seed:metrics -- --dry-run
 *   npm run seed:metrics
 *
 * Principles held (CLAUDE.md):
 *   - Every value carries its provenance + source. These BSCC figures are 'reported'
 *     (a credible news report of a Finance/Education Dept proposal), NOT verified BE/RE —
 *     flagged so, to be cross-checked against budget.bihar.gov.in before any upgrade.
 *   - What is NOT published gets an honest dimension marker (provenance 'rti_needed',
 *     value NULL) so the page shows "RTI needed", never a fabricated number.
 *
 * Source: https://www.thedailyjagran.com/bihar/bihar-student-credit-card-scheme-2025-26-education-dept-plans-to-disburse-rs-1013-crore-loan-to-127-lakh-students-10247736
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getPool, query } from "../lib/db";

const SCHEME = "Bihar Student Credit Card Scheme";
const SRC =
  "https://www.thedailyjagran.com/bihar/bihar-student-credit-card-scheme-2025-26-education-dept-plans-to-disburse-rs-1013-crore-loan-to-127-lakh-students-10247736";
const AS_OF = "2026-06-19";

type Row = {
  dimension: string;
  fiscal_year: string | null;
  label: string | null;
  value: number | null;
  unit: string | null;
  provenance: string;
  note: string | null;
};

const ROWS: Row[] = [
  // ── Budget / disbursement (₹ crore) ──
  {
    dimension: "budget",
    fiscal_year: "2024-25",
    label: "disbursed",
    value: 1715.23,
    unit: "cr",
    provenance: "reported",
    note: "Loans disbursed to 80,236 students (news report; cross-check vs budget.bihar.gov.in).",
  },
  {
    dimension: "budget",
    fiscal_year: "2025-26",
    label: "sanctioned",
    value: 1013.23,
    unit: "cr",
    provenance: "reported",
    note: "Finance Dept sanction on Education Dept proposal to reach 1.27 lakh students.",
  },
  // ── Beneficiaries (persons) ──
  {
    dimension: "beneficiaries",
    fiscal_year: "2024-25",
    label: "students",
    value: 80236,
    unit: "persons",
    provenance: "reported",
    note: "Students who received loans in FY2024-25.",
  },
  {
    dimension: "beneficiaries",
    fiscal_year: "2025-26",
    label: "target",
    value: 127000,
    unit: "persons",
    provenance: "reported",
    note: "Planned/target students for FY2025-26 (1.27 lakh).",
  },
  // ── Honest gaps: not published → RTI required (value NULL drives the provenance panel) ──
  {
    dimension: "district",
    fiscal_year: null,
    label: null,
    value: null,
    unit: null,
    provenance: "rti_needed",
    note: "District-wise disbursement / sanction not published. Needs an RTI to DRCC / Education Dept.",
  },
  {
    dimension: "demographics",
    fiscal_year: null,
    label: null,
    value: null,
    unit: null,
    provenance: "rti_needed",
    note: "Breakdown by social category / gender not published. Needs an RTI.",
  },
  {
    dimension: "outcomes",
    fiscal_year: null,
    label: null,
    value: null,
    unit: null,
    provenance: "rti_needed",
    note: "Course-completion and loan-repayment outcomes not published. Needs an RTI.",
  },
];

const COLS = ["dimension", "fiscal_year", "label", "value", "unit", "provenance", "as_of_date", "source_url", "note"];
const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log("DRY RUN — no DB write.\n");
    ROWS.forEach((r) => console.log(JSON.stringify(r)));
    return;
  }

  const [scheme] = await query<{ id: string }>(
    `select id from schemes where name_en = $1`,
    [SCHEME]
  );
  if (!scheme) {
    console.error(`!! scheme not found: "${SCHEME}" — run seed.ts first.`);
    process.exitCode = 1;
    return;
  }

  // Idempotent: clear this scheme's metrics, then reinsert (the seed is the source of truth).
  await query(`delete from scheme_metrics where scheme_id = $1`, [scheme.id]);

  const placeholders = COLS.map((_, i) => `$${i + 2}`).join(", "); // $1 = scheme_id
  for (const r of ROWS) {
    await query(
      `insert into scheme_metrics (scheme_id, ${COLS.join(", ")})
       values ($1, ${placeholders})`,
      [scheme.id, r.dimension, r.fiscal_year, r.label, r.value, r.unit, r.provenance, AS_OF, SRC, r.note]
    );
  }
  console.log(`Inserted ${ROWS.length} metric rows for ${SCHEME} (${scheme.id}).`);
}

main()
  .catch((err) => {
    console.error("Metrics seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!isDryRun) await getPool().end();
  });
