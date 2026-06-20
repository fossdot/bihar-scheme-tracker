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
  // referential + completeness (warnings)
  if ((status === "subsumed" || status === "superseded") && !successor_scheme) warnings.push(`${file}: status '${status}' but no successor_scheme set`);
  if (successor_scheme && !schemeNames.has(successor_scheme)) warnings.push(`${file}: successor_scheme "${successor_scheme}" not found among schemes`);
  for (const p of (pols ?? [])) if (!policyNames.has(p)) warnings.push(`${file}: policy "${p}" not found among policies`);
}

for (const { file, data } of policies) {
  if (!validatePolicy(data)) ajvErr(file, validatePolicy.errors);
  const { last_verified, successor_policy } = data as Record<string, any>;
  if (typeof last_verified === "string" && last_verified > today) errors.push(`${file}: last_verified ${last_verified} is in the future`);
  if (successor_policy && !policyNames.has(successor_policy)) warnings.push(`${file}: successor_policy "${successor_policy}" not found among policies`);
}

console.log(`Validated ${schemes.length} schemes + ${policies.length} policies.`);
if (warnings.length) { console.log(`\n⚠ ${warnings.length} warning(s):`); warnings.forEach((w) => console.log("  - " + w)); }
if (errors.length) {
  console.log(`\n✗ ${errors.length} error(s):`); errors.forEach((e) => console.log("  - " + e));
  process.exitCode = 1;
} else {
  console.log("\n✓ All records valid.");
}
