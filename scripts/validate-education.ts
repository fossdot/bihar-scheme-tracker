/**
 * Validate data/education-spend/*.yaml against the JSON Schemas + the module's no-fabrication
 * cross-field rules (education-spend-schema-proposal.md §4). No database needed — pure file
 * checks, so it runs fast in CI. Exit code 1 on any error.
 *   npm run data:validate-education
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { load } from "js-yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = join(__dirname, "..", "data");
const DIR = join(ROOT, "education-spend");
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const schema = (f: string) => ajv.compile(JSON.parse(readFileSync(join(ROOT, "schema", f), "utf8")));
const validateAgencies = schema("edu-agency.schema.json");
const validateProgrammes = schema("edu-programme.schema.json");
const validateAudits = schema("edu-audit.schema.json");

const errors: string[] = [];
const warnings: string[] = [];
const today = new Date().toISOString().slice(0, 10);

// The 38 Bihar districts seeded in the migration (district refs must match one of these).
const DISTRICTS = new Set(["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"]);
const AWAITED = new Set(["rti_needed", "rti_filed"]);

function readYaml<T = any>(file: string): T {
  const p = join(DIR, file);
  if (!existsSync(p)) return [] as unknown as T;
  try { return (load(readFileSync(p, "utf8")) ?? []) as T; }
  catch (e) { errors.push(`${file}: YAML parse error — ${(e as Error).message}`); return [] as unknown as T; }
}
function ajvErr(file: string, errs: any) { for (const e of errs ?? []) errors.push(`${file}: ${e.instancePath || "(root)"} ${e.message}`); }
function futureCheck(file: string, d?: string | null) { if (typeof d === "string" && d > today) errors.push(`${file}: last_verified ${d} is in the future`); }

const agencies: any[] = readYaml("agencies.yaml");
const programmes: any[] = readYaml("programmes.yaml");
const audits: any[] = readYaml("audits.yaml");

if (!validateAgencies(agencies)) ajvErr("agencies.yaml", validateAgencies.errors);
if (!validateProgrammes(programmes)) ajvErr("programmes.yaml", validateProgrammes.errors);
if (!validateAudits(audits)) ajvErr("audits.yaml", validateAudits.errors);

const agencyNames = new Set(agencies.map((a) => a.name_en));
const programmeNames = new Set(programmes.map((p) => p.name_en));

// Enforce a priced stage carries its provenance + source, and awaited provenance carries no figure.
function checkStage(loc: string, cr: any, prov: any, url: any, doc: any, opts: { isSpent?: boolean } = {}) {
  const priced = cr != null;
  if (priced && !prov) errors.push(`${loc}: has an amount but no provenance`);
  if (priced && !url) errors.push(`${loc}: has an amount but no source_url (no sourceless numbers)`);
  if (priced && AWAITED.has(prov)) errors.push(`${loc}: amount present but provenance '${prov}' means data is awaited — value must be null`);
  if (!priced && prov && !AWAITED.has(prov) && prov !== "estimated")
    warnings.push(`${loc}: no amount but provenance '${prov}' — a null figure should be rti_needed/rti_filed/estimated`);
  if (priced && prov === "estimated" && opts.isSpent) errors.push(`${loc}: spent figures must never be 'estimated' (actuals are not estimated)`);
  if (priced && prov === "estimated" && !doc) errors.push(`${loc}: 'estimated' amount needs an explaining source_doc/note`);
}

// Agencies: parent must resolve.
for (const a of agencies) {
  futureCheck(`agencies.yaml[${a.name_en}]`, a.last_verified);
  if (a.parent && !agencyNames.has(a.parent)) errors.push(`agencies.yaml[${a.name_en}]: parent "${a.parent}" not found among agencies`);
}

// Programmes + nested allocations / expenditure lines.
for (const p of programmes) {
  const at = `programmes.yaml[${p.name_en}]`;
  futureCheck(at, p.last_verified);
  if (p.parent_programme && !programmeNames.has(p.parent_programme)) errors.push(`${at}: parent_programme "${p.parent_programme}" not found`);
  if (p.centre_share_pct != null && p.state_share_pct != null && p.centre_share_pct + p.state_share_pct !== 100)
    errors.push(`${at}: centre_share_pct + state_share_pct must equal 100 (got ${p.centre_share_pct} + ${p.state_share_pct})`);
  for (const ag of p.agencies ?? []) if (!agencyNames.has(ag.agency)) errors.push(`${at}: agency role references unknown agency "${ag.agency}"`);
  for (const al of p.allocations ?? []) {
    const l = `${at} alloc ${al.fiscal_year}`;
    futureCheck(l, al.last_verified);
    if (al.agency && !agencyNames.has(al.agency)) errors.push(`${l}: unknown agency "${al.agency}"`);
    if (al.district && !DISTRICTS.has(al.district)) errors.push(`${l}: unknown district "${al.district}"`);
    checkStage(`${l}/approved`, al.approved_cr, al.approved_provenance, al.approved_source_url, al.approved_source_doc);
    checkStage(`${l}/released`, al.released_cr, al.released_provenance, al.released_source_url, al.released_source_doc);
    checkStage(`${l}/spent`, al.spent_cr, al.spent_provenance, al.spent_source_url, al.spent_source_doc, { isSpent: true });
    if (al.released_cr != null && al.released_centre_cr != null && al.released_state_cr != null &&
        Math.abs(al.released_centre_cr + al.released_state_cr - al.released_cr) > 0.01)
      errors.push(`${l}: released_centre + released_state (${al.released_centre_cr}+${al.released_state_cr}) must equal released_cr (${al.released_cr})`);
  }
  for (const el of p.expenditure_lines ?? []) {
    const l = `${at} expline ${el.category} ${el.fiscal_year}`;
    futureCheck(l, el.last_verified);
    if (el.agency && !agencyNames.has(el.agency)) errors.push(`${l}: unknown agency "${el.agency}"`);
    if (el.district && !DISTRICTS.has(el.district)) errors.push(`${l}: unknown district "${el.district}"`);
    checkStage(`${l}/approved`, el.approved_cr, el.approved_provenance, el.approved_source_url, el.approved_source_doc);
    checkStage(`${l}/spent`, el.spent_cr, el.spent_provenance, el.spent_source_url, el.spent_source_doc, { isSpent: true });
  }
}

// Audits.
for (const a of audits) {
  const at = `audits.yaml[${a.report_ref ?? a.finding_en.slice(0, 30)}]`;
  futureCheck(at, a.last_verified);
  if (a.programme && !programmeNames.has(a.programme)) errors.push(`${at}: programme "${a.programme}" not found`);
  if (a.agency && !agencyNames.has(a.agency)) errors.push(`${at}: agency "${a.agency}" not found`);
  if (a.district && !DISTRICTS.has(a.district)) errors.push(`${at}: unknown district "${a.district}"`);
  if (a.amount_flagged_cr != null && AWAITED.has(a.provenance)) errors.push(`${at}: amount_flagged present but provenance '${a.provenance}' means data awaited`);
}

console.log(`Validated ${agencies.length} agencies, ${programmes.length} programmes, ${audits.length} audit findings.`);
if (warnings.length) { console.log(`\n⚠ ${warnings.length} warning(s):`); warnings.forEach((w) => console.log("  - " + w)); }
if (errors.length) { console.log(`\n✗ ${errors.length} error(s):`); errors.forEach((e) => console.log("  - " + e)); process.exitCode = 1; }
else console.log("\n✓ All education-spend records valid.");
