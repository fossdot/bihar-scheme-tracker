/**
 * Seed: the three Saat Nischay youth/employment MVP schemes (see CLAUDE.md).
 *
 * Guardrails this script deliberately follows:
 *   - status is ALWAYS 'unknown' here. Status is derived from budget/notification
 *     evidence later — never asserted at seed time.
 *   - NO figures are invented. Amounts, eligibility ages, launch/notification dates,
 *     and budget allocations are left as TODO_* placeholders (text fields) or null
 *     (date/numeric/budget rows), each pointing at the source to verify against.
 *   - Every row carries a real, reachable source_url.
 *   - last_verified is null: nothing here has been verified yet, so claiming a
 *     verification date would be dishonest.
 *
 * Run:
 *   npm run seed -- --dry-run     # build + print payloads, no DB connection
 *   npm run seed                  # writes to local Postgres (needs DATABASE_URL)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getPool, query } from "../lib/db";
import type { SchemeCategory } from "../lib/types";

const TODO = (what: string, url: string) =>
  `TODO — verify/extract ${what} from primary source (likely Hindi): ${url}`;

const PORTAL = "https://www.7nishchay-yuvaupmission.bihar.gov.in/";
const GUIDELINES = "https://www.7nishchay-yuvaupmission.bihar.gov.in/guidelines";
const MYSCHEME_BSCC = "https://www.myscheme.gov.in/schemes/bsccs";

const SEEDED_ON = "2026-06-18"; // record-keeping only; not a verification date.

/**
 * One umbrella department: all three are administered through the 7 Nischay
 * Yuva Upmission portal. The precise line department per scheme (Education vs.
 * Labour Resources vs. Planning) still needs confirmation — flagged in evidence.
 */
const DEPARTMENT = {
  name_en: "Saat Nischay — Yuva Upmission (Government of Bihar)",
  name_hi: "सात निश्चय — युवा उपमिशन (बिहार सरकार)",
  website: PORTAL,
};

type SeedScheme = {
  name_en: string;
  name_hi: string;
  categories: SchemeCategory[]; // structured eligibility (personas/age/…) is filled by 03_eligibility.ts

  objective_en: string;
  objective_hi: string;
  eligibility_en: string;
  eligibility_hi: string;
  benefit_type: string;
  benefit_detail: string;
  target_beneficiary: string;
  application_portal_url: string;
  status: "unknown";
  status_evidence: string;
  launch_date: null;
  last_budget_year: null;
  last_notification_date: null;
  source_url: string;
  last_verified: null;
};

const evidence = (extra: string) =>
  `Seeded ${SEEDED_ON} as 'unknown' — no budget line (budget.bihar.gov.in) or ` +
  `recent notification has been checked yet. Before changing status, verify: ` +
  `current-FY allocation, launch date, and benefit/eligibility figures. ${extra}`;

const SCHEMES: SeedScheme[] = [
  {
    name_en: "Bihar Student Credit Card Scheme",
    name_hi: "बिहार स्टूडेंट क्रेडिट कार्ड योजना",
    // CLAUDE.md tags this "employment/education"; modelling as education (it is an
    // education loan). Revisit if cross-cluster filtering needs it under employment.
    categories: ["education"],
    objective_en: TODO("objective", MYSCHEME_BSCC),
    objective_hi: TODO("objective (Hindi)", MYSCHEME_BSCC),
    eligibility_en: TODO("eligibility criteria", MYSCHEME_BSCC),
    eligibility_hi: TODO("eligibility criteria (Hindi)", MYSCHEME_BSCC),
    benefit_type: TODO("benefit type (loan?)", MYSCHEME_BSCC),
    benefit_detail: TODO("loan amount, interest terms, covered courses", MYSCHEME_BSCC),
    target_beneficiary: TODO("target beneficiary", MYSCHEME_BSCC),
    application_portal_url: PORTAL,
    status: "unknown",
    status_evidence: evidence(`Primary: ${PORTAL} ; registry: ${MYSCHEME_BSCC}`),
    launch_date: null,
    last_budget_year: null,
    last_notification_date: null,
    source_url: PORTAL,
    last_verified: null,
  },
  {
    name_en: "Mukhyamantri Nishchay Swayam Sahayata Bhatta (MNSSBY)",
    name_hi: "मुख्यमंत्री निश्चय स्वयं सहायता भत्ता योजना",
    categories: ["employment"], // unemployment allowance for job-seeking youth.
    objective_en: TODO("objective", GUIDELINES),
    objective_hi: TODO("objective (Hindi)", GUIDELINES),
    eligibility_en: TODO("eligibility (age band, residency, qualification)", GUIDELINES),
    eligibility_hi: TODO("eligibility (Hindi)", GUIDELINES),
    benefit_type: TODO("benefit type (cash allowance?)", GUIDELINES),
    benefit_detail: TODO("monthly amount and duration", GUIDELINES),
    target_beneficiary: TODO("target beneficiary", GUIDELINES),
    application_portal_url: PORTAL,
    status: "unknown",
    status_evidence: evidence(`Primary: ${PORTAL} ; guidelines: ${GUIDELINES}`),
    launch_date: null,
    last_budget_year: null,
    last_notification_date: null,
    source_url: PORTAL,
    last_verified: null,
  },
  {
    name_en: "Kushal Yuva Program (KYP)",
    name_hi: "कुशल युवा कार्यक्रम",
    categories: ["skilling", "employment"], // employability/skilling training.
    objective_en: TODO("objective", GUIDELINES),
    objective_hi: TODO("objective (Hindi)", GUIDELINES),
    eligibility_en: TODO("eligibility (age band, qualification)", GUIDELINES),
    eligibility_hi: TODO("eligibility (Hindi)", GUIDELINES),
    benefit_type: TODO("benefit type (training?)", GUIDELINES),
    benefit_detail: TODO("training content (computer/communication/soft skills), duration", GUIDELINES),
    target_beneficiary: TODO("target beneficiary", GUIDELINES),
    application_portal_url: PORTAL,
    status: "unknown",
    status_evidence: evidence(`Primary: ${PORTAL} ; guidelines: ${GUIDELINES}`),
    launch_date: null,
    last_budget_year: null,
    last_notification_date: null,
    source_url: PORTAL,
    last_verified: null,
  },
];

