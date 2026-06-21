/**
 * Deep metrics (2026-06-21) — output of the deepen-scheme-data research workflow (81 agents:
 * deep-source → adversarial verify). Only figures that SURVIVED an adversarial verifier are here;
 * everything unconfirmed was dropped, and genuinely-non-public dimensions are left as the panel's
 * honest "RTI needed" default. Adds real data to schemes that were empty before (MNSSBY, Kanya
 * Vivah, Krishi Input, Fasal Sahayata, Laghu Udyami, Startup, widow/disability pensions) plus
 * district/demographic/outcome dimensions for the marquee schemes (MGNREGA, JEEViKA, PMAY-G, PM-KISAN).
 *
 * Rupee amounts → 'budget' (₹ crore). Counts → 'beneficiaries'. Contextual splits →
 * district/demographics/outcomes with the figure written into the note (the panel shows the note
 * for those dimensions). Idempotent per (scheme, dimension, fiscal_year).
 *   npm run seed:metrics-deep [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

type M = {
  scheme: string; dimension: "beneficiaries" | "budget" | "district" | "demographics" | "outcomes";
  fiscal_year: string; label: string; value: number; unit: string;
  provenance: "published" | "reported"; as_of: string | null; source: string; note: string;
};

const ROWS: M[] = [
  // ── MNSSBY (was empty) ──
  { scheme: "Mukhyamantri Nishchay Swayam Sahayata Bhatta (MNSSBY)", dimension: "beneficiaries", fiscal_year: "cumulative", label: "Bihar paid beneficiaries (since launch)", value: 516076, unit: "persons", provenance: "published", as_of: null, source: "https://bvm.bihar.gov.in/submission/nc/nishchay-1-aarthik-hal-yuvao-ko-bal/", note: "5.16 lakh youth paid the ₹1,000/month allowance; 5.71 lakh applications accepted since launch. [Bihar]" },
  { scheme: "Mukhyamantri Nishchay Swayam Sahayata Bhatta (MNSSBY)", dimension: "budget", fiscal_year: "cumulative", label: "Bihar disbursed (since launch)", value: 696, unit: "cr", provenance: "published", as_of: null, source: "https://bvm.bihar.gov.in/submission/nc/nishchay-1-aarthik-hal-yuvao-ko-bal/", note: "Total allowance paid since launch. [Bihar]" },

  // ── Bihar Startup Fund (was empty) ──
  { scheme: "Bihar Startup Fund (Seed Funding)", dimension: "beneficiaries", fiscal_year: "2024-25", label: "Bihar startups funded", value: 1522, unit: "startups", provenance: "reported", as_of: "2025-05-19", source: "https://indianmasterminds.com/news/bihars-startup-boom-state-emerges-as-innovation-hub-with-1500-ventures-rs-62-5-crore-in-support-118762/", note: "1,522 startups registered under the seed fund. [Bihar]" },
  { scheme: "Bihar Startup Fund (Seed Funding)", dimension: "budget", fiscal_year: "2024-25", label: "Bihar seed funding disbursed", value: 62.5, unit: "cr", provenance: "reported", as_of: "2025-05-19", source: "https://indianmasterminds.com/news/bihars-startup-boom-state-emerges-as-innovation-hub-with-1500-ventures-rs-62-5-crore-in-support-118762/", note: "Cumulative seed-fund disbursal. [Bihar]" },

  // ── Mukhyamantri Kanya Vivah Yojana (was empty) — multi-year series ──
  { scheme: "Mukhyamantri Kanya Vivah Yojana", dimension: "beneficiaries", fiscal_year: "2007-08", label: "Bihar girls assisted", value: 20000, unit: "girls", provenance: "reported", as_of: "2026", source: "https://indianmasterminds.com/news/bihar-mukhyamantri-kanya-vivah-yojana-2272-lakh-beneficiaries-188652/", note: "Launch year (approx). Cumulative to 2025-26: ~22.72 lakh girls, ₹1,136 cr. [Bihar]" },
  { scheme: "Mukhyamantri Kanya Vivah Yojana", dimension: "beneficiaries", fiscal_year: "2022-23", label: "Bihar girls assisted", value: 231723, unit: "girls", provenance: "reported", as_of: "2026", source: "https://indianmasterminds.com/news/bihar-mukhyamantri-kanya-vivah-yojana-2272-lakh-beneficiaries-188652/", note: "Highest single-year. [Bihar]" },
  { scheme: "Mukhyamantri Kanya Vivah Yojana", dimension: "budget", fiscal_year: "2022-23", label: "Bihar disbursed", value: 115.86, unit: "cr", provenance: "reported", as_of: "2026", source: "https://indianmasterminds.com/news/bihar-mukhyamantri-kanya-vivah-yojana-2272-lakh-beneficiaries-188652/", note: "Cumulative since 2007-08: ₹1,136 cr. [Bihar]" },
  { scheme: "Mukhyamantri Kanya Vivah Yojana", dimension: "beneficiaries", fiscal_year: "2023-24", label: "Bihar girls assisted", value: 157868, unit: "girls", provenance: "reported", as_of: "2026", source: "https://indianmasterminds.com/news/bihar-mukhyamantri-kanya-vivah-yojana-2272-lakh-beneficiaries-188652/", note: "[Bihar]" },
  { scheme: "Mukhyamantri Kanya Vivah Yojana", dimension: "beneficiaries", fiscal_year: "2024-25", label: "Bihar girls assisted", value: 65535, unit: "girls", provenance: "reported", as_of: "2026", source: "https://indianmasterminds.com/news/bihar-mukhyamantri-kanya-vivah-yojana-2272-lakh-beneficiaries-188652/", note: "[Bihar]" },
  { scheme: "Mukhyamantri Kanya Vivah Yojana", dimension: "beneficiaries", fiscal_year: "2025-26", label: "Bihar girls assisted (partial)", value: 39435, unit: "girls", provenance: "reported", as_of: "2026", source: "https://indianmasterminds.com/news/bihar-mukhyamantri-kanya-vivah-yojana-2272-lakh-beneficiaries-188652/", note: "Partial year so far. [Bihar]" },

  // ── Bihar Krishi Input Anudan Yojana (was empty) ──
  { scheme: "Bihar Krishi Input Anudan Yojana", dimension: "budget", fiscal_year: "2025-26", label: "Bihar disbursed (Aug-2025 flood loss)", value: 113.16, unit: "cr", provenance: "reported", as_of: "2026-02-21", source: "https://www.thehansindia.com/news/national/bihar-nitish-kumar-transfers-rs-113-crore-to-farmers-affected-by-flood-cyclone-montha-1050659", note: "Input subsidy via DBT for Aug-2025 flood / Cyclone Montha kharif crop loss (CM transfer, 21 Feb 2026). [Bihar]" },
  { scheme: "Bihar Krishi Input Anudan Yojana", dimension: "district", fiscal_year: "2025-26", label: "Phase-1 districts", value: 13, unit: "districts", provenance: "reported", as_of: "2026-02-21", source: "https://www.thehansindia.com/news/national/bihar-nitish-kumar-transfers-rs-113-crore-to-farmers-affected-by-flood-cyclone-montha-1050659", note: "Phase-1 disbursement covered 13 districts, 53 blocks, 493 panchayats (Begusarai, Bhojpur, Darbhanga, Gaya, Kaimur, Kishanganj, Madhepura, Madhubani, Muzaffarpur, E. Champaran, Sheohar, Sitamarhi, Supaul). [Bihar]" },

  // ── Bihar Rajya Fasal Sahayata Yojana (was empty) ──
  { scheme: "Bihar Rajya Fasal Sahayata Yojana", dimension: "beneficiaries", fiscal_year: "Rabi 2022-23", label: "Bihar farmers paid", value: 167237, unit: "farmers", provenance: "reported", as_of: "2025-03-12", source: "https://m.bihar.punjabkesari.in/national/news/bihar-fasal-sahayata-yojana-2025-2119117", note: "Farmers paid compensation for Rabi 2022-23 crop loss. [Bihar]" },
  { scheme: "Bihar Rajya Fasal Sahayata Yojana", dimension: "budget", fiscal_year: "Rabi 2022-23", label: "Bihar disbursed", value: 122.32, unit: "cr", provenance: "reported", as_of: "2025-03-12", source: "https://m.bihar.punjabkesari.in/national/news/bihar-fasal-sahayata-yojana-2025-2119117", note: "Compensation transferred for Rabi 2022-23 crop loss. [Bihar]" },
  { scheme: "Bihar Rajya Fasal Sahayata Yojana", dimension: "budget", fiscal_year: "Kharif 2023", label: "Bihar disbursed", value: 32.83, unit: "cr", provenance: "reported", as_of: "2025-04-26", source: "https://bihar.punjabkesari.in/bihar/news/bihar-fasal-sahayata-yojana-2142281", note: "Compensation transferred for Kharif 2023 crop loss. [Bihar]" },
  { scheme: "Bihar Rajya Fasal Sahayata Yojana", dimension: "beneficiaries", fiscal_year: "Rabi 2025-26", label: "Bihar applications (not yet paid)", value: 365563, unit: "applications", provenance: "published", as_of: "2026-06-21", source: "https://esahkari.bihar.gov.in/coop/fsy/ApplicationReportRabi.aspx", note: "Applications for Rabi 2025-26 on the official Cooperative Dept portal — these are APPLICATIONS, not confirmed payouts. [Bihar]" },

  // ── Bihar Laghu Udyami Yojana (was empty) ──
  { scheme: "Bihar Laghu Udyami Yojana", dimension: "beneficiaries", fiscal_year: "2023-24", label: "Bihar families (1st installment)", value: 40099, unit: "families", provenance: "reported", as_of: "2024-09", source: "https://www.constructionworld.in/policy-updates-and-economic-news/bihar-govt-disburses-rs-29-billion-to-74540-beneficiaries/62190", note: "Families paid the first installment (cumulative to Sep 2024). [Bihar]" },
  { scheme: "Bihar Laghu Udyami Yojana", dimension: "budget", fiscal_year: "2023-24", label: "Bihar disbursed (1st installment)", value: 200, unit: "cr", provenance: "reported", as_of: "2024-09", source: "https://www.constructionworld.in/policy-updates-and-economic-news/bihar-govt-disburses-rs-29-billion-to-74540-beneficiaries/62190", note: "First-installment amount (₹50,000 each). [Bihar]" },
  { scheme: "Bihar Laghu Udyami Yojana", dimension: "beneficiaries", fiscal_year: "2025-26", label: "Bihar beneficiaries (1st installment)", value: 20106, unit: "persons", provenance: "reported", as_of: "2025-07-15", source: "https://patnapress.com/bihar-laghu-udyam-yojana-first-installment-disbursed/", note: "First installment disbursed at the 15 Jul 2025 event. [Bihar]" },
  { scheme: "Bihar Laghu Udyami Yojana", dimension: "budget", fiscal_year: "2025-26", label: "Bihar disbursed (1st installment)", value: 100.53, unit: "cr", provenance: "reported", as_of: "2025-07-15", source: "https://patnapress.com/bihar-laghu-udyam-yojana-first-installment-disbursed/", note: "₹50,000 each at the 15 Jul 2025 event. [Bihar]" },

  // ── Pension splits (was combined-only) ──
  { scheme: "Laxmibai Social Security (Widow) Pension Yojana", dimension: "beneficiaries", fiscal_year: "2025-26", label: "Bihar widow pensioners", value: 860000, unit: "persons", provenance: "reported", as_of: "2025", source: "https://patnapress.com/bihar-raises-social-security-pension-to-rs-1100-for-over-11-million-beneficiaries/", note: "~8.6 lakh widows — disaggregated from the combined ~1.09 crore social-security total. [Bihar]" },
  { scheme: "Mukhyamantri Divyangjan Pension Yojana", dimension: "beneficiaries", fiscal_year: "2025-26", label: "Bihar disability pensioners (state)", value: 978483, unit: "persons", provenance: "reported", as_of: "2025-06", source: "https://indianmasterminds.com/news/bihar-pension-scheme-2025-nitish-kumar-dbt-transfer-143835/", note: "State Bihar Divyangjan pension (~9.78 lakh); a further ~1.10 lakh get the central IGNDPS. [Bihar]" },

  // ── PM-KISAN — district dimension is public ──
  { scheme: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)", dimension: "district", fiscal_year: "2024-25", label: "District-wise (public)", value: 282000, unit: "beneficiaries", provenance: "published", as_of: "2025-02-22", source: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2105462", note: "District-wise distribution is published on the PM-KISAN dashboard (e.g. Bhagalpur ~2.82 lakh cumulative). [Bihar]" },

  // ── MGNREGA — demographics + outcomes + actual expenditure (Bihar) ──
  { scheme: "MGNREGA (Bihar)", dimension: "demographics", fiscal_year: "2024-25", label: "SC/ST share of person-days", value: 20, unit: "percent", provenance: "published", as_of: "2025-09", source: "https://www.dord.gov.in/static/uploads/2025/09/d81193f25cde78b36f36b559ffabbb18.pdf", note: "SC ~20% and ST ~2% of total person-days in Bihar (FY2024-25, MoRD). [Bihar]" },
  { scheme: "MGNREGA (Bihar)", dimension: "outcomes", fiscal_year: "2024-25", label: "Person-days generated", value: 250399729, unit: "person-days", provenance: "published", as_of: "2025-09", source: "https://www.dord.gov.in/static/uploads/2025/09/d81193f25cde78b36f36b559ffabbb18.pdf", note: "~25.04 crore person-days generated in Bihar (FY2024-25, MoRD). [Bihar]" },
  { scheme: "MGNREGA (Bihar)", dimension: "budget", fiscal_year: "2024-25", label: "Bihar actual expenditure", value: 8473.73, unit: "cr", provenance: "published", as_of: "2025-09", source: "https://www.dord.gov.in/static/uploads/2025/09/d81193f25cde78b36f36b559ffabbb18.pdf", note: "Total actual MGNREGA expenditure in Bihar, FY2024-25 (MoRD). [Bihar]" },

  // ── JEEViKA — budget + outcomes + district (beneficiaries already on file) ──
  { scheme: "JEEViKA (Bihar Rural Livelihoods) SHG Support", dimension: "budget", fiscal_year: "2024-25", label: "NRLM Annual Action Plan", value: 3136.95, unit: "cr", provenance: "published", as_of: "2024-04-01", source: "https://brlps.in/UplodFiles/Files/AAP%20and%20Budget%20of%20BRLPS(JEEVIKA)%20for%20FY%202024-25%20(1).pdf", note: "BRLPS/JEEViKA NRLM Annual Action Plan budget, FY2024-25. [Bihar]" },
  { scheme: "JEEViKA (Bihar Rural Livelihoods) SHG Support", dimension: "outcomes", fiscal_year: "2025-26", label: "Cumulative credit to SHGs", value: 57186, unit: "cr", provenance: "published", as_of: "2025-06-30", source: "https://brlps.in/UplodFiles/Files/JEEVIKA%2071st%20Quarterly%20Progress%20Report%20(April-June%202025)_c.pdf", note: "₹57,186 cr cumulative credit to SHGs. Structure: 11.0 lakh SHGs, 73,515 VOs, 1,684 CLFs (Jun 2025). [Bihar]" },
  { scheme: "JEEViKA (Bihar Rural Livelihoods) SHG Support", dimension: "district", fiscal_year: "2024-25", label: "District-wise (public)", value: 331631, unit: "households", provenance: "published", as_of: "2025-06-21", source: "https://brlps.in/districtAbout?us=3", note: "Per-district mobilisation is published on brlps.in (e.g. Begusarai ~3.32 lakh households). [Bihar]" },

  // ── PMAY-G — beneficiaries series + demographics + expenditure (Bihar) ──
  { scheme: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)", dimension: "beneficiaries", fiscal_year: "2023-24", label: "Bihar houses sanctioned (cumulative)", value: 3067018, unit: "houses", provenance: "published", as_of: "2024-03-31", source: "https://cag.gov.in/uploads/download_audit_report/2025/Performance-Audit---Civil---Report---4-of-2025--English-069a01619c584d8.44750365.pdf", note: "Cumulative FY2017-18→2023-24 (CAG Report 4 of 2025). [Bihar]" },
  { scheme: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)", dimension: "beneficiaries", fiscal_year: "2025-26", label: "Bihar houses sanctioned (cumulative)", value: 4900000, unit: "houses", provenance: "published", as_of: "2025-08-04", source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=155191&ModuleId=3", note: ">49 lakh sanctioned (target 50.12 lakh), as on 4 Aug 2025 (PIB). [Bihar]" },
  { scheme: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)", dimension: "demographics", fiscal_year: "2023-24", label: "Houses to persons with disabilities", value: 6766, unit: "houses", provenance: "published", as_of: "2024-03-31", source: "https://cag.gov.in/uploads/download_audit_report/2025/Performance-Audit---Civil---Report---4-of-2025--English-069a01619c584d8.44750365.pdf", note: "6,766 houses to PwDs vs an MoRD target of 79,005 (CAG, FY2017-24). [Bihar]" },
  { scheme: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)", dimension: "budget", fiscal_year: "2023-24", label: "Bihar expenditure (cumulative)", value: 46015.34, unit: "cr", provenance: "published", as_of: "2024-03-31", source: "https://cag.gov.in/uploads/download_audit_report/2025/Performance-Audit---Civil---Report---4-of-2025--English-069a01619c584d8.44750365.pdf", note: "Total expenditure ₹46,015 cr (Central ₹26,745 cr + State ₹17,830 cr), cumulative FY2017-24 (CAG). [Bihar]" },
];

// Coerce as_of to a valid DATE: keep YYYY-MM-DD, pad YYYY-MM → -01, else null.
function asDate(s: string | null): string | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  return null;
}

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log(`DRY RUN — ${ROWS.length} rows across ${new Set(ROWS.map((r) => r.scheme)).size} schemes`);
    return;
  }
  let added = 0, skipped = 0, missing = 0;
  for (const r of ROWS) {
    const s = await query<{ id: string }>(`select id from schemes where name_en = $1`, [r.scheme]);
    if (!s.length) { console.log(`! not found: ${r.scheme}`); missing++; continue; }
    const id = s[0].id;
    // guard on (scheme, dimension, fiscal_year) so we never create a conflicting same-year row
    const exists = await query(
      `select 1 from scheme_metrics where scheme_id=$1 and dimension=$2 and fiscal_year=$3`,
      [id, r.dimension, r.fiscal_year]
    );
    if (exists.length) { skipped++; continue; }
    await query(
      `insert into scheme_metrics (scheme_id, dimension, fiscal_year, label, value, unit, provenance, as_of_date, source_url, note)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, r.dimension, r.fiscal_year, r.label, r.value, r.unit, r.provenance, asDate(r.as_of), r.source, r.note]
    );
    console.log(`+ ${r.scheme} · ${r.dimension} ${r.fiscal_year} = ${r.value} ${r.unit} (${r.provenance})`);
    added++;
  }
  console.log(`\nDone. ${added} added, ${skipped} skipped (existing same scheme/dim/year)${missing ? `, ${missing} not found` : ""}.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { await getPool().end(); });
