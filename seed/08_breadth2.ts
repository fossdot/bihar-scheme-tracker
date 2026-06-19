/**
 * Breadth pass 2 (2026-06-19) — three more public-sourced schemes, incl. a disability pension
 * (exercises is_for_disabled). Same principles as 07_breadth.ts: conservative 'likely_active',
 * sourced figures, structured eligibility only where stated. Run after 07_breadth.ts.
 *   npm run seed:breadth2 [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const DEPTS = {
  education: { name_en: "Education Department, Government of Bihar", name_hi: "शिक्षा विभाग, बिहार सरकार", website: "https://education.bihar.gov.in" },
  socialwelfare: { name_en: "Social Welfare Department, Government of Bihar", name_hi: "समाज कल्याण विभाग, बिहार सरकार", website: "https://state.bihar.gov.in/socialwelfare" },
} as const;
type Dept = keyof typeof DEPTS;
type S = Record<string, unknown> & { name_en: string; dept: Dept };

const ev = (portal: string, extra: string) =>
  `Seeded ${ON} as 'likely_active': portal live / a recent 2025-26 cycle reported. Scheme-line budget NOT verified. ` +
  `Facts from public reporting — cross-check against the official portal. ${extra} Source: ${portal}`;

const SCHEMES: S[] = [
  {
    name_en: "Mukhyamantri Kanya Vivah Yojana",
    name_hi: "मुख्यमंत्री कन्या विवाह योजना",
    dept: "socialwelfare",
    categories: ["social_welfare", "women_child"],
    launch_date: null,
    objective_en: "Financial assistance to economically weaker families for a daughter's marriage, and to promote marriage registration.",
    objective_hi: "आर्थिक रूप से कमज़ोर परिवारों को बेटी के विवाह हेतु वित्तीय सहायता एवं विवाह पंजीकरण को बढ़ावा।",
    eligibility_en: "Bride must be a resident of Bihar, at least 18 (groom at least 21), from a family with annual income up to ₹60,000. The marriage must be legally registered (and solemnised after 22 Nov 2007).",
    eligibility_hi: "वधू बिहार निवासी, आयु कम से कम 18 (वर कम से कम 21), परिवार की वार्षिक आय ₹60,000 तक। विवाह विधिवत पंजीकृत हो (एवं 22 नवम्बर 2007 के बाद संपन्न)।",
    benefit_type: "Cash assistance (DBT)",
    benefit_detail: "₹10,000 reported (sources vary ₹5,000–₹10,000) paid to the family on registered marriage. Verify the current amount at the portal.",
    target_beneficiary: "Daughters of economically weaker families in Bihar.",
    personas: [], education_levels: [], gender_eligibility: "female", social_categories: [],
    min_age: 18, max_age: null, income_ceiling: 60000, requires_bpl: false, domicile: "bihar",
    is_for_disabled: false, land_ownership: null,
    application_portal_url: "https://serviceonline.bihar.gov.in",
    status_evidence: ev("https://serviceonline.bihar.gov.in", "Bride 18+, income ≤ ₹60,000/yr, registered marriage."),
    source_url: "https://serviceonline.bihar.gov.in",
  },
  {
    name_en: "Mukhyamantri Divyangjan Pension Yojana",
    name_hi: "मुख्यमंत्री दिव्यांगजन पेंशन योजना",
    dept: "socialwelfare",
    categories: ["social_welfare"],
    launch_date: null,
    objective_en: "Monthly social-security pension for persons with disabilities resident in Bihar.",
    objective_hi: "बिहार में निवासरत दिव्यांगजनों हेतु मासिक सामाजिक-सुरक्षा पेंशन।",
    eligibility_en: "Permanent resident of Bihar who is a person with disability (a disability certificate is typically required), not a retired government employee and not receiving any other government/social-security pension. Confirm the minimum disability percentage at the source.",
    eligibility_hi: "बिहार का स्थायी निवासी दिव्यांगजन (सामान्यतः दिव्यांगता प्रमाण-पत्र आवश्यक), जो सेवानिवृत्त सरकारी कर्मचारी न हो एवं किसी अन्य सरकारी/सामाजिक-सुरक्षा पेंशन का लाभार्थी न हो। न्यूनतम दिव्यांगता प्रतिशत स्रोत से सत्यापित करें।",
    benefit_type: "Monthly pension (DBT)",
    benefit_detail: "₹1,100 per month (raised from ₹400 in July 2025). Paid via Direct Benefit Transfer.",
    target_beneficiary: "Persons with disabilities in Bihar.",
    personas: [], education_levels: [], gender_eligibility: "any", social_categories: [],
    min_age: null, max_age: null, income_ceiling: null, requires_bpl: false, domicile: "bihar",
    is_for_disabled: true, land_ownership: null,
    application_portal_url: "https://www.sspmis.bihar.gov.in",
    status_evidence: ev("https://www.sspmis.bihar.gov.in", "Persons with disabilities; ₹1,100/month from Jul 2025."),
    source_url: "https://www.sspmis.bihar.gov.in",
  },
  {
    name_en: "Mukhyamantri Balak/Balika Cycle Yojana",
    name_hi: "मुख्यमंत्री बालक/बालिका साइकिल योजना",
    dept: "education",
    categories: ["education"],
    launch_date: null,
    objective_en: "A grant to Class 9 students in government secondary schools to buy a bicycle, reducing distance-related dropout.",
    objective_hi: "सरकारी माध्यमिक विद्यालयों के कक्षा 9 के विद्यार्थियों को साइकिल खरीदने हेतु अनुदान, ताकि दूरी के कारण होने वाले ड्रॉपआउट को कम किया जा सके।",
    eligibility_en: "Students (girls and boys) enrolled in Class 9 in a Bihar government secondary school.",
    eligibility_hi: "बिहार के सरकारी माध्यमिक विद्यालय में कक्षा 9 में नामांकित विद्यार्थी (बालक एवं बालिका)।",
    benefit_type: "Cash grant (DBT)",
    benefit_detail: "₹3,000 transferred to the student's account to purchase a bicycle.",
    target_beneficiary: "Class 9 students in Bihar government schools.",
    personas: ["student"], education_levels: [], gender_eligibility: "any", social_categories: [],
    min_age: null, max_age: null, income_ceiling: null, requires_bpl: false, domicile: "bihar",
    is_for_disabled: false, land_ownership: null,
    application_portal_url: "https://medhasoft.bihar.gov.in",
    status_evidence: ev("https://medhasoft.bihar.gov.in", "Class 9 govt-school students; ₹3,000 for a bicycle."),
    source_url: "https://medhasoft.bihar.gov.in",
  },
];

const COLS = [
  "name_en","name_hi","department_id","categories","launch_date","objective_en","objective_hi",
  "eligibility_en","eligibility_hi","benefit_type","benefit_detail","target_beneficiary",
  "personas","education_levels","gender_eligibility","social_categories","min_age","max_age",
  "income_ceiling","requires_bpl","domicile","is_for_disabled","land_ownership",
  "application_portal_url","status","status_evidence","last_budget_year","last_notification_date",
  "source_url","last_verified",
];
const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function deptId(d: Dept): Promise<string> {
  const dep = DEPTS[d];
  const e = await query<{ id: string }>(`select id from departments where name_en = $1`, [dep.name_en]);
  if (e[0]) return e[0].id;
  const [row] = await query<{ id: string }>(
    `insert into departments (name_en, name_hi, website) values ($1,$2,$3) returning id`,
    [dep.name_en, dep.name_hi, dep.website]
  );
  return row.id;
}

async function main() {
  if (isDryRun) { SCHEMES.forEach((s) => console.log(s.name_en)); return; }
  const ph = COLS.map((_, i) => `$${i + 1}`).join(", ");
  for (const s of SCHEMES) {
    const exists = await query<{ id: string }>(`select id from schemes where name_en = $1`, [s.name_en]);
    if (exists[0]) { console.log(`skip (exists): ${s.name_en}`); continue; }
    const row: Record<string, unknown> = {
      ...s, department_id: await deptId(s.dept), status: "likely_active",
      last_budget_year: null, last_notification_date: null, last_verified: ON,
    };
    const [r] = await query<{ id: string }>(
      `insert into schemes (${COLS.join(", ")}) values (${ph}) returning id`,
      COLS.map((c) => row[c])
    );
    console.log(`inserted: ${s.name_en} → ${r.id}`);
  }
  console.log(`\nDone. ${SCHEMES.length} schemes processed.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
