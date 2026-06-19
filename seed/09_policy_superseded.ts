/**
 * Adds the Bihar Industrial Investment Promotion Policy 2016 as a SUPERSEDED policy linked to
 * its successor (BIPPP 2025), to exercise the policy lifecycle (Past bucket + successor link)
 * with real, sourced data. Run after 06_policies.ts.
 *   npm run seed:policy-superseded [-- --dry-run]
 *
 * Source: official PDF on state.bihar.gov.in. The 2025 package is reported as a continuation of
 * the 2016 policy, so 2016 is modelled as superseded — status DERIVED, link set.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const NAME = "Bihar Industrial Investment Promotion Policy 2016";
const SUCCESSOR_NAME = "Bihar Industrial Investment Promotion Package (BIPPP) 2025";
const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log(`DRY RUN — would add "${NAME}" as superseded → "${SUCCESSOR_NAME}".`);
    return;
  }

  const exists = await query<{ id: string }>(`select id from policies where name_en = $1`, [NAME]);
  if (exists[0]) {
    console.log(`skip (exists): ${NAME}`);
    return;
  }

  const [succ] = await query<{ id: string }>(`select id from policies where name_en = $1`, [SUCCESSOR_NAME]);
  const [dept] = await query<{ id: string }>(
    `select id from departments where name_en = $1`,
    ["Industries Department, Government of Bihar"]
  );

  const cols = [
    "name_en", "name_hi", "department_id", "summary_en", "summary_hi",
    "period_start", "period_end", "status", "superseded_by", "source_url", "last_verified",
    "categories", "policy_type", "document_url",
  ];
  const vals = [
    NAME,
    "बिहार औद्योगिक निवेश प्रोत्साहन नीति 2016",
    dept?.id ?? null,
    "Bihar's 2016 framework of incentives for industrial investment (capital subsidy, interest subvention, tax-related benefits). Continued/replaced by the 2025 Industrial Investment Promotion Package.",
    "औद्योगिक निवेश हेतु प्रोत्साहनों की बिहार की 2016 रूपरेखा (पूंजी सब्सिडी, ब्याज अनुदान, कर-संबंधी लाभ)। 2025 औद्योगिक निवेश प्रोत्साहन पैकेज द्वारा निरंतर/प्रतिस्थापित।",
    "2016-01-01",
    null,
    "superseded",
    succ?.id ?? null,
    "https://state.bihar.gov.in/cache/26/Documents/Bihar-Industrial-Investment-Policy-2016.pdf",
    ON,
    ["industry"],
    "framework",
    "https://state.bihar.gov.in/cache/26/Documents/Bihar-Industrial-Investment-Policy-2016.pdf",
  ];
  const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
  const [row] = await query<{ id: string }>(
    `insert into policies (${cols.join(", ")}) values (${ph}) returning id`,
    vals
  );
  console.log(`inserted: ${NAME} → ${row.id} (superseded_by ${succ?.id ?? "NONE — successor not found"})`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
