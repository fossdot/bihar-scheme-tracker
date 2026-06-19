/**
 * District-administered schemes (2026-06-19). Genuinely district/local-body delivered welfare
 * schemes (most "district schemes" are state/central schemes delivered at district level, so only
 * the real district-administered ones are added — no fabrication). Grouped under a "District
 * Administration (Bihar)" department. Conservative 'likely_active'; figures reported (verify).
 *   npm run seed:district [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const DEPT = { en: "District Administration (Bihar)", hi: "ज़िला प्रशासन (बिहार)", web: "https://state.bihar.gov.in" };

type S = Record<string, unknown> & { name_en: string; portal: string };
const mk = (s: Partial<S> & Pick<S, "name_en" | "name_hi" | "categories" | "objective_en" | "objective_hi" | "eligibility_en" | "eligibility_hi" | "benefit_type" | "benefit_detail" | "target_beneficiary" | "portal">): S => ({
  personas: [], education_levels: [], gender_eligibility: "any", social_categories: [], min_age: null, max_age: null,
  income_ceiling: null, requires_bpl: false, domicile: "bihar", is_for_disabled: false, is_for_startups: false, land_ownership: null, ...s,
});

const SCHEMES: S[] = [
  mk({ name_en: "Kabir Antyeshti Anudan Yojana", name_hi: "कबीर अंत्येष्टि अनुदान योजना", categories: ["social_welfare"],
    objective_en: "Immediate assistance to a poor family for the last rites of a deceased member.", objective_hi: "किसी सदस्य की मृत्यु पर निर्धन परिवार को अंतिम संस्कार हेतु तत्काल सहायता।",
    eligibility_en: "BPL family in Bihar on the death of a member; applied via the local body / district welfare office.", eligibility_hi: "किसी सदस्य की मृत्यु पर बिहार का BPL परिवार; स्थानीय निकाय / ज़िला कल्याण कार्यालय के माध्यम से।",
    benefit_type: "Last-rites assistance", benefit_detail: "Reported ₹3,000 immediate assistance for last rites. Verify current amount with the district/local body.", target_beneficiary: "BPL families of Bihar.",
    requires_bpl: true, portal: "https://state.bihar.gov.in/socialwelfare" }),
  mk({ name_en: "National Family Benefit Scheme (NFBS)", name_hi: "राष्ट्रीय परिवार लाभ योजना (NFBS)", categories: ["social_welfare"],
    objective_en: "One-time ex-gratia to a BPL family on the death of its primary breadwinner (district-administered, under NSAP).", objective_hi: "मुख्य कमाने वाले की मृत्यु पर BPL परिवार को एकमुश्त अनुग्रह राशि (ज़िला-प्रशासित, NSAP के अंतर्गत)।",
    eligibility_en: "BPL family in Bihar whose primary breadwinner (aged 18–59) has died; applied at the district level.", eligibility_hi: "बिहार का BPL परिवार जिसके मुख्य कमाने वाले (आयु 18–59) की मृत्यु हुई हो; ज़िला स्तर पर आवेदन।",
    benefit_type: "Ex-gratia (lump sum)", benefit_detail: "Reported ₹20,000 one-time. Verify current amount at the district welfare office.", target_beneficiary: "BPL families of Bihar.",
    requires_bpl: true, portal: "https://nsap.nic.in" }),
  mk({ name_en: "District Mineral Foundation Trust (DMFT) Schemes", name_hi: "ज़िला खनिज फाउंडेशन ट्रस्ट (DMFT) योजनाएँ", categories: ["social_welfare", "health", "education"],
    objective_en: "District-level development works (health, education, drinking water, livelihoods) for communities in mining-affected areas, funded by mining royalties.", objective_hi: "खनन-प्रभावित क्षेत्रों के समुदायों हेतु ज़िला-स्तरीय विकास कार्य (स्वास्थ्य, शिक्षा, पेयजल, आजीविका), खनन रॉयल्टी से वित्त-पोषित।",
    eligibility_en: "Communities/persons affected by mining in Bihar's mining districts; works prioritised by the district DMFT.", eligibility_hi: "बिहार के खनन ज़िलों में खनन-प्रभावित समुदाय/व्यक्ति; कार्य ज़िला DMFT द्वारा प्राथमिकता अनुसार।",
    benefit_type: "District development works", benefit_detail: "Funds health, education, water and livelihood works in mining-affected areas (per district DMFT plans).", target_beneficiary: "Mining-affected communities (relevant districts).",
    portal: "https://state.bihar.gov.in/mines" }),
];

const COLS = ["name_en","name_hi","department_id","categories","objective_en","objective_hi","eligibility_en","eligibility_hi","benefit_type","benefit_detail","target_beneficiary","personas","education_levels","gender_eligibility","social_categories","min_age","max_age","income_ceiling","requires_bpl","domicile","is_for_disabled","is_for_startups","land_ownership","application_portal_url","status","status_evidence","source_url","last_verified"];
const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function deptId(): Promise<string> {
  const e = await query<{ id: string }>(`select id from departments where name_en=$1`, [DEPT.en]);
  if (e[0]) return e[0].id;
  const [r] = await query<{ id: string }>(`insert into departments (name_en,name_hi,website) values ($1,$2,$3) returning id`, [DEPT.en, DEPT.hi, DEPT.web]);
  return r.id;
}

async function main() {
  if (isDryRun) { console.log(`DRY RUN — ${SCHEMES.length} district schemes`); SCHEMES.forEach((s) => console.log(` ${s.name_en}`)); return; }
  const dId = await deptId();
  const ph = COLS.map((_, i) => `$${i + 1}`).join(", ");
  let added = 0;
  for (const s of SCHEMES) {
    if ((await query(`select 1 from schemes where name_en=$1`, [s.name_en])).length) { console.log(`skip (exists): ${s.name_en}`); continue; }
    const ev = `Seeded ${ON} as 'likely_active': district-administered welfare scheme. Figures REPORTED — verify at the district/local body. Source: ${s.portal}.`;
    const row: Record<string, unknown> = { ...s, department_id: dId, status: "likely_active", status_evidence: ev, application_portal_url: s.portal, source_url: s.portal, last_verified: ON };
    const [r] = await query<{ id: string }>(`insert into schemes (${COLS.join(", ")}) values (${ph}) returning id`, COLS.map((c) => row[c]));
    console.log(`inserted: ${s.name_en} → ${r.id}`); added++;
  }
  console.log(`\nDone. ${added} district schemes.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
