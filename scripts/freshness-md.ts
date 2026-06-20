/**
 * Emit a markdown freshness report from the data files' last_verified dates (no DB needed —
 * runs in CI). Used by the quarterly freshness-reminder GitHub Action to open a re-verification
 * issue. Writes freshness.md. Local use: `npx tsx scripts/freshness-md.ts`.
 */
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { load } from "js-yaml";

const ROOT = join(__dirname, "..", "data");
const DUE = 150; // days → flag for review (under the 365 hard-stale line, so it's proactive)
const today = Date.now();

function age(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.floor((today - t) / 86_400_000);
}
function read(sub: string): { kind: string; name: string; days: number | null }[] {
  let files: string[] = [];
  try { files = readdirSync(join(ROOT, sub)).filter((f) => f.endsWith(".yaml")); } catch { return []; }
  return files.map((f) => {
    const d = load(readFileSync(join(ROOT, sub, f), "utf8")) as Record<string, string>;
    return { kind: sub === "schemes" ? "scheme" : "policy", name: d.name_en, days: age(d.last_verified) };
  });
}

const all = [...read("schemes"), ...read("policies")];
const due = all.filter((r) => (r.days ?? 1e9) >= DUE).sort((a, b) => (b.days ?? 0) - (a.days ?? 0));

const lines: string[] = [];
lines.push(`### Quarterly re-verification\n`);
lines.push(`${all.length} entries checked. **${due.length}** are over ${DUE} days since \`last_verified\` and due for a re-check.\n`);
if (due.length) {
  lines.push(`| Entry | Type | Days since verified |`);
  lines.push(`|---|---|---|`);
  for (const r of due) lines.push(`| ${r.name} | ${r.kind} | ${r.days} |`);
} else {
  lines.push(`✓ Everything is within ${DUE} days — a light spot-check of the marquee schemes is still worthwhile.`);
}
lines.push(`\n**How to re-verify:** re-run the verification pass (official sources) on the entries above, update \`status_evidence\` + \`last_verified\` in their \`data/\` files, then \`npm run data:load\` → \`data:dump\` → redeploy. See \`docs/verification-log.md\` → "Freshness loop".`);

writeFileSync(join(__dirname, "..", "freshness.md"), lines.join("\n") + "\n");
console.log(`due=${due.length} total=${all.length}`);
