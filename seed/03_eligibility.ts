/**
 * Structured-eligibility pass (2026-06-18) — fills the filterable facet columns added by
 * migration 20260618020000_structured_eligibility.sql for the three MVP schemes. Run AFTER
 * seed.ts + 02_verify.ts.
 *
 *   npm run seed:eligibility -- --dry-run
 *   npm run seed:eligibility
 *
 * Principles held (CLAUDE.md):
 *   - Every value is DERIVED from the already-verified free-text eligibility set in
 *     02_verify.ts (same sources) — no new facts are introduced here, only structured.
 *   - Genuine uncertainty is encoded as "no constraint", never as a guessed number:
 *     KYP's upper age limit conflicts across sources (15–25 vs 15–28), so max_age is left
 *     NULL (matches any age ≥ 15) rather than asserting a bound — never hide live help.
 *   - One concept, one representation: occupation → personas; class-12-pass → education_levels;
 *     no income bar → income_ceiling NULL + requires_bpl false.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getPool, query } from "../lib/db";
import type {
  EducationLevel,
  Gender,
  Persona,
  SchemeCategory,
  SocialCategory,
} from "../lib/types";

type Eligibility = {
  match_name_en: string;
  personas: Persona[];
  education_levels: EducationLevel[]; // ENTRY requirement (citizen's level is expanded up the ladder at query time)
  gender_eligibility: Gender;
  social_categories: SocialCategory[];
  min_age: number | null;
  max_age: number | null;
  income_ceiling: number | null;
  requires_bpl: boolean;
  domicile: "bihar" | "any";
  categories: SchemeCategory[];
  note: string; // why these values (audit trail)
};

const ELIGIBILITY: Eligibility[] = [
  {
    match_name_en: "Bihar Student Credit Card Scheme",
    personas: ["student"],
    education_levels: ["senior_secondary"], // requires class 12 / Intermediate passed
    gender_eligibility: "any",
    social_categories: [], // open to all categories
    min_age: null, // verified eligibility states no age band
    max_age: null,
    income_ceiling: null, // it is a loan — no income bar
    requires_bpl: false,
    domicile: "bihar", // permanent resident of Bihar
    categories: ["education"],
    note: "From verified eligibility: Bihar permanent resident, Intermediate/class-12 passed, intends higher education. No age/income bar stated.",
  },
  {
    match_name_en: "Mukhyamantri Nishchay Swayam Sahayata Bhatta (MNSSBY)",
    personas: ["unemployed_youth"],
    education_levels: ["senior_secondary"], // class 12 passed, not in higher education
    gender_eligibility: "any",
    social_categories: [],
    min_age: 20,
    max_age: 25,
    income_ceiling: null,
    requires_bpl: false,
    domicile: "bihar",
    categories: ["employment"],
    note: "From verified eligibility: Bihar resident aged 20–25, unemployed & seeking work, class-12 passed, not in higher education.",
  },
  {
    match_name_en: "Kushal Yuva Program (KYP)",
    personas: ["unemployed_youth"],
    education_levels: ["secondary"], // at least class 10 passed
    gender_eligibility: "any",
    social_categories: [],
    min_age: 15,
    max_age: null, // upper bound conflicts across sources (15–25 vs 15–28) — left open, not guessed
    income_ceiling: null,
    requires_bpl: false,
    domicile: "bihar",
    categories: ["skilling", "employment"], // employability training → spans both sectors
    note: "From verified eligibility: Bihar youth, ≥ class 10, not in formal education. Upper age unresolved (15–25 vs 15–28) → max_age NULL.",
  },
];

const SET_COLS = [
  "personas",
  "education_levels",
  "gender_eligibility",
  "social_categories",
  "min_age",
  "max_age",
  "income_ceiling",
  "requires_bpl",
  "domicile",
  "categories",
];

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log(
      "DRY RUN — no DB connection. (Set DATABASE_URL and drop --dry-run to write.)\n"
    );
    ELIGIBILITY.forEach((e) =>
      console.log(
        `Would set ${e.match_name_en}:`,
        JSON.stringify(e, null, 2),
        "\n"
      )
    );
    return;
  }

  // text[] columns must be passed as JS arrays (node-postgres maps them to Postgres arrays).
  const setClause = SET_COLS.map((c, i) => `${c} = $${i + 1}`).join(", ");
  const nameParam = `$${SET_COLS.length + 1}`;

  for (const e of ELIGIBILITY) {
    const values = [
      e.personas,
      e.education_levels,
      e.gender_eligibility,
      e.social_categories,
      e.min_age,
      e.max_age,
      e.income_ceiling,
      e.requires_bpl,
      e.domicile,
      e.categories,
      e.match_name_en,
    ];
    const rows = await query<{ id: string }>(
      `update schemes set ${setClause} where name_en = ${nameParam} returning id`,
      values
    );
    if (rows.length === 0) {
      console.warn(`!! no match for "${e.match_name_en}" — run seed.ts first?`);
    } else {
      console.log(`updated: ${e.match_name_en} (${rows[0].id})`);
    }
  }

  console.log("\nStructured-eligibility pass done.");
}

main()
  .catch((err) => {
    console.error("Eligibility pass failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!isDryRun) await getPool().end();
  });
