/**
 * Public metrics (2026-06-21) — beneficiary counts + disbursement/budget figures sourced from
 * PUBLIC references (PIB, govt portals/dashboards, newsonair, reputable news) via a research pass.
 * Bihar-specific where available; otherwise the figure is national and the label says so. Nothing
 * estimated — every row carries a source_url + as_of date + provenance (published = official,
 * reported = news). Schemes with no sourceable public figure are left honest-empty (NOT fabricated).
 *
 * Populates scheme_metrics → the scheme page "Data & impact" panel shows real series instead of
 * "Public · to add". Idempotent per (scheme, dimension, fiscal_year).
 *   npm run seed:metrics-public [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

type M = {
  scheme: string; dimension: "beneficiaries" | "budget"; fiscal_year: string;
  label: string; value: number; unit: string; scope: "Bihar" | "National";
  provenance: "published" | "reported"; as_of: string | null; source: string; note?: string;
};

const ROWS: M[] = [
  // ── beneficiaries / coverage ──
  { scheme: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)", dimension: "beneficiaries", fiscal_year: "2024-25", label: "Bihar farmers (19th instalment)", value: 7637000, unit: "persons", scope: "Bihar", provenance: "reported", as_of: "2025-02-24", source: "https://www.newsonair.gov.in/pm-modi-to-release-19th-pm-kisan-installment-%E2%82%B922000-cr-to-benefit-9-8-crore-farmers", note: "~76.37 lakh Bihar farmers in the 19th instalment (national: 9.8 cr)." },
  { scheme: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)", dimension: "budget", fiscal_year: "2024-25", label: "Bihar — 19th instalment", value: 1591, unit: "cr", scope: "Bihar", provenance: "reported", as_of: "2025-02-24", source: "https://www.newsonair.gov.in/pm-modi-to-release-19th-pm-kisan-installment-%E2%82%B922000-cr-to-benefit-9-8-crore-farmers" },
  { scheme: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)", dimension: "beneficiaries", fiscal_year: "2023-24", label: "Bihar houses completed (cumulative)", value: 2894000, unit: "houses", scope: "Bihar", provenance: "reported", as_of: "2026-02-27", source: "https://www.etvbharat.com/en/state/cag-flags-irregularities-in-housing-and-health-schemes-in-bihar-enn26022704136", note: "Cumulative 2017-18→2023-24 per CAG: 30.67 lakh sanctioned, 28.94 lakh completed." },
  { scheme: "Pradhan Mantri Awas Yojana — Urban (PMAY-U)", dimension: "beneficiaries", fiscal_year: "2025-26", label: "India houses sanctioned (since launch)", value: 16400000, unit: "houses", scope: "National", provenance: "reported", as_of: "2026-01-29", source: "https://www.newsonair.gov.in/over-1-64-crore-houses-sanctioned-under-pmay-urban-since-launch-govt", note: "National; no clean Bihar-only figure sourced." },
  { scheme: "Pradhan Mantri Ujjwala Yojana (PMUY)", dimension: "beneficiaries", fiscal_year: "2024-25", label: "India LPG connections", value: 103300000, unit: "connections", scope: "National", provenance: "published", as_of: "2025-03-01", source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=154355&ModuleId=3", note: "National (Lok Sabha reply, 10.33 cr)." },
  { scheme: "PM POSHAN (Mid-Day Meal)", dimension: "beneficiaries", fiscal_year: "2024-25", label: "India students covered", value: 110000000, unit: "students", scope: "National", provenance: "reported", as_of: "2025-07-28", source: "https://www.newsonair.gov.in/govt-provides-nutritious-meals-to-nearly-11cr-students-informs-state-education-minister-to-ls", note: "National (~11 cr children)." },
  { scheme: "Ayushman Bharat — PM-JAY", dimension: "beneficiaries", fiscal_year: "2024-25", label: "Bihar Ayushman cards", value: 28300000, unit: "persons", scope: "Bihar", provenance: "reported", as_of: "2025-06-10", source: "https://theprint.in/health/how-bihar-is-ramping-up-ab-pmjay-heath-infra-to-keep-patients-from-turning-to-delhi-vellore/2651718/", note: "2.83 cr cards created in Bihar (2024); 7.5 lakh hospital admissions in 2024-25." },
  { scheme: "Ayushman Bharat — PM-JAY", dimension: "budget", fiscal_year: "2024-25", label: "Bihar PM-JAY spend", value: 1010, unit: "cr", scope: "Bihar", provenance: "reported", as_of: "2025-06-10", source: "https://theprint.in/health/how-bihar-is-ramping-up-ab-pmjay-heath-infra-to-keep-patients-from-turning-to-delhi-vellore/2651718/" },
  { scheme: "Pradhan Mantri Jan Dhan Yojana (PMJDY)", dimension: "beneficiaries", fiscal_year: "2025-26", label: "India accounts", value: 580600000, unit: "accounts", scope: "National", provenance: "reported", as_of: "2026-04-08", source: "https://www.uniindia.com/news/business-economy/economy-jan-dhan-account-data/3821744.html", note: "National (~58.06 cr accounts)." },
  { scheme: "Pradhan Mantri Jan Dhan Yojana (PMJDY)", dimension: "budget", fiscal_year: "2025-26", label: "India deposits", value: 307000, unit: "cr", scope: "National", provenance: "reported", as_of: "2026-04-08", source: "https://www.uniindia.com/news/business-economy/economy-jan-dhan-account-data/3821744.html" },
  { scheme: "e-Shram (Unorganised Workers Registration)", dimension: "beneficiaries", fiscal_year: "2025-26", label: "Bihar workers registered", value: 29588748, unit: "persons", scope: "Bihar", provenance: "reported", as_of: "2025-07-31", source: "https://www.medianama.com/2026/01/223-maharashtra-e-shram-platform-workers-small-states-lag/", note: "Ministry of Labour data (~2.96 cr registered in Bihar)." },
  { scheme: "Pradhan Mantri Shram Yogi Maandhan (PM-SYM)", dimension: "beneficiaries", fiscal_year: "2024-25", label: "India subscribers", value: 4612330, unit: "persons", scope: "National", provenance: "reported", as_of: "2025-03-05", source: "https://visionias.in/current-affairs/news-today/2025-03-05/schemes-in-news/six-years-of-pradhan-mantri-shram-yogi-maandhan-yojana-pm-sym-completed", note: "National." },
  { scheme: "Atal Pension Yojana (APY)", dimension: "beneficiaries", fiscal_year: "2025-26", label: "India subscribers", value: 90000000, unit: "persons", scope: "National", provenance: "reported", as_of: "2026-04-21", source: "https://www.tribuneindia.com/news/business/atal-pension-yojana-enrolments-surpass-9-crore-enrolments-fy26-additions-highest-at-1-35-crore/amp", note: "National (~9 cr)." },
  { scheme: "Pradhan Mantri Mudra Yojana (PMMY)", dimension: "beneficiaries", fiscal_year: "2024-25", label: "India loans sanctioned", value: 47948320, unit: "loans", scope: "National", provenance: "reported", as_of: "2025-03-31", source: "https://www.ibef.org/government-schemes/pradhan-mantri-mudra-loan-bank-yojana", note: "National FY24-25." },
  { scheme: "Pradhan Mantri Mudra Yojana (PMMY)", dimension: "budget", fiscal_year: "2024-25", label: "India sanctioned", value: 502782, unit: "cr", scope: "National", provenance: "reported", as_of: "2025-03-31", source: "https://www.ibef.org/government-schemes/pradhan-mantri-mudra-loan-bank-yojana" },
  { scheme: "PM SVANidhi (Street Vendors)", dimension: "beneficiaries", fiscal_year: "2025-26", label: "India loans", value: 10000000, unit: "loans", scope: "National", provenance: "published", as_of: "2026-03-30", source: "https://www.newsonair.gov.in/pm-svanidhi-scheme-supports-street-vendors-with-17115-crore-loans", note: "National (~1 cr loans)." },
  { scheme: "PM SVANidhi (Street Vendors)", dimension: "budget", fiscal_year: "2025-26", label: "India loans disbursed", value: 17115, unit: "cr", scope: "National", provenance: "published", as_of: "2026-03-30", source: "https://www.newsonair.gov.in/pm-svanidhi-scheme-supports-street-vendors-with-17115-crore-loans" },
  { scheme: "PM Vishwakarma", dimension: "beneficiaries", fiscal_year: "2025-26", label: "India artisans registered", value: 3000000, unit: "artisans", scope: "National", provenance: "reported", as_of: "2025-12-01", source: "https://www.ibef.org/news/pm-vishwakarma-scheme-provides-end-to-end-holistic-support-to-artisans-of-18-traditional-trades-23-09-lakh-beneficiaries-trained", note: "National." },
  { scheme: "Pradhan Mantri Matru Vandana Yojana (PMMVY)", dimension: "beneficiaries", fiscal_year: "2024-25", label: "India beneficiaries (cumulative)", value: 36400000, unit: "persons", scope: "National", provenance: "published", as_of: "2024-12-13", source: "https://www.newsonair.gov.in/rs-18854-crore-disbursed-among-3-64-crore-beneficiaries-of-pm-matru-vandana-yojana-union-minister-annapurna-devi", note: "National cumulative since inception." },
  { scheme: "Pradhan Mantri Matru Vandana Yojana (PMMVY)", dimension: "budget", fiscal_year: "2024-25", label: "India disbursed (cumulative)", value: 18854, unit: "cr", scope: "National", provenance: "published", as_of: "2024-12-13", source: "https://www.newsonair.gov.in/rs-18854-crore-disbursed-among-3-64-crore-beneficiaries-of-pm-matru-vandana-yojana-union-minister-annapurna-devi" },
  { scheme: "Kushal Yuva Program (KYP)", dimension: "beneficiaries", fiscal_year: "2019", label: "Bihar youth enrolled", value: 729000, unit: "persons", scope: "Bihar", provenance: "reported", as_of: "2019-12-31", source: "https://cleartax.in/s/kushal-yuva-program", note: "7.29 lakh enrolled / 4.83 lakh certified (2019 — latest sourceable; newer counts unverified)." },
  { scheme: "Mukhyamantri Medhavriti Yojana", dimension: "beneficiaries", fiscal_year: "2020–25", label: "Bihar SC/ST students (cumulative)", value: 978000, unit: "students", scope: "Bihar", provenance: "reported", as_of: "2026-05-01", source: "https://indianmasterminds.com/news/government/bihar-sc-st-students-scholarship-under-mukhyamantri-medhavriti-yojana-202730/", note: "6-year cumulative (2020–2025)." },
  { scheme: "Mukhyamantri Medhavriti Yojana", dimension: "budget", fiscal_year: "2020–25", label: "Bihar disbursed (cumulative)", value: 941.31, unit: "cr", scope: "Bihar", provenance: "reported", as_of: "2026-05-01", source: "https://indianmasterminds.com/news/government/bihar-sc-st-students-scholarship-under-mukhyamantri-medhavriti-yojana-202730/" },
  { scheme: "Mukhyamantri Mahila Rojgar Yojana", dimension: "beneficiaries", fiscal_year: "2025-26", label: "Bihar women (launch transfer)", value: 7500000, unit: "persons", scope: "Bihar", provenance: "published", as_of: "2025-09-26", source: "https://www.pmindia.gov.in/en/news_updates/pm-launches-bihars-mukhyamantri-mahila-rojgar-yojana/", note: "₹10,000 each to 75 lakh women at launch; 1.1 cr+ selected overall." },
  { scheme: "Mukhyamantri Mahila Rojgar Yojana", dimension: "budget", fiscal_year: "2025-26", label: "Bihar disbursed (launch)", value: 7500, unit: "cr", scope: "Bihar", provenance: "published", as_of: "2025-09-26", source: "https://ddnews.gov.in/en/pm-modi-launches-bihars-mukhyamantri-mahila-rojgar-yojana-transfers-rs-7500-crore-to-75-lakh-women/" },
  { scheme: "JEEViKA (Bihar Rural Livelihoods) SHG Support", dimension: "beneficiaries", fiscal_year: "2025-26", label: "Bihar women mobilised (in SHGs)", value: 13500000, unit: "persons", scope: "Bihar", provenance: "reported", as_of: "2025-07-01", source: "https://yourstory.com/2025/07/inside-jeevika-bihar-silent-financial-engine-powering-rural-women-development", note: "~1.35 cr women across ~10.6 lakh SHGs." },
  { scheme: "MGNREGA (Bihar)", dimension: "beneficiaries", fiscal_year: "2023-24", label: "Bihar households employed", value: 4600000, unit: "households", scope: "Bihar", provenance: "reported", as_of: "2024-03-13", source: "https://www.newslaundry.com/2024/04/01/corruption-bad-working-conditions-how-mgnrega-continues-to-falter-in-bihar", note: "46 lakh households; 201.5 M person-days (FY23-24, NREGA portal)." },
  { scheme: "Bihar Jal Jeevan Mission (Har Ghar Nal Ka Jal)", dimension: "beneficiaries", fiscal_year: "2024-25", label: "Bihar tap connections", value: 1847000, unit: "connections", scope: "Bihar", provenance: "reported", as_of: "2024-09-01", source: "https://patnapress.com/bihar-nears-universal-tap-water-coverage-under-har-ghar-nal-ka-jal-initiative/", note: "18.47 lakh FHTCs; ~99% rural ward coverage." },
  { scheme: "Mukhyamantri Udyami Yojana", dimension: "beneficiaries", fiscal_year: "2024-25", label: "Bihar beneficiaries selected", value: 9247, unit: "persons", scope: "Bihar", provenance: "reported", as_of: "2024-08-23", source: "https://biharhelp.in/bihar-mukhyamantri-udyami-yojana-2024-25/", note: "FY24-25 computerised randomisation (SC/ST, EBC, women, youth, minority)." },
  { scheme: "Mukhyamantri Vridhjan Pension Yojana", dimension: "beneficiaries", fiscal_year: "2025-26", label: "All Bihar social-security pensions (combined)", value: 10969255, unit: "persons", scope: "Bihar", provenance: "reported", as_of: "2025-07-01", source: "https://www.oneindia.com/india/bihar-social-security-pension-hiked-to-1100-over-1-crore-beneficiaries-to-benefit-from-july-7778997.html", note: "COMBINED old-age + widow + disability total (~1.09 cr); not split per scheme." },
];

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log(`DRY RUN — ${ROWS.length} metric rows across ${new Set(ROWS.map((r) => r.scheme)).size} schemes`);
    return;
  }
  let added = 0, skipped = 0, missing = 0;
  for (const r of ROWS) {
    const s = await query<{ id: string }>(`select id from schemes where name_en = $1`, [r.scheme]);
    if (!s.length) { console.log(`! scheme not found: ${r.scheme}`); missing++; continue; }
    const id = s[0].id;
    const exists = await query(
      `select 1 from scheme_metrics where scheme_id=$1 and dimension=$2 and fiscal_year=$3 and coalesce(label,'')=$4`,
      [id, r.dimension, r.fiscal_year, r.label]
    );
    if (exists.length) { skipped++; continue; }
    const note = r.note ? `${r.note} [scope: ${r.scope}]` : `[scope: ${r.scope}]`;
    await query(
      `insert into scheme_metrics (scheme_id, dimension, fiscal_year, label, value, unit, provenance, as_of_date, source_url, note)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, r.dimension, r.fiscal_year, r.label, r.value, r.unit, r.provenance, r.as_of, r.source, note]
    );
    console.log(`+ ${r.scheme} · ${r.dimension} ${r.fiscal_year} = ${r.value} ${r.unit} (${r.scope}, ${r.provenance})`);
    added++;
  }
  console.log(`\nDone. ${added} added, ${skipped} already present${missing ? `, ${missing} scheme-name MISSES (fix names)` : ""}.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await getPool().end(); });
