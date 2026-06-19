/**
 * Verification pass (2026-06-18) — fills verified, sourced fields and derives status
 * from evidence for the three MVP schemes. Run AFTER seed.ts.
 *
 *   npm run seed:verify -- --dry-run
 *   npm run seed:verify
 *
 * Principles held (CLAUDE.md):
 *   - Status is DERIVED from evidence, never asserted. status_evidence records exactly
 *     what was checked, with sources.
 *   - No invented figures. Where authoritative scheme-line budget figures could not be
 *     located (PRS 2026-27 does not break these schemes out; primary budget.bihar.gov.in
 *     demand-for-grants PDFs not parsed yet), NO budget_allocations rows are created.
 *     The one credible signal (₹300 cr FY2025-26 sanction → ₹900 cr cumulative to BSEFC
 *     for BSCC) is a release, not a budget estimate, so it lives in status_evidence only.
 *   - Genuine uncertainty (KYP upper age limit) is flagged, not resolved by guessing.
 *
 * Sources used this pass:
 *   - https://saran.nic.in/scheme/bihar-student-credit-card-yojana/        (BSCC, gov NIC)
 *   - https://www.drishtiias.com/state-pcs-current-affairs/bihar-student-credit-card-scheme (BSCC ₹300cr/₹900cr, Aug 2025)
 *   - https://muzaffarpur.nic.in/scheme/chief-minister-nishchay-self-help-allowance-scheme/ (MNSSBY, gov NIC)
 *   - https://www.7nishchay-yuvaupmission.bihar.gov.in/  + /guidelines     (portal — applications live)
 *   - https://prsindia.org/budgets/states/bihar-budget-analysis-2026-27    (checked; no scheme-line figures)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getPool, query } from "../lib/db";

const VERIFIED_ON = "2026-06-18";

const PORTAL = "https://www.7nishchay-yuvaupmission.bihar.gov.in/";
const GUIDELINES = "https://www.7nishchay-yuvaupmission.bihar.gov.in/guidelines";
const SARAN_BSCC = "https://saran.nic.in/scheme/bihar-student-credit-card-yojana/";
const DRISHTI_BSCC = "https://www.drishtiias.com/state-pcs-current-affairs/bihar-student-credit-card-scheme";
const MUZ_MNSSBY = "https://muzaffarpur.nic.in/scheme/chief-minister-nishchay-self-help-allowance-scheme/";
const PRS_2627 = "https://prsindia.org/budgets/states/bihar-budget-analysis-2026-27";

type Status =
  | "active"
  | "likely_active"
  | "dormant"
  | "subsumed"
  | "superseded"
  | "lapsed"
  | "unknown";

type Update = {
  match_name_en: string;
  objective_en: string;
  objective_hi: string;
  eligibility_en: string;
  eligibility_hi: string;
  benefit_type: string;
  benefit_detail: string;
  target_beneficiary: string;
  launch_date: string | null;
  status: Status;
  status_evidence: string;
  last_budget_year: string | null;
  last_notification_date: string | null;
  last_verified: string;
};

const UPDATES: Update[] = [
  {
    match_name_en: "Bihar Student Credit Card Scheme",
    objective_en:
      "Financial support, through the banking system, for students from Bihar who have passed class 12 (Intermediate) but cannot pursue higher education due to financial constraints.",
    objective_hi:
      "बैंकिंग प्रणाली के माध्यम से बिहार के उन विद्यार्थियों को वित्तीय सहायता जिन्होंने 12वीं (इंटरमीडिएट) उत्तीर्ण की है परन्तु आर्थिक कारणों से उच्च शिक्षा प्राप्त नहीं कर पा रहे हैं।",
    eligibility_en:
      "Permanent resident of Bihar who has passed Intermediate/class 12 from a Bihar government-recognised institution and intends to pursue higher education.",
    eligibility_hi:
      "बिहार का स्थायी निवासी जिसने राज्य सरकार से मान्यता प्राप्त संस्थान से इंटरमीडिएट/12वीं उत्तीर्ण की हो और उच्च शिक्षा प्राप्त करना चाहता हो।",
    benefit_type: "Education loan",
    benefit_detail:
      "Education loan of up to ₹4 lakh for higher-education courses. Widely reported as interest-free (national myScheme registry; 2025 state reform) — confirm current interest terms against the primary source.",
    target_beneficiary:
      "Students from Bihar who have passed class 12 and intend to pursue higher education.",
    launch_date: "2016-10-02",
    status: "active",
    status_evidence:
      `Determined ACTIVE on ${VERIFIED_ON}. Evidence: ₹300 crore third installment released to the ` +
      `Bihar State Education Finance Corporation in FY2025-26 (cumulative ₹900 cr) per Drishti IAS (Aug 2025); ` +
      `application portal live and accepting applications; scheme continues under the Saat Nishchay-3 vision in ` +
      `the FY2026-27 budget. Caveat: this ₹300 cr is a sanction/release, NOT a confirmed budget-estimate line, and ` +
      `no dedicated FY2026-27 scheme-line was found in the PRS 2026-27 analysis — primary scheme-wise BE/RE from ` +
      `budget.bihar.gov.in still to be extracted. Sources: ${DRISHTI_BSCC} ; ${SARAN_BSCC} ; ${PORTAL} ; ${PRS_2627}`,
    last_budget_year: "2025-26",
    last_notification_date: null,
    last_verified: VERIFIED_ON,
  },
  {
    match_name_en: "Mukhyamantri Nishchay Swayam Sahayata Bhatta (MNSSBY)",
    objective_en:
      "Financial support to unemployed youth of Bihar while they search for employment.",
    objective_hi:
      "रोज़गार की तलाश के दौरान बिहार के बेरोज़गार युवाओं को वित्तीय सहायता।",
    eligibility_en:
      "Permanent resident of Bihar aged 20–25, unemployed and actively seeking work, who has passed class 12 but is not enrolled in higher education. Enrolment in Kushal Yuva Program training is mandatory.",
    eligibility_hi:
      "बिहार का स्थायी निवासी, आयु 20–25 वर्ष, बेरोज़गार एवं रोज़गार की तलाश में, जिसने 12वीं उत्तीर्ण की हो परन्तु उच्च शिक्षा में नामांकित न हो। कुशल युवा कार्यक्रम प्रशिक्षण में नामांकन अनिवार्य।",
    benefit_type: "Monthly cash allowance",
    benefit_detail: "₹1,000 per month for a maximum period of two years.",
    target_beneficiary:
      "Unemployed youth of Bihar aged 20–25 searching for employment.",
    launch_date: "2016-10-02",
    status: "likely_active",
    status_evidence:
      `Determined LIKELY_ACTIVE on ${VERIFIED_ON}. Evidence: application portal live and accepting applications; ` +
      `described as current on Bihar government district portals. No scheme-wise budget line found in the PRS 2026-27 ` +
      `analysis, and no credible scheme-level allocation figure located (an aggregator-cited "₹62,000 cr" figure was ` +
      `implausible and rejected). Sources: ${MUZ_MNSSBY} ; ${PORTAL} ; ${PRS_2627}`,
    last_budget_year: null,
    last_notification_date: null,
    last_verified: VERIFIED_ON,
  },
  {
    match_name_en: "Kushal Yuva Program (KYP)",
    objective_en:
      "Employability training for youth in Bihar — Hindi & English communication, basic computer skills, and soft/behavioural skills.",
    objective_hi:
      "बिहार के युवाओं हेतु रोज़गार-योग्यता प्रशिक्षण — हिंदी व अंग्रेज़ी संवाद, बुनियादी कंप्यूटर कौशल, एवं सॉफ्ट/व्यवहार कौशल।",
    eligibility_en:
      "Youth in Bihar who have passed at least class 10 and are not in formal education. Note: sources differ on the upper age limit (15–25 vs 15–28) — confirm against the KYP guideline (rev. 22/02/2017).",
    eligibility_hi:
      "बिहार के युवा जिन्होंने कम से कम 10वीं उत्तीर्ण की हो और औपचारिक शिक्षा में न हों। नोट: ऊपरी आयु-सीमा पर स्रोतों में भिन्नता (15–25 बनाम 15–28) — KYP दिशानिर्देश (संशोधन 22/02/2017) से पुष्टि करें।",
    benefit_type: "Skill training",
    benefit_detail:
      "Approximately 240 hours of training covering language & communication, basic computer skills, and soft skills. Completion is mandatory for MNSSBY allowance beneficiaries.",
    target_beneficiary:
      "Youth in Bihar (class 10 passed, not in formal education) seeking employability skills.",
    launch_date: null, // launched ~2 Oct 2016 with the cluster; guideline rev. 22/02/2017. Exact date unconfirmed.
    status: "likely_active",
    status_evidence:
      `Determined LIKELY_ACTIVE on ${VERIFIED_ON}. Evidence: operational via the live portal and mandatory for MNSSBY ` +
      `allowance beneficiaries (per Bihar government district portals). No scheme-wise budget figure located in the ` +
      `PRS 2026-27 analysis. Open item: eligibility upper-age limit unresolved across sources (15–25 vs 15–28); ` +
      `exact launch date unconfirmed (guideline revised 22/02/2017). Sources: ${MUZ_MNSSBY} ; ${GUIDELINES} ; ${PORTAL} ; ${PRS_2627}`,
    last_budget_year: null,
    last_notification_date: null,
    last_verified: VERIFIED_ON,
  },
];

const SET_COLS = [
  "objective_en",
  "objective_hi",
  "eligibility_en",
  "eligibility_hi",
  "benefit_type",
  "benefit_detail",
  "target_beneficiary",
  "launch_date",
  "status",
  "status_evidence",
  "last_budget_year",
  "last_notification_date",
  "last_verified",
];

const isDryRun =
  process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log(
      "DRY RUN — no DB connection. (Set DATABASE_URL and drop --dry-run to write.)\n"
    );
    UPDATES.forEach((u) =>
      console.log(
        `Would set ${u.match_name_en} → status='${u.status}', last_verified=${u.last_verified}\n`,
        JSON.stringify(u, null, 2),
        "\n"
      )
    );
    console.log(
      "0 budget_allocations rows (no authoritative scheme-line BE/RE located — see status_evidence)."
    );
    return;
  }

  // SET clause: $1..$N for SET_COLS, then name_en match as the last placeholder.
  const setClause = SET_COLS.map((c, i) => `${c} = $${i + 1}`).join(", ");
  const nameParam = `$${SET_COLS.length + 1}`;

  for (const u of UPDATES) {
    const values = [
      u.objective_en,
      u.objective_hi,
      u.eligibility_en,
      u.eligibility_hi,
      u.benefit_type,
      u.benefit_detail,
      u.target_beneficiary,
      u.launch_date,
      u.status,
      u.status_evidence,
      u.last_budget_year,
      u.last_notification_date,
      u.last_verified,
      u.match_name_en,
    ];
    const rows = await query<{ id: string }>(
      `update schemes set ${setClause} where name_en = ${nameParam} returning id`,
      values
    );
    if (rows.length === 0) {
      console.warn(`!! no match for "${u.match_name_en}" — run seed.ts first?`);
    } else {
      console.log(`updated: ${u.match_name_en} → ${u.status} (${rows[0].id})`);
    }
  }

  console.log(
    "\nVerification pass done. budget_allocations intentionally left empty until " +
      "primary scheme-wise BE/RE is extracted from budget.bihar.gov.in."
  );
}

main()
  .catch((err) => {
    console.error("Verify pass failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!isDryRun) await getPool().end();
  });
