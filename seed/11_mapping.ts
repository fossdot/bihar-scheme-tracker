/**
 * Map schemes to their parent policy/framework (2026-06-19). Adds the Saat Nishchay-2 umbrella
 * policy and links the youth cluster under it; links the Startup Seed Fund under the Startup
 * Policy. Only well-documented relationships are linked (no speculative mappings).
 *   npm run seed:mapping [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";
const SAAT = "Saat Nishchay-2 — Yuva Upmission";
const PORTAL = "https://www.7nishchay-yuvaupmission.bihar.gov.in/";

// scheme name → policy name (well-documented parent frameworks)
const LINKS: [string, string][] = [
  ["Bihar Student Credit Card Scheme", SAAT],
  ["Kushal Yuva Program (KYP)", SAAT],
  ["Mukhyamantri Nishchay Swayam Sahayata Bhatta (MNSSBY)", SAAT],
  ["Bihar Startup Fund (Seed Funding)", "Bihar Startup Policy 2022"],
];

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log("DRY RUN — would add Saat Nishchay-2 policy + links:");
    LINKS.forEach(([s, p]) => console.log(`  ${s}  →  ${p}`));
    return;
  }

  // Ensure the Saat Nishchay-2 umbrella policy exists.
  let saat = (await query<{ id: string }>(`select id from policies where name_en=$1`, [SAAT]))[0]?.id;
  if (!saat) {
    const [dept] = await query<{ id: string }>(
      `select id from departments where name_en=$1`,
      ["Saat Nischay — Yuva Upmission (Government of Bihar)"]
    );
    const cols = ["name_en","name_hi","department_id","summary_en","summary_hi","status","source_url","last_verified","categories","policy_type"];
    const vals = [
      SAAT,
      "सात निश्चय-2 — युवा उपमिशन",
      dept?.id ?? null,
      "Bihar's 'Seven Resolves' (Saat Nishchay) governance vision. The youth resolve drives higher-education access, a job-search allowance and employability skilling — delivered through the Student Credit Card, Self-Help Allowance (MNSSBY) and Kushal Yuva Program.",
      "बिहार की 'सात निश्चय' शासन दृष्टि। युवा निश्चय उच्च शिक्षा तक पहुँच, रोज़गार-खोज भत्ता एवं रोज़गार-योग्यता कौशल को प्रेरित करता है — स्टूडेंट क्रेडिट कार्ड, स्वयं सहायता भत्ता (MNSSBY) एवं कुशल युवा कार्यक्रम के माध्यम से।",
      "active",
      PORTAL,
      ON,
      ["employment", "education"],
      "mission",
    ];
    const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
    const [r] = await query<{ id: string }>(`insert into policies (${cols.join(", ")}) values (${ph}) returning id`, vals);
    saat = r.id;
    console.log(`inserted umbrella policy: ${SAAT} → ${saat}`);
  } else {
    console.log(`policy exists: ${SAAT}`);
  }

  for (const [schemeName, policyName] of LINKS) {
    const [s] = await query<{ id: string }>(`select id from schemes where name_en=$1`, [schemeName]);
    const [p] = await query<{ id: string }>(`select id from policies where name_en=$1`, [policyName]);
    if (!s || !p) {
      console.warn(`!! skip link (missing): ${schemeName} → ${policyName}`);
      continue;
    }
    await query(
      `insert into scheme_policy_links (scheme_id, policy_id) values ($1,$2) on conflict do nothing`,
      [s.id, p.id]
    );
    console.log(`linked: ${schemeName} → ${policyName}`);
  }
  console.log("Done.");
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
