/**
 * More schemes + umbrella frameworks + mapping (2026-06-19). Adds the Bihar Krishi Road Map and
 * the Social Security Pension umbrella, a few more schemes, and links the agriculture + pension
 * schemes under their frameworks. Public-sourced, conservative status, no fabricated figures.
 *   npm run seed:more [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";

const DEPTS: Record<string, { en: string; hi: string; web: string }> = {
  agriculture: { en: "Department of Agriculture, Government of Bihar", hi: "कृषि विभाग, बिहार सरकार", web: "https://dbtagriculture.bihar.gov.in" },
  socialwelfare: { en: "Social Welfare Department, Government of Bihar", hi: "समाज कल्याण विभाग, बिहार सरकार", web: "https://state.bihar.gov.in/socialwelfare" },
  rural: { en: "Rural Development Department, Government of Bihar", hi: "ग्रामीण विकास विभाग, बिहार सरकार", web: "https://rdd.bihar.gov.in" },
  revenue: { en: "Revenue & Land Reforms Department, Government of Bihar", hi: "राजस्व एवं भूमि सुधार विभाग, बिहार सरकार", web: "https://state.bihar.gov.in/lrc" },
};
type DeptKey = keyof typeof DEPTS;

async function deptId(d: DeptKey): Promise<string> {
  const dep = DEPTS[d];
  const e = await query<{ id: string }>(`select id from departments where name_en=$1`, [dep.en]);
  if (e[0]) return e[0].id;
  const [r] = await query<{ id: string }>(`insert into departments (name_en,name_hi,website) values ($1,$2,$3) returning id`, [dep.en, dep.hi, dep.web]);
  return r.id;
}

// ── Umbrella policies ──
const POLICIES: { name_en: string; name_hi: string; dept: DeptKey; summary_en: string; summary_hi: string; categories: string[]; type: string; src: string }[] = [
  {
    name_en: "Bihar Krishi Road Map (Agriculture Roadmap)", name_hi: "बिहार कृषि रोड मैप",
    dept: "agriculture", categories: ["agriculture"], type: "framework",
    summary_en: "Bihar's multi-year agriculture framework coordinating input subsidies, mechanisation, horticulture, irrigation and farmer income support across the farm sector.",
    summary_hi: "बिहार की बहु-वर्षीय कृषि रूपरेखा जो इनपुट अनुदान, यंत्रीकरण, बागवानी, सिंचाई एवं किसान आय-सहायता का समन्वय करती है।",
    src: "https://krishi.bih.nic.in",
  },
  {
    name_en: "Bihar Social Security Pensions (SSPMIS)", name_hi: "बिहार सामाजिक सुरक्षा पेंशन (SSPMIS)",
    dept: "socialwelfare", categories: ["social_welfare"], type: "mission",
    summary_en: "The state's social-security pension framework (delivered via SSPMIS) covering the elderly, persons with disabilities and widows through monthly DBT pensions.",
    summary_hi: "राज्य की सामाजिक-सुरक्षा पेंशन रूपरेखा (SSPMIS के माध्यम से) जो वृद्धजनों, दिव्यांगजनों एवं विधवाओं को मासिक DBT पेंशन देती है।",
    src: "https://www.sspmis.bihar.gov.in",
  },
];

// ── More schemes ──
type S = Record<string, unknown> & { name_en: string; dept: DeptKey; portal: string };
const ev = (portal: string) => `Seeded ${ON} as 'likely_active': active state scheme per public listings. Figures REPORTED — verify current terms at ${portal}. Scheme-line budget not verified.`;
const mk = (s: Partial<S> & Pick<S, "name_en" | "name_hi" | "dept" | "categories" | "objective_en" | "objective_hi" | "eligibility_en" | "eligibility_hi" | "benefit_type" | "benefit_detail" | "target_beneficiary" | "portal">): S => ({
  personas: [], education_levels: [], gender_eligibility: "any", social_categories: [], min_age: null, max_age: null,
  income_ceiling: null, requires_bpl: false, domicile: "bihar", is_for_disabled: false, is_for_startups: false, land_ownership: null, ...s,
});

const SCHEMES: S[] = [
  mk({ name_en: "Laxmibai Social Security (Widow) Pension Yojana", name_hi: "लक्ष्मीबाई सामाजिक सुरक्षा (विधवा) पेंशन योजना", dept: "socialwelfare", categories: ["social_welfare", "women_child"],
    objective_en: "Monthly social-security pension for widows in Bihar.", objective_hi: "बिहार की विधवाओं हेतु मासिक सामाजिक-सुरक्षा पेंशन।",
    eligibility_en: "Widow, permanent resident of Bihar, typically aged 18+, from a BPL/eligible family (verify criteria at SSPMIS).", eligibility_hi: "विधवा, बिहार की स्थायी निवासी, सामान्यतः 18+ आयु, BPL/पात्र परिवार से (मानदंड SSPMIS पर सत्यापित करें)।",
    benefit_type: "Monthly pension (DBT)", benefit_detail: "Reported ₹400/month (recently raised to ₹1,100 along with other social-security pensions). Verify current rate.", target_beneficiary: "Widows of Bihar.",
    personas: ["widow"], gender_eligibility: "female", min_age: 18, portal: "https://www.sspmis.bihar.gov.in" }),
  mk({ name_en: "Bihar Shatabdi Niji Nalkoop Yojana", name_hi: "बिहार शताब्दी निजी नलकूप योजना", dept: "agriculture", categories: ["agriculture"],
    objective_en: "Subsidy to farmers for installing private tubewells for irrigation.", objective_hi: "सिंचाई हेतु निजी नलकूप लगाने के लिए किसानों को अनुदान।",
    eligibility_en: "Farmers of Bihar (Raiyat/non-Raiyat) needing irrigation; minimum landholding criteria may apply.", eligibility_hi: "सिंचाई हेतु इच्छुक बिहार के किसान (रैयत/गैर-रैयत); न्यूनतम भूधारिता मानदंड लागू हो सकते हैं।",
    benefit_type: "Tubewell subsidy", benefit_detail: "Reported 50–80% subsidy (₹15,000–₹35,000 per farmer). Verify current rates.", target_beneficiary: "Farmers of Bihar needing irrigation.",
    personas: ["farmer"], land_ownership: "any", portal: "https://mwrd.bihar.gov.in" }),
  mk({ name_en: "Bihar Vaas Bhoomi Yojana", name_hi: "बिहार वास भूमि योजना", dept: "revenue", categories: ["housing", "social_welfare"],
    objective_en: "Free homestead land to landless rural poor families (priority to Mahadalit/SC/ST).", objective_hi: "भूमिहीन ग्रामीण निर्धन परिवारों को नि:शुल्क वास भूमि (महादलित/SC/ST को प्राथमिकता)।",
    eligibility_en: "Landless rural BPL families of Bihar without homestead land.", eligibility_hi: "वास भूमि से वंचित बिहार के भूमिहीन ग्रामीण BPL परिवार।",
    benefit_type: "Homestead land title", benefit_detail: "Free homestead plot (reported ~3–5 decimal) with ownership title. Verify current norms.", target_beneficiary: "Landless rural BPL families.",
    requires_bpl: true, social_categories: ["sc", "st"], portal: "https://state.bihar.gov.in/lrc" }),
  mk({ name_en: "Bihar Diesel Anudan Yojana", name_hi: "बिहार डीज़ल अनुदान योजना", dept: "agriculture", categories: ["agriculture"],
    objective_en: "Diesel subsidy to farmers for irrigating standing crops during dry spells.", objective_hi: "सूखे के दौरान खड़ी फसलों की सिंचाई हेतु किसानों को डीज़ल अनुदान।",
    eligibility_en: "Farmers of Bihar (Raiyat/non-Raiyat) registered on the Agriculture DBT portal, during a notified drought/dry spell.", eligibility_hi: "अधिसूचित सूखा/शुष्क अवधि में कृषि DBT पोर्टल पर पंजीकृत बिहार के किसान (रैयत/गैर-रैयत)।",
    benefit_type: "Diesel subsidy (DBT)", benefit_detail: "Per-acre diesel subsidy for irrigation rounds (rate notified each season). Verify current rate.", target_beneficiary: "Farmers of Bihar during dry spells.",
    personas: ["farmer"], land_ownership: "any", portal: "https://dbtagriculture.bihar.gov.in" }),
];

const SCOLS = ["name_en","name_hi","department_id","categories","objective_en","objective_hi","eligibility_en","eligibility_hi","benefit_type","benefit_detail","target_beneficiary","personas","education_levels","gender_eligibility","social_categories","min_age","max_age","income_ceiling","requires_bpl","domicile","is_for_disabled","is_for_startups","land_ownership","application_portal_url","status","status_evidence","source_url","last_verified"];

// scheme name → policy name
const LINKS: [string, string][] = [
  ["Bihar Krishi Input Anudan Yojana", "Bihar Krishi Road Map (Agriculture Roadmap)"],
  ["Bihar Rajya Fasal Sahayata Yojana", "Bihar Krishi Road Map (Agriculture Roadmap)"],
  ["Bihar Krishi Yantra Anudan Yojana", "Bihar Krishi Road Map (Agriculture Roadmap)"],
  ["Bihar Mukhyamantri Bagwani Mission", "Bihar Krishi Road Map (Agriculture Roadmap)"],
  ["Jananayak Karpoori Thakur Kisan Samman Nidhi", "Bihar Krishi Road Map (Agriculture Roadmap)"],
  ["Bihar Shatabdi Niji Nalkoop Yojana", "Bihar Krishi Road Map (Agriculture Roadmap)"],
  ["Bihar Diesel Anudan Yojana", "Bihar Krishi Road Map (Agriculture Roadmap)"],
  ["Mukhyamantri Vridhjan Pension Yojana", "Bihar Social Security Pensions (SSPMIS)"],
  ["Mukhyamantri Divyangjan Pension Yojana", "Bihar Social Security Pensions (SSPMIS)"],
  ["Laxmibai Social Security (Widow) Pension Yojana", "Bihar Social Security Pensions (SSPMIS)"],
];

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log("DRY RUN — policies:", POLICIES.map((p) => p.name_en).join(", "));
    console.log("schemes:", SCHEMES.map((s) => s.name_en).join(", "));
    console.log("links:", LINKS.length);
    return;
  }

  // policies
  for (const p of POLICIES) {
    if ((await query(`select 1 from policies where name_en=$1`, [p.name_en])).length) { console.log(`skip policy: ${p.name_en}`); continue; }
    const cols = ["name_en","name_hi","department_id","summary_en","summary_hi","status","source_url","last_verified","categories","policy_type"];
    const vals = [p.name_en, p.name_hi, await deptId(p.dept), p.summary_en, p.summary_hi, "active", p.src, ON, p.categories, p.type];
    const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
    const [r] = await query<{ id: string }>(`insert into policies (${cols.join(", ")}) values (${ph}) returning id`, vals);
    console.log(`policy: ${p.name_en} → ${r.id}`);
  }

  // schemes
  const sph = SCOLS.map((_, i) => `$${i + 1}`).join(", ");
  for (const s of SCHEMES) {
    if ((await query(`select 1 from schemes where name_en=$1`, [s.name_en])).length) { console.log(`skip scheme: ${s.name_en}`); continue; }
    const row: Record<string, unknown> = { ...s, department_id: await deptId(s.dept), status: "likely_active", status_evidence: ev(s.portal), application_portal_url: s.portal, source_url: s.portal, last_verified: ON };
    const [r] = await query<{ id: string }>(`insert into schemes (${SCOLS.join(", ")}) values (${sph}) returning id`, SCOLS.map((c) => row[c]));
    console.log(`scheme: ${s.name_en} → ${r.id}`);
  }

  // links
  for (const [sName, pName] of LINKS) {
    const [s] = await query<{ id: string }>(`select id from schemes where name_en=$1`, [sName]);
    const [p] = await query<{ id: string }>(`select id from policies where name_en=$1`, [pName]);
    if (!s || !p) { console.warn(`skip link (missing): ${sName} → ${pName}`); continue; }
    await query(`insert into scheme_policy_links (scheme_id, policy_id) values ($1,$2) on conflict do nothing`, [s.id, p.id]);
    console.log(`link: ${sName} → ${pName}`);
  }
  console.log("Done.");
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
