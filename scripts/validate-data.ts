/**
 * Validate every data/schemes/*.yaml and data/policies/*.yaml against the JSON Schemas
 * + the project's cross-field rules. No database needed — pure file checks, so it runs
 * fast in CI on every PR. Exit code 1 on any error (blocks merge).
 *   npm run data:validate
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { load } from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = join(__dirname, "..", "data");
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateScheme = ajv.compile(JSON.parse(readFileSync(join(ROOT, "schema", "scheme.schema.json"), "utf8")));
const validatePolicy = ajv.compile(JSON.parse(readFileSync(join(ROOT, "schema", "policy.schema.json"), "utf8")));

const errors: string[] = [];
const warnings: string[] = [];
const today = new Date().toISOString().slice(0, 10);

function readDir(sub: string): { file: string; data: Record<string, unknown> }[] {
  const dir = join(ROOT, sub);
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")); }
  catch { return []; }
  return files.map((f) => {
    try { return { file: `${sub}/${f}`, data: load(readFileSync(join(dir, f), "utf8")) as Record<string, unknown> }; }
    catch (e) { errors.push(`${sub}/${f}: YAML parse error — ${(e as Error).message}`); return null; }
  }).filter(Boolean) as { file: string; data: Record<string, unknown> }[];
}

const schemes = readDir("schemes");
const policies = readDir("policies");
const schemeNames = new Set(schemes.map((s) => s.data.name_en as string));
const policyNames = new Set(policies.map((p) => p.data.name_en as string));

function ajvErr(file: string, errs: typeof validateScheme.errors) {
  for (const e of errs ?? []) errors.push(`${file}: ${e.instancePath || "(root)"} ${e.message}`);
}

for (const { file, data } of schemes) {
  if (!validateScheme(data)) ajvErr(file, validateScheme.errors);
  const { min_age, max_age, requires_bpl, income_ceiling, last_verified, status, successor_scheme, policies: pols } = data as Record<string, any>;
  // cross-field rules (CLAUDE.md)
  if (min_age != null && max_age != null && min_age > max_age) errors.push(`${file}: min_age (${min_age}) > max_age (${max_age})`);
  if (requires_bpl === true && income_ceiling != null) errors.push(`${file}: requires_bpl and income_ceiling must not both be set`);
  if (typeof last_verified === "string" && last_verified > today) errors.push(`${file}: last_verified ${last_verified} is in the future`);
  // referential + completeness
  if ((status === "subsumed" || status === "superseded") && !successor_scheme) warnings.push(`${file}: status '${status}' but no successor_scheme set`);
  // A successor_scheme that names a non-existent scheme is a dangling pointer (load drops it
  // silently, so the citizen loses the "continue via" link) — hard error, not a warning.
  if (successor_scheme && !schemeNames.has(successor_scheme)) errors.push(`${file}: successor_scheme "${successor_scheme}" not found among schemes (dangling reference)`);
  for (const p of (pols ?? [])) if (!policyNames.has(p)) warnings.push(`${file}: policy "${p}" not found among policies`);
  // metrics: enforce the no-fabrication rule (CLAUDE.md) at the data layer.
  for (const m of ((data as Record<string, any>).metrics ?? [])) {
    // Any non-null figure must carry a source — regardless of provenance. No sourceless numbers.
    if (m.value != null && !m.source_url)
      errors.push(`${file}: metric "${m.label ?? m.dimension}" has a value but no source_url`);
    // rti_filed / rti_needed mean "data awaited" — they must NOT carry a figure.
    if (m.value != null && (m.provenance === "rti_needed" || m.provenance === "rti_filed"))
      errors.push(`${file}: metric "${m.label ?? m.dimension}" has a value but provenance '${m.provenance}' means no data yet — use published/reported/rti_received/estimated`);
    // A null value is the honest placeholder only for awaited/estimated provenance.
    if (m.value == null && !["rti_needed", "rti_filed", "estimated"].includes(m.provenance))
      errors.push(`${file}: metric "${m.label ?? m.dimension}" has no value — provenance must be rti_needed/rti_filed/estimated, not '${m.provenance}'`);
    // 'estimated' is the weakest provenance: require a source AND an explaining note.
    if (m.value != null && m.provenance === "estimated" && !m.note)
      errors.push(`${file}: metric "${m.label ?? m.dimension}" is 'estimated' — add a note explaining the basis`);
  }
}

for (const { file, data } of policies) {
  if (!validatePolicy(data)) ajvErr(file, validatePolicy.errors);
  const { last_verified, successor_policy } = data as Record<string, any>;
  if (typeof last_verified === "string" && last_verified > today) errors.push(`${file}: last_verified ${last_verified} is in the future`);
  if (successor_policy && !policyNames.has(successor_policy)) errors.push(`${file}: successor_policy "${successor_policy}" not found among policies (dangling reference)`);
}

// Department consistency: load-data dedups departments by name_en, keeping whichever file
// loads first — so disagreeing name_hi/website across files would be silently mutated on the
// next export round-trip. Flag conflicts so the data stays self-consistent.
{
  const seen = new Map<string, { file: string; hi: unknown; web: unknown }>();
  for (const { file, data } of [...schemes, ...policies]) {
    const d = data as Record<string, any>;
    if (!d.department_en) continue;
    const prev = seen.get(d.department_en);
    if (!prev) { seen.set(d.department_en, { file, hi: d.department_hi ?? null, web: d.department_website ?? null }); continue; }
    if ((d.department_hi ?? null) !== prev.hi || (d.department_website ?? null) !== prev.web)
      errors.push(`${file}: department "${d.department_en}" has name_hi/website differing from ${prev.file} — they must agree (load dedups by name_en)`);
  }
}

// Circular successor links would make "continues via" loop forever.
function checkCycles(items: { data: Record<string, any> }[], key: string, kind: string) {
  const succ = new Map(items.map((x) => [x.data.name_en as string, x.data[key] as string | undefined]));
  for (const start of Array.from(succ.keys())) {
    const seen = new Set<string>([start]);
    let cur = succ.get(start);
    while (cur) {
      if (seen.has(cur)) { errors.push(`circular ${kind} successor: "${start}" eventually loops back`); break; }
      seen.add(cur);
      cur = succ.get(cur);
    }
  }
}
checkCycles(schemes, "successor_scheme", "scheme");
checkCycles(policies, "successor_policy", "policy");

console.log(`Validated ${schemes.length} schemes + ${policies.length} policies.`);
if (warnings.length) { console.log(`\n⚠ ${warnings.length} warning(s):`); warnings.forEach((w) => console.log("  - " + w)); }
if (errors.length) {
  console.log(`\n✗ ${errors.length} error(s):`); errors.forEach((e) => console.log("  - " + e));
  process.exitCode = 1;
} else {
  console.log("\n✓ All records valid.");
}
