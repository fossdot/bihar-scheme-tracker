/**
 * Verification pass (2026-06-19) — top citizen schemes, confirmed/corrected against AUTHORITATIVE
 * current sources (official portals, PIB, newsonair.gov.in, myScheme), not SEO blogs. Each scheme
 * gets a real, dated status_evidence with its source; wrong facts are corrected; status moves to
 * 'active' ONLY where there is a concrete current-year signal (live portal cycle / recent
 * installment / pension notification). Fasal Sahayata stays 'likely_active' (no current-season
 * notification fetched — honest, per "default to unknown over a confident guess").
 *   npm run seed:verify [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";

type Upd = {
  name: string;
  status?: string;
  evidence: string;
  benefit?: string;
  min_age?: number;
  max_age?: number;
  income_ceiling?: number;
  portal?: string;
  is_for_disabled?: boolean;
  last_notification_date?: string;
  social_categories?: string[];
};

const U: Upd[] = [
  {
    name: "Bihar Student Credit Card Scheme",
    status: "active",
    benefit:
      "Education loan up to ₹4 lakh for higher studies — now interest-free for all categories (Sept 2025 reform; previously 4% general / 1% for women & PwD). Repayment extended to 7 yrs (≤₹2L) or 10 yrs (>₹2L). Processed via the DRCC.",
    evidence:
      "Active — official 7nishchay portal lists it live (DRCC-processed). Loans made INTEREST-FREE for all categories from Sept 2025 (was 4% / 1%), with repayment extended to 7 yrs (≤₹2L) / 10 yrs (>₹2L). Up to ₹4 lakh, 12th-pass, age ≤25 (30 for postgraduate). Verified 2026-06-19. Source: https://www.7nishchay-yuvaupmission.bihar.gov.in/",
  },
  {
    name: "Mukhyamantri Nishchay Swayam Sahayata Bhatta (MNSSBY)",
    status: "active",
    evidence:
      "Active — official 7nishchay portal lists it live and accepting registrations (also on UMANG). ₹1,000/month for up to 2 years for unemployed Bihar youth aged 20–25 (12th-passed, not in higher studies). Verified 2026-06-19. Source: https://www.7nishchay-yuvaupmission.bihar.gov.in/",
  },
  {
    name: "Kushal Yuva Program (KYP)",
    status: "active",
    max_age: 28,
    evidence:
      "Active — official 7nishchay portal lists KYP live under the Bihar Skill Development Mission (240-hour training: communication, basic computer, soft skills; free). Eligibility 15–28 (relaxations: SC/ST & PwD to 33, OBC to 31), 10th-pass. Verified 2026-06-19. Source: https://www.7nishchay-yuvaupmission.bihar.gov.in/",
  },
  {
    name: "Mukhyamantri Kanya Utthan Yojana",
    status: "active",
    benefit:
      "Graduation incentive ₹50,000 (one-time); intermediate incentive ₹25,000 (first division) or ₹15,000 (second division). Paid by DBT to the Aadhaar-linked account.",
    evidence:
      "Active — medhasoft portal shows '2026 Registration Open' for the intermediate and graduation components. Graduation ₹50,000 (one-time, DBT); intermediate ₹25,000 (first division) / ₹15,000 (second division); unmarried at the intermediate stage. Verified 2026-06-19. Source: https://medhasoft.bihar.gov.in/",
  },
  {
    name: "Mukhyamantri Mahila Rojgar Yojana",
    status: "active",
    portal: "https://brlps.in",
    benefit:
      "One-time ₹10,000 startup grant per woman (DBT), plus an optional top-up of up to ₹2 lakh for ventures showing progress after ~6 months. Delivered via the JEEViKA / SHG network.",
    evidence:
      "Active — launched 26 Sept 2025 (₹7,500 cr scheme): a ONE-TIME ₹10,000 grant per woman by DBT, with an optional second-stage top-up up to ₹2 lakh for viable ventures after ~6 months. Delivered through JEEViKA / urban SHGs (Rural Development Dept); 1.1+ crore women selected (₹10,000 to 21 lakh more on 6 Oct 2025). [Corrected: was stored as a ₹10,000/month stipend — it is a one-time grant.] Verified 2026-06-19. Source: https://www.pmindia.gov.in/en/news_updates/pm-launches-bihars-mukhyamantri-mahila-rojgar-yojana/",
  },
  {
    name: "Mukhyamantri Udyami Yojana",
    status: "active",
    max_age: 50,
    benefit:
      "Up to ₹10 lakh — 50% subsidy (grant, up to ₹5 lakh) + 50% loan (up to ₹5 lakh) repayable over 84 months; the Youth category pays 1% interest. No collateral.",
    evidence:
      "Active — official udyami.bihar.gov.in shows the FY2025-26 cycle (applications closed 23 Mar 2026, selection by randomisation 20 May 2026, document upload by 24 Jun 2026) — mid-cycle and operational. Categories: SC/ST, EBC, women, youth, minority; age 18–50; min education 10+2/ITI/diploma. Verified 2026-06-19. Source: https://udyami.bihar.gov.in/",
  },
  {
    name: "JEEViKA (Bihar Rural Livelihoods) SHG Support",
    status: "active",
    benefit:
      "SHG support: one-time revolving fund + initial capitalisation / community investment fund grants, bank credit linkage, and capacity-building/training (amounts vary by stage).",
    evidence:
      "Active — BRLPS/JEEViKA official portal live; FY2024-25 Annual Action Plan & Budget published; also the delivery rail for the 2025 Mahila Rojgar Yojana. Verified 2026-06-19. Source: https://brlps.in/",
  },
  {
    name: "Bihar Laghu Udyami Yojana",
    status: "active",
    benefit:
      "₹2 lakh as a 100% subsidy (no repayment), released in three installments (25% / 50% / 25%). For families with monthly income below ₹6,000.",
    evidence:
      "Active — hosted on the official udyami.bihar.gov.in portal; FY2025-26 cycle closed 23 Mar 2026 (selection by computerised randomisation), with current beneficiary notices (June 2026). ₹2 lakh 100% grant in three installments to families with monthly income below ₹6,000; all social categories, age 18–50. Verified 2026-06-19. Source: https://udyami.bihar.gov.in/",
  },
  {
    name: "Mukhyamantri Vridhjan Pension Yojana",
    status: "active",
    benefit:
      "₹1,100 per month (raised from ₹400/₹500 in July 2025), paid by DBT on the 10th of each month.",
    evidence:
      "Active — Bihar budget line ₹828 cr (2025-26 BE) under Social Welfare (Bihar Budget Documents, PRS analysis). Pension raised from ₹400/₹500 to a flat ₹1,100/month effective July 2025 (~1.09 crore beneficiaries, paid on the 10th by DBT). Verified 2026-06-19. Source: https://www.sspmis.bihar.gov.in/",
  },
  {
    name: "Laxmibai Social Security (Widow) Pension Yojana",
    status: "active",
    income_ceiling: 60000,
    benefit: "₹1,100 per month (raised from ₹400 in July 2025), paid by DBT via SSPMIS.",
    evidence:
      "Active — among the six social-security pensions raised to a flat ₹1,100/month effective July 2025 (was ₹400). For widows aged 18+ with annual family income below ₹60,000 (Bihar resident), via SSPMIS. Verified 2026-06-19. Source: https://www.sspmis.bihar.gov.in/",
  },
  {
    name: "Mukhyamantri Divyangjan Pension Yojana",
    status: "active",
    is_for_disabled: true,
    benefit: "₹1,100 per month (raised from ₹400 in July 2025). Paid via Direct Benefit Transfer.",
    evidence:
      "Active — disability pension raised to ₹1,100/month effective July 2025 (was ₹400), paid by DBT. Eligibility: 40%+ disability, via SSPMIS / Lok Seva. Verified 2026-06-19. Source: https://www.sspmis.bihar.gov.in/",
  },
  {
    name: "Bihar e-Kalyan Scholarship",
    status: "active",
    social_categories: ["sc", "st", "bc", "ebc"],
    evidence:
      "Active — Bihar Post-Matric Scholarship (SC/ST/BC/EBC) operational for 2025-26 (fresh applications ~Sept–Nov 2025, correction window to 25 Dec 2025). Tuition + maintenance, Class 11 to graduation/PG/professional. Income limit ₹2.5 lakh for BC/EBC; no income bar for SC/ST. For 2025-26, post-matric applications run via pmsonline.bihar.gov.in; status/history via e-Kalyan. Verified 2026-06-19. Source: https://ekalyan.bih.nic.in/",
  },
  {
    name: "Bihar Rajya Fasal Sahayata Yojana",
    status: "likely_active",
    benefit:
      "Reported ₹7,500/ha (loss up to 20%) or ₹10,000/ha (loss above 20%), up to 2 hectares per farmer. Verify current-season rates.",
    evidence:
      "Likely active — the official FSY portal (pacsonline.bih.nic.in/fsy) is the live registration system and the scheme runs each season (Kharif 2025 window ~20 Aug–31 Oct 2025). Reported ₹7,500/ha (loss ≤20%) / ₹10,000/ha (loss >20%), up to 2 hectares. No current-season official notification was fetched, so not upgraded to active. Verified 2026-06-19. Source: https://pacsonline.bih.nic.in/fsy/login.aspx",
  },
  {
    name: "Bihar Krishi Input Anudan Yojana",
    status: "active",
    evidence:
      "Active — official dbtagriculture.bihar.gov.in shows Krishi Input Anudan open for Rabi 2025-26 (application 20–24 Jun 2026 across 5 districts) and publishes the Kharif 2025-26 implementation guidelines — a current-FY signal. Per-hectare on 33%+ loss: ₹8,500 (un-irrigated) / ₹17,000 (irrigated) / ₹22,500 (perennial), up to ~2 hectares. Verified 2026-06-19. Source: https://dbtagriculture.bihar.gov.in/",
  },
  {
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    status: "active",
    last_notification_date: "2026-03-13",
    evidence:
      "Active — 22nd installment released 13 Mar 2026 (₹18,640 cr to 9.32 crore farmers; cumulative >₹4.27 lakh crore, per PIB); 23rd installment scheduled 20 Jun 2026. ₹6,000/year in three ₹2,000 installments; eKYC mandatory. Verified 2026-06-19. Source: https://pmkisan.gov.in/",
  },
  {
    name: "Ayushman Bharat — PM-JAY",
    status: "active",
    benefit:
      "Cover up to ₹5 lakh per family per year for secondary/tertiary hospitalisation. The Ayushman Vay Vandana extension additionally covers all citizens aged 70+ regardless of income.",
    evidence:
      "Active in Bihar — official reports cite >₹1,000 crore saved by Bihar beneficiaries in a year, with ongoing enrolment drives. ₹5 lakh/family/year (secondary/tertiary). The Ayushman Vay Vandana extension now covers all citizens aged 70+ regardless of income. Verified 2026-06-19. Source: https://pmjay.gov.in/",
  },
];

const COL: Record<string, string> = {
  status: "status",
  benefit: "benefit_detail",
  min_age: "min_age",
  max_age: "max_age",
  income_ceiling: "income_ceiling",
  portal: "application_portal_url",
  is_for_disabled: "is_for_disabled",
  last_notification_date: "last_notification_date",
  social_categories: "social_categories",
  evidence: "status_evidence",
};

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log(`DRY RUN — ${U.length} schemes`);
    U.forEach((u) => console.log(` ${u.name} → ${u.status ?? "(status unchanged)"}`));
    return;
  }
  let done = 0, missing = 0;
  for (const u of U) {
    const sets: string[] = [];
    const vals: unknown[] = [u.name];
    for (const [key, col] of Object.entries(COL)) {
      const v = (u as Record<string, unknown>)[key];
      if (v === undefined) continue;
      vals.push(v);
      sets.push(`${col}=$${vals.length}`);
    }
    vals.push(ON);
    sets.push(`last_verified=$${vals.length}`);
    const res = await query<{ id: string }>(
      `update schemes set ${sets.join(", ")} where name_en=$1 returning id`,
      vals,
    );
    if (!res.length) { console.log(`! not found: ${u.name}`); missing++; continue; }
    console.log(`~ ${u.name} → ${u.status ?? "(unchanged)"} ${u.benefit ? "[benefit] " : ""}verified`);
    done++;
  }
  console.log(`\nDone. ${done} verified${missing ? `, ${missing} not found` : ""}.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