const isDryRun =
  process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

const SCHEME_COLS = [
  "name_en",
  "name_hi",
  "department_id",
  "categories",
  "objective_en",
  "objective_hi",
  "eligibility_en",
  "eligibility_hi",
  "benefit_type",
  "benefit_detail",
  "target_beneficiary",
  "application_portal_url",
  "status",
  "status_evidence",
  "launch_date",
  "last_budget_year",
  "last_notification_date",
  "source_url",
  "last_verified",
];

async function main() {
  if (isDryRun) {
    console.log(
      "DRY RUN — no DB connection. (Set DATABASE_URL and drop --dry-run to write.)\n"
    );
    console.log("Department:\n", JSON.stringify(DEPARTMENT, null, 2), "\n");
    SCHEMES.forEach((s) =>
      console.log(`Scheme — ${s.name_en}:\n`, JSON.stringify(s, null, 2), "\n")
    );
    console.log(
      `Would upsert 1 department + ${SCHEMES.length} schemes. ` +
        "0 budget_allocations (none verified — the status spine is filled later)."
    );
    return;
  }

  // --- department: find-or-create by name_en ---
  let departmentId: string;
  const existingDept = await query<{ id: string }>(
    `select id from departments where name_en = $1`,
    [DEPARTMENT.name_en]
  );
  if (existingDept[0]) {
    departmentId = existingDept[0].id;
    console.log(`department exists → ${departmentId}`);
  } else {
    const [row] = await query<{ id: string }>(
      `insert into departments (name_en, name_hi, website) values ($1, $2, $3) returning id`,
      [DEPARTMENT.name_en, DEPARTMENT.name_hi, DEPARTMENT.website]
    );
    departmentId = row.id;
    console.log(`department inserted → ${departmentId}`);
  }

  // --- schemes: skip if already present (idempotent, non-destructive) ---
  const placeholders = SCHEME_COLS.map((_, i) => `$${i + 1}`).join(", ");
  for (const s of SCHEMES) {
    const existing = await query<{ id: string }>(
      `select id from schemes where name_en = $1`,
      [s.name_en]
    );
    if (existing[0]) {
      console.log(`skip (exists): ${s.name_en} → ${existing[0].id}`);
      continue;
    }
    const values = [
      s.name_en,
      s.name_hi,
      departmentId,
      s.categories,
      s.objective_en,
      s.objective_hi,
      s.eligibility_en,
      s.eligibility_hi,
      s.benefit_type,
      s.benefit_detail,
      s.target_beneficiary,
      s.application_portal_url,
      s.status,
      s.status_evidence,
      s.launch_date,
      s.last_budget_year,
      s.last_notification_date,
      s.source_url,
      s.last_verified,
    ];
    const [row] = await query<{ id: string }>(
      `insert into schemes (${SCHEME_COLS.join(", ")}) values (${placeholders}) returning id`,
      values
    );
    console.log(`inserted: ${s.name_en} → ${row.id}`);
  }

  console.log(
    "\nDone. All schemes seeded with status='unknown'. " +
      "Next: verify fields against source_url, then populate budget_allocations."
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!isDryRun) await getPool().end();
  });
