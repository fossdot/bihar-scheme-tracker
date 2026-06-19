/**
 * Breadth pass (2026-06-19) — widen the catalogue beyond the Saat Nischay MVP, sourced from
 * public reporting + official portals (NO RTI needed). Run after the structured-eligibility
 * migration.
 *
 *   npm run seed:breadth -- --dry-run
 *   npm run seed:breadth
 *
 * Principles (CLAUDE.md):
 *   - Status is CONSERVATIVE: 'likely_active' (portal live / a recent 2025-26 application cycle),
 *     never 'active' — scheme-line budgets are NOT yet verified. status_evidence says exactly that.
 *   - Structured eligibility is set ONLY where the source states it; otherwise left at defaults.
 *   - Figures (amounts, ages, income bars) are from public sources, to cross-check against the
 *     official portal. Every row carries a real official portal as source_url.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getPool, query } from "../lib/db";

const ON = "2026-06-19";

const DEPTS = {
  education: { name_en: "Education Department, Government of Bihar", name_hi: "शिक्षा विभाग, बिहार सरकार", website: "https://education.bihar.gov.in" },
  industries: { name_en: "Industries Department, Government of Bihar", name_hi: "उद्योग विभाग, बिहार सरकार", website: "https://industries.bihar.gov.in" },
  socialwelfare: { name_en: "Social Welfare Department, Government of Bihar", name_hi: "समाज कल्याण विभाग, बिहार सरकार", website: "https://state.bihar.gov.in/socialwelfare" },
  agriculture: { name_en: "Department of Agriculture, Government of Bihar", name_hi: "कृषि विभाग, बिहार सरकार", website: "https://dbtagriculture.bihar.gov.in" },
} as const;
type Dept = keyof typeof DEPTS;

type S = Record<string, unknown> & { name_en: string; dept: Dept };

const ev = (portal: string, extra: string) =>
  `Seeded ${ON} as 'likely_active': portal live / a recent 2025-26 application cycle was reported. ` +
  `Scheme-line budget NOT verified against budget.bihar.gov.in. Facts from public reporting — ` +
  `cross-check against the official portal. ${extra} Source: ${portal}`;

const SCHEMES: S[] = [
  {
    name_en: "Mukhyamantri Kanya Utthan Yojana",
    name_hi: "मुख्यमंत्री कन्या उत्थान योजना",
    dept: "education",
    categories: ["education", "women_child"],
    launch_date: "2018-04-25",
    objective_en: "Financial incentives to girls in Bihar from birth through graduation, to improve girls' education and well-being.",
    objective_hi: "लड़कियों की शिक्षा एवं कल्याण हेतु जन्म से स्नातक तक बिहार की बेटियों को वित्तीय प्रोत्साहन।",
    eligibility_en: "Girl students who are permanent residents of Bihar. No income limit — open to all categories. Benefits are paid at stages (e.g. on passing intermediate and on graduation); the account must be in the girl's name and Aadhaar-linked.",
    eligibility_hi: "बिहार की स्थायी निवासी छात्राएँ। कोई आय-सीमा नहीं — सभी श्रेणियों हेतु। लाभ चरणों में (जैसे इंटरमीडिएट एवं स्नातक उत्तीर्ण करने पर) देय; खाता बालिका के नाम एवं आधार से जुड़ा हो।",
    benefit_type: "Cash incentive (DBT)",
    benefit_detail: "Up to ₹50,000 cumulatively from birth to graduation (widely reported as ₹25,000 on passing intermediate and ₹50,000 on graduation). Paid via Direct Benefit Transfer.",
    target_beneficiary: "Girls / women students of Bihar.",
    personas: ["student"], education_levels: [], gender_eligibility: "female", social_categories: [],
    min_age: null, max_age: null, income_ceiling: null, requires_bpl: false, domicile: "bihar",
    land_ownership: null,
    application_portal_url: "https://medhasoft.bihar.gov.in",
    status_evidence: ev("https://medhasoft.bihar.gov.in", "No income limit; launched 25 Apr 2018."),
    source_url: "https://medhasoft.bihar.gov.in",
  },
  {
    name_en: "Mukhyamantri Udyami Yojana",
    name_hi: "मुख्यमंत्री उद्यमी योजना",
    dept: "industries",
    categories: ["industry", "financial_inclusion"],
    launch_date: null,
    objective_en: "Promote first-generation entrepreneurship in Bihar by financing new micro/small enterprises.",
    objective_hi: "नए सूक्ष्म/लघु उद्यमों हेतु वित्त प्रदान कर बिहार में प्रथम-पीढ़ी उद्यमिता को बढ़ावा देना।",
    eligibility_en: "Permanent resident of Bihar aged 18–45, with at least class 12 / ITI / Diploma / Graduate (per component). Components for SC/ST, EBC, BC, Women and Youth. SC/ST/EBC/women loans are interest-free; general youth pay 1% simple interest.",
    eligibility_hi: "बिहार का स्थायी निवासी, आयु 18–45, न्यूनतम 12वीं / आईटीआई / डिप्लोमा / स्नातक (घटक अनुसार)। SC/ST, EBC, BC, महिला एवं युवा हेतु घटक। SC/ST/EBC/महिला ऋण ब्याज-मुक्त; सामान्य युवा 1% साधारण ब्याज।",
    benefit_type: "Loan + subsidy",
    benefit_detail: "Up to ₹10 lakh — 50% subsidy (grant, up to ₹5 lakh) + 50% loan (up to ₹5 lakh), repayable over 84 months. No collateral.",
    target_beneficiary: "Aspiring entrepreneurs in Bihar (SC/ST/EBC/BC/women/youth).",
    personas: ["self_employed_entrepreneur"], education_levels: ["senior_secondary"], gender_eligibility: "any", social_categories: [],
    min_age: 18, max_age: 45, income_ceiling: null, requires_bpl: false, domicile: "bihar",
    land_ownership: null,
    application_portal_url: "https://udyami.bihar.gov.in",
    status_evidence: ev("https://udyami.bihar.gov.in", "Online cycle reported open until ~Mar 2026; age 18–45."),
    source_url: "https://udyami.bihar.gov.in",
  },
  {
    name_en: "Mukhyamantri Vridhjan Pension Yojana",
    name_hi: "मुख्यमंत्री वृद्धजन पेंशन योजना",
    dept: "socialwelfare",
    categories: ["social_welfare"],
    launch_date: null,
    objective_en: "Monthly social-security pension for elderly residents of Bihar.",
    objective_hi: "बिहार के वृद्ध निवासियों हेतु मासिक सामाजिक-सुरक्षा पेंशन।",
    eligibility_en: "Permanent resident of Bihar aged 60 or above, not a retired government employee and not receiving any other government/family/social-security pension.",
    eligibility_hi: "बिहार का स्थायी निवासी, आयु 60 वर्ष या अधिक, जो सेवानिवृत्त सरकारी कर्मचारी न हो एवं किसी अन्य सरकारी/पारिवारिक/सामाजिक-सुरक्षा पेंशन का लाभार्थी न हो।",
    benefit_type: "Monthly pension (DBT)",
    benefit_detail: "₹400 per month for ages 60–79; ₹500 per month for ages 80 and above. Paid via Direct Benefit Transfer.",
    target_beneficiary: "Senior citizens (60+) of Bihar.",
    personas: ["senior_citizen"], education_levels: [], gender_eligibility: "any", social_categories: [],
    min_age: 60, max_age: null, income_ceiling: null, requires_bpl: false, domicile: "bihar",
    land_ownership: null,
    application_portal_url: "https://www.sspmis.bihar.gov.in",
    status_evidence: ev("https://www.sspmis.bihar.gov.in", "Age 60+; ₹400/₹500 per month by age band."),
    source_url: "https://www.sspmis.bihar.gov.in",
  },
  {
    name_en: "Bihar Laghu Udyami Yojana",
    name_hi: "बिहार लघु उद्यमी योजना",
    dept: "industries",
    categories: ["financial_inclusion", "industry"],
    launch_date: null,
    objective_en: "₹2 lakh capital support to very poor families across all communities to start a small business / self-employment.",
    objective_hi: "सभी समुदायों के अत्यंत निर्धन परिवारों को लघु व्यवसाय/स्वरोज़गार हेतु ₹2 लाख पूंजी सहायता।",
    eligibility_en: "Bihar resident aged 18–50 from a family with monthly income below ₹6,000 (all categories — General/OBC/SC/ST/Minority). Requires a current-year Bihar residence certificate.",
    eligibility_hi: "बिहार निवासी, आयु 18–50, जिसके परिवार की मासिक आय ₹6,000 से कम हो (सभी श्रेणियाँ)। चालू वर्ष का आवासीय प्रमाण-पत्र आवश्यक।",
    benefit_type: "Capital subsidy (grant)",
    benefit_detail: "₹2 lakh as a 100% subsidy (no repayment), released in three installments.",
    target_beneficiary: "Very poor families of Bihar (monthly income < ₹6,000).",
    personas: ["self_employed_entrepreneur"], education_levels: [], gender_eligibility: "any", social_categories: [],
    min_age: 18, max_age: 50, income_ceiling: 72000, requires_bpl: false, domicile: "bihar",
    land_ownership: null,
    application_portal_url: "https://udyami.bihar.gov.in",
    status_evidence: ev("https://udyami.bihar.gov.in", "Income bar < ₹6,000/month (₹72,000/yr); ₹2 lakh 100% subsidy in 3 installments. Verify the exact portal."),
    source_url: "https://udyami.bihar.gov.in",
  },
  {
    name_en: "Bihar Krishi Input Anudan Yojana",
    name_hi: "बिहार कृषि इनपुट अनुदान योजना",
    dept: "agriculture",
    categories: ["agriculture"],
    launch_date: null,
    objective_en: "Input subsidy to farmers whose crops are damaged (33% or more) by flood, drought, hailstorm or unseasonal rain.",
    objective_hi: "बाढ़, सूखा, ओलावृष्टि या बेमौसम वर्षा से 33% या अधिक फसल क्षति झेलने वाले किसानों को इनपुट अनुदान।",
    eligibility_en: "Permanent-resident farmers of Bihar (both Raiyat and Non-Raiyat) registered on the Agriculture DBT portal, whose crops suffered 33% or more damage. Typically capped at 2 hectares per farmer.",
    eligibility_hi: "बिहार के स्थायी-निवासी किसान (रैयत एवं गैर-रैयत दोनों) जो कृषि DBT पोर्टल पर पंजीकृत हों एवं जिनकी फसल को 33% या अधिक क्षति हुई हो। सामान्यतः प्रति किसान 2 हेक्टेयर तक।",
    benefit_type: "Input subsidy (DBT)",
    benefit_detail: "Per-hectare subsidy on 33%+ crop loss: ₹8,500 (un-irrigated), ₹17,000 (irrigated), ₹22,500 (perennial), up to ~2 hectares.",
    target_beneficiary: "Farmers of Bihar with crop loss.",
    personas: ["farmer"], education_levels: [], gender_eligibility: "any", social_categories: [],
    min_age: null, max_age: null, income_ceiling: null, requires_bpl: false, domicile: "bihar",
    land_ownership: "any",
    application_portal_url: "https://dbtagriculture.bihar.gov.in",
    status_evidence: ev("https://dbtagriculture.bihar.gov.in", "Raiyat + Non-Raiyat; 33%+ crop damage; per-hectare rates up to ~2 ha."),
    source_url: "https://dbtagriculture.bihar.gov.in",
  },
];

const COLS = [
  "name_en", "name_hi", "department_id", "categories", "launch_date",
  "objective_en", "objective_hi", "eligibility_en", "eligibility_hi",
  "benefit_type", "benefit_detail", "target_beneficiary",
  "personas", "education_levels", "gender_eligibility", "social_categories",
  "min_age", "max_age", "income_ceiling", "requires_bpl", "domicile", "land_ownership",
  "application_portal_url", "status", "status_evidence",
  "last_budget_year", "last_notification_date", "source_url", "last_verified",
];

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function deptId(d: Dept): Promise<string> {
  const dep = DEPTS[d];
  const existing = await query<{ id: string }>(`select id from departments where name_en = $1`, [dep.name_en]);
  if (existing[0]) return existing[0].id;
  const [row] = await query<{ id: string }>(
    `insert into departments (name_en, name_hi, website) values ($1,$2,$3) returning id`,
    [dep.name_en, dep.name_hi, dep.website]
  );
  return row.id;
}

async function main() {
  if (isDryRun) {
    console.log("DRY RUN — no DB write.\n");
    SCHEMES.forEach((s) => console.log(`${s.name_en} [${s.dept}] cats=${JSON.stringify(s.categories)}`));
    return;
  }

  const placeholders = COLS.map((_, i) => `$${i + 1}`).join(", ");
  for (const s of SCHEMES) {
    const existing = await query<{ id: string }>(`select id from schemes where name_en = $1`, [s.name_en]);
    if (existing[0]) {
      console.log(`skip (exists): ${s.name_en}`);
      continue;
    }
    const dId = await deptId(s.dept);
    const row: Record<string, unknown> = {
      ...s,
      department_id: dId,
      status: "likely_active",
      last_budget_year: null,
      last_notification_date: null,
      last_verified: ON,
    };
    const values = COLS.map((c) => row[c]);
    const [r] = await query<{ id: string }>(
      `insert into schemes (${COLS.join(", ")}) values (${placeholders}) returning id`,
      values
    );
    console.log(`inserted: ${s.name_en} → ${r.id}`);
  }
  console.log(`\nDone. ${SCHEMES.length} schemes processed.`);
}

main()
  .catch((err) => {
    console.error("Breadth seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!isDryRun) await getPool().end();
  });
