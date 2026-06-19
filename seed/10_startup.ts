/**
 * Startup ecosystem (2026-06-19): Bihar Startup Policy 2022 + its seed-fund scheme.
 * Public-sourced; conservative status; no fabricated figures. Run after 06_policies.ts.
 *   npm run seed:startup [-- --dry-run]
 * Source: udyogmitrabihar.in / startup.bihar.gov.in ; HEBE policy highlights.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const DEPT = "Industries Department, Government of Bihar";
const POLICY_SRC = "https://udyogmitrabihar.in/bihar-startup-policy-2022/";
const PORTAL = "https://startup.bihar.gov.in";
const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function deptId(): Promise<string> {
  const e = await query<{ id: string }>(`select id from departments where name_en=$1`, [DEPT]);
  if (e[0]) return e[0].id;
  const [r] = await query<{ id: string }>(
    `insert into departments (name_en, name_hi, website) values ($1,$2,$3) returning id`,
    [DEPT, "उद्योग विभाग, बिहार सरकार", "https://industries.bihar.gov.in"]
  );
  return r.id;
}

async function addPolicy(dept: string) {
  const name = "Bihar Startup Policy 2022";
  if ((await query(`select 1 from policies where name_en=$1`, [name])).length) {
    console.log(`skip policy (exists): ${name}`);
    return;
  }
  const cols = ["name_en","name_hi","department_id","summary_en","summary_hi","status","source_url","last_verified","categories","policy_type","document_url"];
  const vals = [
    name,
    "बिहार स्टार्टअप नीति 2022",
    dept,
    "Framework to build Bihar's startup ecosystem: interest-free seed funding up to ₹10 lakh (₹10.5 lakh for women; ₹11.5 lakh for SC/ST/PwD founders) over 10 years, a ₹3 lakh enhancement/training grant, plus mentoring and incubation support. Released against milestones.",
    "बिहार के स्टार्टअप पारिस्थितिकी तंत्र हेतु रूपरेखा: 10 वर्ष के लिए ₹10 लाख तक ब्याज-मुक्त सीड फंडिंग (महिला ₹10.5 लाख; SC/ST/दिव्यांग ₹11.5 लाख), ₹3 लाख प्रशिक्षण/उन्नयन अनुदान, साथ ही मेंटरिंग व इन्क्यूबेशन सहायता।",
    "active",
    POLICY_SRC,
    ON,
    ["industry"],
    "framework",
    "https://hebe.net.in/highlights-of-bihar-startup-policy-2022/",
  ];
  const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
  const [r] = await query<{ id: string }>(`insert into policies (${cols.join(", ")}) values (${ph}) returning id`, vals);
  console.log(`inserted policy: ${name} → ${r.id}`);
}

async function addScheme(dept: string) {
  const name = "Bihar Startup Fund (Seed Funding)";
  if ((await query(`select 1 from schemes where name_en=$1`, [name])).length) {
    console.log(`skip scheme (exists): ${name}`);
    return;
  }
  const row: Record<string, unknown> = {
    name_en: name,
    name_hi: "बिहार स्टार्टअप फंड (सीड फंडिंग)",
    department_id: dept,
    categories: ["industry", "financial_inclusion"],
    launch_date: null,
    objective_en: "Seed capital and support for innovative early-stage startups registered and operating in Bihar.",
    objective_hi: "बिहार में पंजीकृत व संचालित नवाचारी प्रारंभिक-चरण स्टार्टअप हेतु सीड पूंजी एवं सहायता।",
    eligibility_en: "A startup registered and operating in Bihar with an innovative, scalable business model (per the Bihar Startup Policy 2022). Founder eligibility and registration details to be confirmed at the portal.",
    eligibility_hi: "बिहार में पंजीकृत व संचालित स्टार्टअप जिसका व्यवसाय मॉडल नवाचारी व मापनीय हो (बिहार स्टार्टअप नीति 2022 अनुसार)। संस्थापक पात्रता व पंजीकरण विवरण पोर्टल से पुष्टि करें।",
    benefit_type: "Interest-free seed loan + grant",
    benefit_detail: "Interest-free seed funding up to ₹10 lakh over 10 years (₹10.5 lakh for women; ₹11.5 lakh for SC/ST/PwD founders), plus up to ₹3 lakh enhancement/training grant. Released against milestones.",
    target_beneficiary: "Early-stage startups in Bihar.",
    personas: ["self_employed_entrepreneur"],
    education_levels: [],
    gender_eligibility: "any",
    social_categories: [],
    min_age: null,
    max_age: null,
    income_ceiling: null,
    requires_bpl: false,
    domicile: "bihar",
    is_for_disabled: false,
    is_for_startups: true,
    land_ownership: null,
    application_portal_url: PORTAL,
    status: "likely_active",
    status_evidence:
      `Seeded ${ON} as 'likely_active': startup portal live; benefit figures from the Bihar Startup ` +
      `Policy 2022 highlights — cross-check current terms at the portal. Scheme-line budget not verified. ` +
      `Source: ${PORTAL} ; ${POLICY_SRC}`,
    last_budget_year: null,
    last_notification_date: null,
    source_url: PORTAL,
    last_verified: ON,
  };
  const cols = Object.keys(row);
  const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
  const [r] = await query<{ id: string }>(`insert into schemes (${cols.join(", ")}) values (${ph}) returning id`, cols.map((c) => row[c]));
  console.log(`inserted scheme: ${name} → ${r.id}`);
}

async function main() {
  if (isDryRun) {
    console.log("DRY RUN — would add Bihar Startup Policy 2022 + Bihar Startup Fund (Seed Funding).");
    return;
  }
  const dept = await deptId();
  await addPolicy(dept);
  await addScheme(dept);
  console.log("Done.");
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
