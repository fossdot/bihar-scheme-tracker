/**
 * Inactive (subsumed / lapsed) schemes (2026-06-19). Well-documented central schemes that were
 * folded into successors or discontinued — populates the "Inactive" bucket and the successor link
 * ("continues via …"). Historical facts; no fabrication. Run after 14_central.ts (needs PMAY rows).
 *   npm run seed:inactive [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const DEPT = "Government of India (Central Scheme)";

type Row = {
  name_en: string; name_hi: string; categories: string[];
  objective_en: string; objective_hi: string; eligibility_en: string; eligibility_hi: string;
  benefit_type: string; benefit_detail: string; target_beneficiary: string;
  status: "subsumed" | "lapsed" | "superseded"; status_evidence: string;
  successor_name: string | null; source_url: string;
};

const ROWS: Row[] = [
  {
    name_en: "Indira Awaas Yojana (IAY)", name_hi: "इंदिरा आवास योजना (IAY)", categories: ["housing", "social_welfare"],
    objective_en: "Earlier central rural housing scheme providing assistance to BPL families to build houses.", objective_hi: "BPL परिवारों को मकान निर्माण हेतु सहायता देने वाली पूर्ववर्ती केंद्रीय ग्रामीण आवास योजना।",
    eligibility_en: "Rural BPL families (historical scheme).", eligibility_hi: "ग्रामीण BPL परिवार (ऐतिहासिक योजना)।",
    benefit_type: "Housing assistance", benefit_detail: "Provided grant assistance for rural house construction (now under PMAY-G).", target_beneficiary: "Rural BPL families.",
    status: "subsumed", successor_name: "Pradhan Mantri Awas Yojana — Gramin (PMAY-G)",
    status_evidence: "Subsumed: IAY was restructured into Pradhan Mantri Awaas Yojana – Gramin in 2016. It no longer runs separately. Source: rural.gov.in.",
    source_url: "https://rural.gov.in",
  },
  {
    name_en: "Rajiv Awas Yojana (RAY)", name_hi: "राजीव आवास योजना (RAY)", categories: ["housing"],
    objective_en: "Earlier central scheme towards a slum-free India / urban housing for the poor.", objective_hi: "झुग्गी-मुक्त भारत / शहरी निर्धन आवास हेतु पूर्ववर्ती केंद्रीय योजना।",
    eligibility_en: "Urban slum dwellers / poor (historical scheme).", eligibility_hi: "शहरी झुग्गीवासी / निर्धन (ऐतिहासिक योजना)।",
    benefit_type: "Urban housing", benefit_detail: "Supported slum redevelopment / urban housing (now under PMAY-Urban).", target_beneficiary: "Urban poor / slum dwellers.",
    status: "subsumed", successor_name: "Pradhan Mantri Awas Yojana — Urban (PMAY-U)",
    status_evidence: "Subsumed/closed: RAY was discontinued and succeeded by Pradhan Mantri Awas Yojana – Urban (2015). Source: mohua.gov.in.",
    source_url: "https://mohua.gov.in",
  },
  {
    name_en: "Rajiv Gandhi Grameen Vidyutikaran Yojana (RGGVY)", name_hi: "राजीव गांधी ग्रामीण विद्युतीकरण योजना (RGGVY)", categories: ["social_welfare"],
    objective_en: "Earlier central rural electrification scheme.", objective_hi: "पूर्ववर्ती केंद्रीय ग्रामीण विद्युतीकरण योजना।",
    eligibility_en: "Un-electrified rural areas/households (historical scheme).", eligibility_hi: "अविद्युतीकृत ग्रामीण क्षेत्र/घर (ऐतिहासिक योजना)।",
    benefit_type: "Rural electrification", benefit_detail: "Funded rural electrification infrastructure (subsumed into DDUGJY).", target_beneficiary: "Un-electrified rural households.",
    status: "subsumed", successor_name: null,
    status_evidence: "Subsumed: RGGVY was folded into the Deen Dayal Upadhyaya Gram Jyoti Yojana (DDUGJY) in 2015. Source: powermin.gov.in.",
    source_url: "https://powermin.gov.in",
  },
  {
    name_en: "Backward Regions Grant Fund (BRGF)", name_hi: "पिछड़ा क्षेत्र अनुदान निधि (BRGF)", categories: ["social_welfare"],
    objective_en: "Earlier central fund to redress regional development imbalances in backward districts.", objective_hi: "पिछड़े ज़िलों में क्षेत्रीय विकास असंतुलन दूर करने हेतु पूर्ववर्ती केंद्रीय निधि।",
    eligibility_en: "Identified backward districts (historical programme).", eligibility_hi: "चिह्नित पिछड़े ज़िले (ऐतिहासिक कार्यक्रम)।",
    benefit_type: "District development grant", benefit_detail: "Provided untied grants to backward districts for development gaps.", target_beneficiary: "Backward districts.",
    status: "lapsed", successor_name: null,
    status_evidence: "Lapsed: BRGF was delinked from central support / discontinued around 2015. Source: rural.gov.in / Finance Commission.",
    source_url: "https://rural.gov.in",
  },
];

const COLS = ["name_en","name_hi","department_id","categories","objective_en","objective_hi","eligibility_en","eligibility_hi","benefit_type","benefit_detail","target_beneficiary","domicile","status","status_evidence","successor_scheme_id","source_url","last_verified"];
const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function deptId(): Promise<string> {
  const e = await query<{ id: string }>(`select id from departments where name_en=$1`, [DEPT]);
  if (e[0]) return e[0].id;
  const [r] = await query<{ id: string }>(`insert into departments (name_en,name_hi,website) values ($1,$2,$3) returning id`, [DEPT, "भारत सरकार (केंद्रीय योजना)", "https://www.india.gov.in"]);
  return r.id;
}

async function main() {
  if (isDryRun) { console.log(`DRY RUN — ${ROWS.length} inactive schemes`); ROWS.forEach((r) => console.log(` ${r.name_en} [${r.status}] → ${r.successor_name ?? "(no successor)"}`)); return; }
  const dId = await deptId();
  const ph = COLS.map((_, i) => `$${i + 1}`).join(", ");
  let added = 0;
  for (const r of ROWS) {
    if ((await query(`select 1 from schemes where name_en=$1`, [r.name_en])).length) { console.log(`skip (exists): ${r.name_en}`); continue; }
    let successorId: string | null = null;
    if (r.successor_name) {
      const [s] = await query<{ id: string }>(`select id from schemes where name_en=$1`, [r.successor_name]);
      successorId = s?.id ?? null;
      if (!successorId) console.warn(`  (successor not found: ${r.successor_name})`);
    }
    const values = [r.name_en, r.name_hi, dId, r.categories, r.objective_en, r.objective_hi, r.eligibility_en, r.eligibility_hi, r.benefit_type, r.benefit_detail, r.target_beneficiary, "any", r.status, r.status_evidence, successorId, r.source_url, ON];
    const [row] = await query<{ id: string }>(`insert into schemes (${COLS.join(", ")}) values (${ph}) returning id`, values);
    console.log(`inserted: ${r.name_en} [${r.status}] → ${row.id}`); added++;
  }
  console.log(`\nDone. ${added} inactive schemes.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
