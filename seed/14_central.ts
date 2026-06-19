/**
 * Central (Government of India) flagship schemes that Bihar residents use (2026-06-19).
 * Marked under a "Government of India (Central Scheme)" department so they're distinguishable
 * from state schemes. Public-sourced from official central portals; conservative 'likely_active';
 * figures REPORTED (verify at portal) — none fabricated. domicile = 'any' (not Bihar-gated).
 *   npm run seed:central [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const DEPT = { en: "Government of India (Central Scheme)", hi: "भारत सरकार (केंद्रीय योजना)", web: "https://www.india.gov.in" };

type S = Record<string, unknown> & { name_en: string; portal: string };
const mk = (s: Partial<S> & Pick<S, "name_en" | "name_hi" | "categories" | "objective_en" | "objective_hi" | "eligibility_en" | "eligibility_hi" | "benefit_type" | "benefit_detail" | "target_beneficiary" | "portal">): S => ({
  personas: [], education_levels: [], gender_eligibility: "any", social_categories: [], min_age: null, max_age: null,
  income_ceiling: null, requires_bpl: false, domicile: "any", is_for_disabled: false, is_for_startups: false, land_ownership: null, ...s,
});

const SCHEMES: S[] = [
  mk({ name_en: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)", name_hi: "पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)", categories: ["agriculture", "financial_inclusion"],
    objective_en: "Central income support to landholding farmer families.", objective_hi: "भूमिधारी किसान परिवारों को केंद्रीय आय-सहायता।",
    eligibility_en: "Landholding farmer families (with cultivable land), subject to exclusion criteria (income-tax payers, institutional landholders etc.). Registered on the PM-KISAN portal.", eligibility_hi: "खेती योग्य भूमि वाले किसान परिवार, अपवर्जन मानदंड सहित (आयकरदाता, संस्थागत भूधारक आदि)। पीएम-किसान पोर्टल पर पंजीकृत।",
    benefit_type: "Income support (DBT)", benefit_detail: "₹6,000/year in three ₹2,000 installments. Verify current status at the portal.", target_beneficiary: "Landholding farmer families.",
    personas: ["farmer"], land_ownership: "raiyat", portal: "https://pmkisan.gov.in" }),
  mk({ name_en: "Ayushman Bharat — PM-JAY", name_hi: "आयुष्मान भारत — पीएम-जय", categories: ["health", "social_welfare"],
    objective_en: "Health insurance cover for hospitalisation to eligible low-income families.", objective_hi: "पात्र निम्न-आय परिवारों को अस्पताल में भर्ती हेतु स्वास्थ्य बीमा।",
    eligibility_en: "Families identified as eligible (SECC deprivation criteria / state-extended lists). Check eligibility on the PM-JAY portal.", eligibility_hi: "पात्र पहचाने गए परिवार (SECC वंचना मानदंड / राज्य-विस्तारित सूची)। पात्रता PM-JAY पोर्टल पर जाँचें।",
    benefit_type: "Health insurance", benefit_detail: "Cover up to ₹5 lakh per family per year for secondary/tertiary hospitalisation. Verify current terms.", target_beneficiary: "Eligible low-income families.",
    portal: "https://pmjay.gov.in" }),
  mk({ name_en: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)", name_hi: "प्रधानमंत्री आवास योजना — ग्रामीण (PMAY-G)", categories: ["housing", "social_welfare"],
    objective_en: "Assistance to rural houseless / kutcha-house families to build a pucca house.", objective_hi: "ग्रामीण बेघर/कच्चे-मकान परिवारों को पक्का मकान बनाने हेतु सहायता।",
    eligibility_en: "Rural families without a pucca house, identified per SECC/Awas+ lists.", eligibility_hi: "पक्के मकान से वंचित ग्रामीण परिवार, SECC/आवास+ सूची अनुसार।",
    benefit_type: "Housing assistance (DBT)", benefit_detail: "Reported ~₹1.20 lakh (plains) / ₹1.30 lakh (hilly/difficult) + MGNREGA wage days + toilet support. Verify current terms.", target_beneficiary: "Rural houseless/kutcha-house families.",
    requires_bpl: true, portal: "https://pmayg.nic.in" }),
  mk({ name_en: "Pradhan Mantri Awas Yojana — Urban (PMAY-U)", name_hi: "प्रधानमंत्री आवास योजना — शहरी (PMAY-U)", categories: ["housing"],
    objective_en: "Housing assistance/interest subsidy for urban EWS/LIG/MIG families.", objective_hi: "शहरी EWS/LIG/MIG परिवारों हेतु आवास सहायता/ब्याज सब्सिडी।",
    eligibility_en: "Urban EWS/LIG/MIG households without a pucca house (income-based slabs). Verify slabs at the portal.", eligibility_hi: "पक्के मकान से वंचित शहरी EWS/LIG/MIG परिवार (आय-आधारित स्लैब)। स्लैब पोर्टल पर सत्यापित करें।",
    benefit_type: "Housing assistance / interest subsidy", benefit_detail: "Credit-linked interest subsidy / construction assistance for eligible income groups. Verify current terms.", target_beneficiary: "Urban EWS/LIG/MIG families.",
    income_ceiling: 600000, portal: "https://pmay-urban.gov.in" }),
  mk({ name_en: "Pradhan Mantri Ujjwala Yojana (PMUY)", name_hi: "प्रधानमंत्री उज्ज्वला योजना (PMUY)", categories: ["social_welfare", "women_child", "health"],
    objective_en: "Free LPG (cooking gas) connection to women of poor / eligible households.", objective_hi: "निर्धन/पात्र परिवारों की महिलाओं को नि:शुल्क एलपीजी (रसोई गैस) कनेक्शन।",
    eligibility_en: "Adult woman of an eligible low-income household without an existing LPG connection.", eligibility_hi: "पात्र निम्न-आय परिवार की वयस्क महिला जिसके पास पहले से एलपीजी कनेक्शन न हो।",
    benefit_type: "Free LPG connection", benefit_detail: "Free LPG connection with deposit support + initial refill/stove support per current norms. Verify at the portal.", target_beneficiary: "Women of eligible low-income households.",
    personas: ["widow"], gender_eligibility: "female", portal: "https://www.pmuy.gov.in" }),
  mk({ name_en: "PM Vishwakarma", name_hi: "पीएम विश्वकर्मा", categories: ["skilling", "financial_inclusion", "industry"],
    objective_en: "Support to traditional artisans and craftspeople — recognition, skilling, toolkit and credit.", objective_hi: "पारंपरिक शिल्पकारों एवं कारीगरों को सहायता — मान्यता, कौशल, टूलकिट एवं ऋण।",
    eligibility_en: "Artisans/craftspeople in one of the notified trades (carpenter, blacksmith, potter, weaver, etc.); family/occupation criteria apply.", eligibility_hi: "अधिसूचित व्यवसायों (बढ़ई, लोहार, कुम्हार, बुनकर आदि) के शिल्पकार/कारीगर; परिवार/व्यवसाय मानदंड लागू।",
    benefit_type: "Skilling + toolkit + collateral-free loan", benefit_detail: "Skill training with ₹500/day stipend + toolkit incentive (reported ₹15,000) + collateral-free loans up to ₹3 lakh. Verify current terms.", target_beneficiary: "Traditional artisans and craftspeople.",
    personas: ["artisan_weaver"], portal: "https://pmvishwakarma.gov.in" }),
  mk({ name_en: "PM SVANidhi (Street Vendors)", name_hi: "पीएम स्वनिधि (पथ विक्रेता)", categories: ["financial_inclusion", "employment"],
    objective_en: "Collateral-free working-capital loans for urban street vendors.", objective_hi: "शहरी पथ विक्रेताओं हेतु बिना गारंटी कार्यशील-पूंजी ऋण।",
    eligibility_en: "Urban street vendors with a vending certificate/identity (or per survey).", eligibility_hi: "वेंडिंग प्रमाण-पत्र/पहचान वाले शहरी पथ विक्रेता (या सर्वेक्षण अनुसार)।",
    benefit_type: "Working-capital loan", benefit_detail: "Tiered collateral-free loans (reported ₹10,000 → ₹20,000 → ₹50,000) with interest subsidy. Verify current terms.", target_beneficiary: "Urban street vendors.",
    personas: ["self_employed_entrepreneur"], portal: "https://pmsvanidhi.mohua.gov.in" }),
  mk({ name_en: "Pradhan Mantri Mudra Yojana (PMMY)", name_hi: "प्रधानमंत्री मुद्रा योजना (PMMY)", categories: ["financial_inclusion", "employment"],
    objective_en: "Collateral-free micro-loans for non-farm income-generating micro/small enterprises.", objective_hi: "गैर-कृषि आय-सृजन सूक्ष्म/लघु उद्यमों हेतु बिना गारंटी सूक्ष्म-ऋण।",
    eligibility_en: "Non-corporate, non-farm micro/small enterprises and aspiring entrepreneurs (via banks/MFIs/NBFCs).", eligibility_hi: "गैर-कॉर्पोरेट, गैर-कृषि सूक्ष्म/लघु उद्यम एवं इच्छुक उद्यमी (बैंक/MFI/NBFC के माध्यम से)।",
    benefit_type: "Collateral-free loan", benefit_detail: "Loans under Shishu/Kishore/Tarun categories (reported up to ₹10 lakh, now up to ₹20 lakh for Tarun+). Verify current limits.", target_beneficiary: "Micro/small entrepreneurs.",
    personas: ["self_employed_entrepreneur"], portal: "https://www.mudra.org.in" }),
  mk({ name_en: "Sukanya Samriddhi Yojana (SSY)", name_hi: "सुकन्या समृद्धि योजना (SSY)", categories: ["financial_inclusion", "women_child"],
    objective_en: "Small-savings account for a girl child with attractive interest and tax benefits.", objective_hi: "बालिका हेतु आकर्षक ब्याज एवं कर-लाभ वाला अल्प-बचत खाता।",
    eligibility_en: "Account opened by a guardian for a girl child below 10 years (max two girls per family, exceptions apply).", eligibility_hi: "अभिभावक द्वारा 10 वर्ष से कम आयु की बालिका हेतु खाता (अधिकतम दो बालिकाएँ, अपवाद सहित)।",
    benefit_type: "Small-savings account", benefit_detail: "High fixed interest + EEE tax benefit; matures for the girl's education/marriage. Verify current rate at a post office/bank.", target_beneficiary: "Girl children (below 10).",
    gender_eligibility: "female", portal: "https://www.nsiindia.gov.in" }),
  mk({ name_en: "Atal Pension Yojana (APY)", name_hi: "अटल पेंशन योजना (APY)", categories: ["social_welfare", "financial_inclusion"],
    objective_en: "Guaranteed minimum pension for workers, especially in the unorganised sector.", objective_hi: "श्रमिकों, विशेषकर असंगठित क्षेत्र, हेतु गारंटीशुदा न्यूनतम पेंशन।",
    eligibility_en: "Indian citizens aged 18–40 with a bank account (non-income-tax-payers).", eligibility_hi: "18–40 आयु के भारतीय नागरिक जिनके पास बैंक खाता हो (गैर-आयकरदाता)।",
    benefit_type: "Guaranteed pension", benefit_detail: "Guaranteed pension of ₹1,000–₹5,000/month after age 60 based on contribution. Verify current terms.", target_beneficiary: "Unorganised-sector workers (18–40).",
    personas: ["worker_labourer"], min_age: 18, max_age: 40, portal: "https://www.npscra.nsdl.co.in" }),
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
  if (isDryRun) { console.log(`DRY RUN — ${SCHEMES.length} central schemes:`); SCHEMES.forEach((s) => console.log(` ${s.name_en}`)); return; }
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
  console.log(`\nDone. ${added} central schemes.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
