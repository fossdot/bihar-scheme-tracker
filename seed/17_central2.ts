/**
 * Central schemes — batch 2 (2026-06-19): more national flagship schemes Bihar residents use.
 * Public-sourced; conservative 'likely_active'; figures REPORTED (verify at portal); domicile=any.
 *   npm run seed:central2 [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const DEPT = "Government of India (Central Scheme)";

type S = Record<string, unknown> & { name_en: string; portal: string };
const mk = (s: Partial<S> & Pick<S, "name_en" | "name_hi" | "categories" | "objective_en" | "objective_hi" | "eligibility_en" | "eligibility_hi" | "benefit_type" | "benefit_detail" | "target_beneficiary" | "portal">): S => ({
  personas: [], education_levels: [], gender_eligibility: "any", social_categories: [], min_age: null, max_age: null,
  income_ceiling: null, requires_bpl: false, domicile: "any", is_for_disabled: false, is_for_startups: false, land_ownership: null, ...s,
});

const SCHEMES: S[] = [
  mk({ name_en: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)", name_hi: "प्रधानमंत्री जीवन ज्योति बीमा योजना (PMJJBY)", categories: ["financial_inclusion", "social_welfare"],
    objective_en: "Affordable life-insurance cover via a bank account.", objective_hi: "बैंक खाते के माध्यम से किफायती जीवन बीमा।",
    eligibility_en: "Bank account holders aged 18–50 who auto-debit the premium.", eligibility_hi: "18–50 आयु के बैंक खाताधारक जो प्रीमियम ऑटो-डेबिट करें।",
    benefit_type: "Life insurance", benefit_detail: "Life cover (reported ₹2 lakh) for a small annual premium. Verify current premium/cover.", target_beneficiary: "Bank account holders (18–50).",
    min_age: 18, max_age: 50, portal: "https://www.jansuraksha.gov.in" }),
  mk({ name_en: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)", name_hi: "प्रधानमंत्री सुरक्षा बीमा योजना (PMSBY)", categories: ["financial_inclusion", "social_welfare"],
    objective_en: "Affordable accident-insurance cover via a bank account.", objective_hi: "बैंक खाते के माध्यम से किफायती दुर्घटना बीमा।",
    eligibility_en: "Bank account holders aged 18–70 who auto-debit the premium.", eligibility_hi: "18–70 आयु के बैंक खाताधारक जो प्रीमियम ऑटो-डेबिट करें।",
    benefit_type: "Accident insurance", benefit_detail: "Accidental death/disability cover (reported ₹2 lakh) for a nominal annual premium. Verify current terms.", target_beneficiary: "Bank account holders (18–70).",
    min_age: 18, max_age: 70, portal: "https://www.jansuraksha.gov.in" }),
  mk({ name_en: "Pradhan Mantri Shram Yogi Maandhan (PM-SYM)", name_hi: "प्रधानमंत्री श्रम योगी मानधन (PM-SYM)", categories: ["social_welfare", "financial_inclusion"],
    objective_en: "Voluntary contributory pension for unorganised-sector workers.", objective_hi: "असंगठित क्षेत्र के श्रमिकों हेतु स्वैच्छिक अंशदायी पेंशन।",
    eligibility_en: "Unorganised-sector workers aged 18–40 with monthly income up to ₹15,000 (non-EPF/ESIC/NPS).", eligibility_hi: "18–40 आयु के असंगठित श्रमिक, मासिक आय ₹15,000 तक (EPF/ESIC/NPS में नहीं)।",
    benefit_type: "Guaranteed pension", benefit_detail: "Assured ₹3,000/month pension after age 60 (50% govt co-contribution). Verify current terms.", target_beneficiary: "Unorganised-sector workers (18–40).",
    personas: ["worker_labourer"], min_age: 18, max_age: 40, income_ceiling: 180000, portal: "https://maandhan.in" }),
  mk({ name_en: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)", name_hi: "प्रधानमंत्री कौशल विकास योजना (PMKVY)", categories: ["skilling", "employment"],
    objective_en: "Short-term skill training and certification for youth to improve employability.", objective_hi: "रोज़गार-योग्यता बढ़ाने हेतु युवाओं को अल्पकालिक कौशल प्रशिक्षण व प्रमाणन।",
    eligibility_en: "Indian youth (typically 15–45) seeking skill training; criteria vary by job role.", eligibility_hi: "कौशल प्रशिक्षण चाहने वाले भारतीय युवा (सामान्यतः 15–45); भूमिका अनुसार मानदंड।",
    benefit_type: "Free skill training + certification", benefit_detail: "Free NSQF-aligned training, assessment and certification (placement support). Verify current terms.", target_beneficiary: "Youth seeking skills.",
    personas: ["unemployed_youth"], portal: "https://www.pmkvyofficial.org" }),
  mk({ name_en: "Stand-Up India", name_hi: "स्टैंड-अप इंडिया", categories: ["financial_inclusion", "industry"],
    objective_en: "Bank loans for greenfield enterprises by SC/ST and women entrepreneurs.", objective_hi: "SC/ST एवं महिला उद्यमियों के नए उद्यमों हेतु बैंक ऋण।",
    eligibility_en: "SC/ST or women entrepreneurs (18+) setting up a new manufacturing/services/trading enterprise.", eligibility_hi: "नया विनिर्माण/सेवा/व्यापार उद्यम स्थापित करने वाले SC/ST या महिला उद्यमी (18+)।",
    benefit_type: "Bank loan", benefit_detail: "Bank loans ₹10 lakh–₹1 crore for greenfield projects. Verify current terms.", target_beneficiary: "SC/ST and women entrepreneurs.",
    personas: ["self_employed_entrepreneur"], min_age: 18, portal: "https://www.standupmitra.in" }),
  mk({ name_en: "PM POSHAN (Mid-Day Meal)", name_hi: "पीएम पोषण (मध्याह्न भोजन)", categories: ["education", "health", "women_child"],
    objective_en: "Hot cooked meals to school children to improve nutrition and attendance.", objective_hi: "पोषण व उपस्थिति सुधारने हेतु विद्यालयी बच्चों को गर्म पका भोजन।",
    eligibility_en: "Children in government and government-aided schools (Bal Vatika to Class 8).", eligibility_hi: "सरकारी व सरकारी-सहायता प्राप्त विद्यालयों के बच्चे (बाल वाटिका से कक्षा 8)।",
    benefit_type: "School meals", benefit_detail: "One hot cooked meal per school day, per nutrition norms.", target_beneficiary: "Government-school children.",
    personas: ["student"], portal: "https://pmposhan.education.gov.in" }),
  mk({ name_en: "e-Shram (Unorganised Workers Registration)", name_hi: "ई-श्रम (असंगठित श्रमिक पंजीकरण)", categories: ["social_welfare", "employment"],
    objective_en: "National database & identity card for unorganised workers, linking them to welfare/social-security benefits.", objective_hi: "असंगठित श्रमिकों हेतु राष्ट्रीय डेटाबेस व पहचान-पत्र, जो उन्हें कल्याण/सामाजिक-सुरक्षा लाभों से जोड़े।",
    eligibility_en: "Unorganised-sector workers aged 16–59 (non-EPF/ESIC, non-income-tax-payers).", eligibility_hi: "16–59 आयु के असंगठित श्रमिक (EPF/ESIC में नहीं, गैर-आयकरदाता)।",
    benefit_type: "Registration + accident cover", benefit_detail: "e-Shram card + linkage to welfare schemes and accidental insurance cover. Verify current terms.", target_beneficiary: "Unorganised-sector workers.",
    personas: ["worker_labourer"], min_age: 16, max_age: 59, portal: "https://eshram.gov.in" }),
  mk({ name_en: "Pradhan Mantri Matru Vandana Yojana (PMMVY)", name_hi: "प्रधानमंत्री मातृ वंदना योजना (PMMVY)", categories: ["women_child", "health"],
    objective_en: "Maternity benefit / wage compensation for pregnant and lactating women.", objective_hi: "गर्भवती व स्तनपान कराने वाली महिलाओं हेतु मातृत्व लाभ / मज़दूरी क्षतिपूर्ति।",
    eligibility_en: "Pregnant and lactating women for the first (and per current norms, second girl) child.", eligibility_hi: "पहले (एवं वर्तमान मानदंड अनुसार दूसरी बालिका) बच्चे हेतु गर्भवती व स्तनपान कराने वाली महिलाएँ।",
    benefit_type: "Maternity benefit (DBT)", benefit_detail: "Cash benefit (reported ₹5,000 for the first child, in installments). Verify current terms.", target_beneficiary: "Pregnant and lactating women.",
    personas: ["pregnant_lactating_woman"], gender_eligibility: "female", portal: "https://wcd.nic.in" }),
  mk({ name_en: "Pradhan Mantri Jan Dhan Yojana (PMJDY)", name_hi: "प्रधानमंत्री जन धन योजना (PMJDY)", categories: ["financial_inclusion"],
    objective_en: "Universal access to a basic bank account with overdraft, insurance and DBT linkage.", objective_hi: "ओवरड्राफ्ट, बीमा एवं DBT लिंकेज सहित बुनियादी बैंक खाते तक सार्वभौमिक पहुँच।",
    eligibility_en: "Any Indian resident without a bank account (zero-balance account).", eligibility_hi: "बिना बैंक खाते वाला कोई भी भारतीय निवासी (शून्य-शेष खाता)।",
    benefit_type: "Zero-balance bank account", benefit_detail: "No-frills account with RuPay card, accident insurance and overdraft facility. Verify current terms.", target_beneficiary: "Unbanked residents.",
    portal: "https://pmjdy.gov.in" }),
];

const COLS = ["name_en","name_hi","department_id","categories","objective_en","objective_hi","eligibility_en","eligibility_hi","benefit_type","benefit_detail","target_beneficiary","personas","education_levels","gender_eligibility","social_categories","min_age","max_age","income_ceiling","requires_bpl","domicile","is_for_disabled","is_for_startups","land_ownership","application_portal_url","status","status_evidence","source_url","last_verified"];
const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function deptId(): Promise<string> {
  const e = await query<{ id: string }>(`select id from departments where name_en=$1`, [DEPT]);
  if (e[0]) return e[0].id;
  const [r] = await query<{ id: string }>(`insert into departments (name_en,name_hi,website) values ($1,$2,$3) returning id`, [DEPT, "भारत सरकार (केंद्रीय योजना)", "https://www.india.gov.in"]);
  return r.id;
}

async function main() {
  if (isDryRun) { console.log(`DRY RUN — ${SCHEMES.length} schemes`); SCHEMES.forEach((s) => console.log(` ${s.name_en}`)); return; }
  const dId = await deptId();
  const ph = COLS.map((_, i) => `$${i + 1}`).join(", ");
  let added = 0;
  for (const s of SCHEMES) {
    if ((await query(`select 1 from schemes where name_en=$1`, [s.name_en])).length) { console.log(`skip (exists): ${s.name_en}`); continue; }
    const ev = `Seeded ${ON} as 'likely_active': central flagship scheme operating in Bihar. Figures REPORTED — verify current terms at ${s.portal}.`;
    const row: Record<string, unknown> = { ...s, department_id: dId, status: "likely_active", status_evidence: ev, application_portal_url: s.portal, source_url: s.portal, last_verified: ON };
    const [r] = await query<{ id: string }>(`insert into schemes (${COLS.join(", ")}) values (${ph}) returning id`, COLS.map((c) => row[c]));
    console.log(`inserted: ${s.name_en} → ${r.id}`); added++;
  }
  console.log(`\nDone. ${added} schemes.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
