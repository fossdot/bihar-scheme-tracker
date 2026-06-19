/**
 * Budget allocations (2026-06-19) — the project's status "spine". First REAL scheme-line figures.
 *
 * Source reality: Bihar's own Demands_For_Grants / detailed-estimates PDFs on budget.bihar.gov.in
 * carry NO text layer (text is rendered as vector paths → not machine-extractable without OCR of
 * Hindi budget tables, which would risk wrong digits). So scheme-line figures here come from PRS
 * Legislative Research's Bihar Budget Analysis (2025-26 & 2026-27), which cites the official Bihar
 * Budget Documents and itemises select schemes' Budget Estimates. Only schemes whose names map
 * cleanly to a PRS scheme call-out are seeded — umbrella heads (e.g. "Mahila Sashaktikaran",
 * "Power subsidy", "Agricultural Mechanisation") are deliberately NOT attributed to any one scheme.
 *
 * A current-FY budget line is the strongest "active" signal → matched schemes move likely_active → active.
 *   npm run seed:budget [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const SRC25 = "https://prsindia.org/files/budget/budget_state/bihar/2025/Bihar_Budget_Analysis_2025-26.pdf";
const SRC26 = "https://prsindia.org/files/budget/budget_state/bihar/2026/Budget_Analysis_2026-27-Bihar.pdf";

type Alloc = { fiscal_year: string; allocated_cr: number; source_url: string };
type Entry = { name_en: string; allocs: Alloc[]; last_budget_year: string; evidence: string };

const ENTRIES: Entry[] = [
  {
    name_en: "MGNREGA (Bihar)",
    allocs: [
      { fiscal_year: "2025-26", allocated_cr: 4392, source_url: SRC25 },
      { fiscal_year: "2026-27", allocated_cr: 3192, source_url: SRC26 },
    ],
    last_budget_year: "2026-27",
    evidence:
      `Active — scheme budget line confirmed two years running: ₹4,392 cr (2025-26 BE) and ₹3,192 cr (2026-27 BE), from the Bihar Budget Documents as itemised by PRS Legislative Research. A current-fiscal-year allocation is present. Verified ${ON}.`,
  },
  {
    name_en: "Pradhan Mantri Awas Yojana — Urban (PMAY-U)",
    allocs: [
      { fiscal_year: "2025-26", allocated_cr: 2355, source_url: SRC25 },
      { fiscal_year: "2026-27", allocated_cr: 2842, source_url: SRC26 },
    ],
    last_budget_year: "2026-27",
    evidence:
      `Active — budget line ₹2,355 cr (2025-26 BE) rising to ₹2,842 cr (2026-27 BE) under Urban Development, per the Bihar Budget Documents (PRS analysis). A current-fiscal-year allocation is present. Verified ${ON}.`,
  },
  {
    name_en: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)",
    allocs: [{ fiscal_year: "2025-26", allocated_cr: 4320, source_url: SRC25 }],
    last_budget_year: "2025-26",
    evidence:
      `Active — budget line ₹4,320 cr (2025-26 BE) under Rural Development, per the Bihar Budget Documents (PRS analysis). The 2026-27 PRS analysis does not separately itemise PMAY-G, so the latest confirmed line is 2025-26. Verified ${ON}.`,
  },
  {
    name_en: "Mukhyamantri Vridhjan Pension Yojana",
    allocs: [{ fiscal_year: "2025-26", allocated_cr: 828, source_url: SRC25 }],
    last_budget_year: "2025-26",
    evidence:
      `Active — budget line ₹828 cr (2025-26 BE) for the Mukhyamantri Vriddhjan Pension Yojana under Social Welfare, per the Bihar Budget Documents (PRS analysis). Latest confirmed line is 2025-26. Verified ${ON}.`,
  },
];

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log("DRY RUN");
    ENTRIES.forEach((e) => console.log(` ${e.name_en}: ${e.allocs.map((a) => `${a.fiscal_year} ₹${a.allocated_cr}cr`).join(", ")} → active`));
    return;
  }
  let alloc = 0, upd = 0;
  for (const e of ENTRIES) {
    const rows = await query<{ id: string }>(`select id from schemes where name_en=$1`, [e.name_en]);
    if (!rows.length) { console.log(`! not found: ${e.name_en}`); continue; }
    const id = rows[0].id;
    for (const a of e.allocs) {
      const exists = await query(`select 1 from budget_allocations where scheme_id=$1 and fiscal_year=$2`, [id, a.fiscal_year]);
      if (exists.length) { console.log(`  skip alloc (exists): ${e.name_en} ${a.fiscal_year}`); continue; }
      await query(
        `insert into budget_allocations (scheme_id, fiscal_year, allocated_cr, source_url) values ($1,$2,$3,$4)`,
        [id, a.fiscal_year, a.allocated_cr, a.source_url],
      );
      console.log(`  + alloc: ${e.name_en} ${a.fiscal_year} ₹${a.allocated_cr}cr`); alloc++;
    }
    await query(
      `update schemes set status='active', status_evidence=$2, last_budget_year=$3, last_verified=$4, source_url=coalesce(source_url,$5) where id=$1`,
      [id, e.evidence, e.last_budget_year, ON, SRC25],
    );
    console.log(`  ~ status→active: ${e.name_en} (last_budget_year ${e.last_budget_year})`); upd++;
  }
  console.log(`\nDone. ${alloc} allocations, ${upd} schemes → active.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
