import { query } from "./db";
import { DEFAULT_BUCKETS, statusesForBuckets } from "./status";
import type {
  BudgetAllocation,
  Department,
  Policy,
  PolicyDetail,
  PolicyListItem,
  Scheme,
  SchemeCategory,
  SchemeDetail,
  SchemeFilters,
  SchemeListItem,
  SchemeMetric,
} from "./types";

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export interface RtiApplication {
  scheme_id: string;
  scheme_name_en: string;
  scheme_name_hi: string | null;
  dimension: string;
  fiscal_year: string | null;
  label: string | null;
  label_hi: string | null;
  unit: string | null;
  value: number | null;
  provenance: string;
  as_of_date: string | null;
  source_url: string | null;
  document_url: string | null;
  note: string | null;
  note_hi: string | null;
}

/**
 * The RTI tracker: every scheme_metric whose provenance is part of the RTI lifecycle
 * (needed → filed → received). This page IS the public evidence trail. Ordered so the
 * live ones (filed/received) sit above the not-yet-filed (needed).
 */
export async function listRtiApplications(): Promise<RtiApplication[]> {
  const rows = await query<RtiApplication>(
    `select m.scheme_id,
            s.name_en as scheme_name_en,
            s.name_hi as scheme_name_hi,
            m.dimension, m.fiscal_year, m.label, m.label_hi, m.unit, m.value,
            m.provenance::text as provenance,
            m.as_of_date::text as as_of_date,
            m.source_url, m.document_url, m.note, m.note_hi
       from scheme_metrics m
       join schemes s on s.id = m.scheme_id
      where m.provenance in ('rti_needed','rti_filed','rti_received')
      order by case m.provenance
                 when 'rti_received' then 0
                 when 'rti_filed' then 1
                 else 2 end,
               s.name_en, m.dimension, m.label`
  );
  // Collapse per-district DATA rows (value != null) into one "(N districts)" summary line per
  // scheme — a received reply otherwise floods the tracker with dozens of rows all citing the
  // same document. Dimension-level placeholders (value null, e.g. the filed/needed "District &
  // demographic breakdown" markers) pass through untouched, and the scheme pages keep the full
  // per-district detail.
  const out: RtiApplication[] = [];
  const collapsed = new Set<string>();
  for (const r of rows) {
    if (!(r.dimension === "district" && r.value != null)) {
      out.push(r);
      continue;
    }
    const key = `${r.scheme_id}:${r.provenance}`;
    if (collapsed.has(key)) continue;
    collapsed.add(key);
    const group = rows.filter(
      (g) =>
        g.scheme_id === r.scheme_id &&
        g.provenance === r.provenance &&
        g.dimension === "district" &&
        g.value != null
    );
    const fy = group.every((g) => g.fiscal_year === group[0].fiscal_year) ? group[0].fiscal_year : null;
    const n = group.length;
    out.push({
      ...r,
      label: `District-wise breakdown${fy ? `, FY${fy}` : ""} (${n} districts)`,
      label_hi: `जिलावार विवरण${fy ? `, ${fy}` : ""} (${n} ज़िले)`,
      value: null,
      unit: null,
      // Keep only the shared provenance tail ("Received via …"), not one district's figure.
      note: r.note?.match(/Received via .*/)?.[0] ?? null,
      note_hi: null,
    });
  }
  return out;
}

/** Aggregate counts for the home page — a cheap COUNT instead of fetching (and capping) rows. */
export async function getSchemeCounts(): Promise<{ total: number; active: number }> {
  const rows = await query<{ total: number; active: number }>(
    `select count(*)::int total, count(*) filter (where status = 'active')::int active from schemes`
  );
  return { total: rows[0]?.total ?? 0, active: rows[0]?.active ?? 0 };
}

// Generous backstop on a single result page. The finder returns ALL matching schemes (then
// paginates client-side) so nothing potentially-live is hidden — CLAUDE.md: never hide help.
// This cap only guards against pathological growth; bump or switch to server-side LIMIT/OFFSET
// if the registry ever exceeds it. The header count stays accurate up to this number.
export const LIST_LIMIT = 500;

const LIST_COLUMNS = `
  s.id, s.name_en, s.name_hi, s.categories, s.status, s.objective_en, s.objective_hi,
  s.benefit_type, s.min_age, s.max_age, s.last_verified, s.last_budget_year, s.source_url,
  d.name_en as department_en, d.name_hi as department_hi`;
const LIST_FROM = "schemes s left join departments d on d.id = s.department_id";

// Small bilingual alias map so common paraphrases find the right scheme without a
// semantic-search pipeline. Cheap to extend; keys are matched as substrings (lowercased).
const SYNONYMS: Record<string, string[]> = {
  loan: ["credit card", "ऋण"],
  scholarship: ["credit card", "छात्रवृत्ति"],
  allowance: ["swayam sahayata bhatta", "भत्ता"],
  stipend: ["swayam sahayata bhatta", "भत्ता"],
  unemployment: ["swayam sahayata bhatta", "बेरोज़गार"],
  berojgari: ["swayam sahayata bhatta", "भत्ता"],
  skill: ["kushal yuva", "कौशल"],
  training: ["kushal yuva", "प्रशिक्षण"],
  computer: ["kushal yuva"],
};

/** Append OR-aliases for any known synonym present in the query (websearch syntax). */
function expandQuery(q: string): string {
  const lower = q.toLowerCase();
  const extra = new Set<string>();
  for (const [key, vals] of Object.entries(SYNONYMS)) {
    if (lower.includes(key)) vals.forEach((v) => extra.add(v));
  }
  if (extra.size === 0) return q;
  const ors = Array.from(extra)
    .map((t) => (t.includes(" ") ? `"${t}"` : t))
    .join(" OR ");
  return `${q} OR ${ors}`;
}

/**
 * The finder. Combines free-text search with structured-eligibility facets.
 *
 * Text (when `q` given): exact full-text (synonym-expanded) OR substring OR typo-tolerant
 *   trigram, ranked by the best of the three.
 * Facets describe the CITIZEN; we keep schemes whose eligibility ADMITS them. A scheme
 *   with no restriction on a dimension (empty array / null band) matches everyone on it —
 *   so partial profiles never over-exclude (CLAUDE.md: never hide potentially-live help).
 * Status: filtered to the citizen-facing buckets (default Active + Possibly active).
 */
export async function searchSchemes(
  filters: SchemeFilters,
  limit: number = LIST_LIMIT
): Promise<SchemeListItem[]> {
  const params: unknown[] = [];
  const p = (val: unknown) => `$${params.push(val)}`; // push + return its placeholder

  const conds: string[] = [];
  let orderBy = "s.name_en";

  // ── free-text (optional) ──
  const trimmed = (filters.q ?? "").trim();
  if (trimmed) {
    const pTsq = p(expandQuery(trimmed)); // synonym-expanded FTS query
    const pRaw = p(trimmed); // raw query for trigram / ILIKE
    conds.push(
      `(s.search_tsv @@ websearch_to_tsquery('simple', ${pTsq})
         or s.search_text ilike '%' || ${pRaw} || '%'
         or word_similarity(${pRaw}, s.search_text) > 0.3)`
    );
    orderBy = `greatest(
                 ts_rank(s.search_tsv, websearch_to_tsquery('simple', ${pTsq})),
                 word_similarity(${pRaw}, s.search_text),
                 case when s.search_text ilike '%' || ${pRaw} || '%' then 0.45 else 0 end
               ) desc, s.name_en`;
  }

  // ── status buckets (default = Active + Possibly active) ──
  const buckets = filters.buckets?.length ? filters.buckets : DEFAULT_BUCKETS;
  conds.push(`status = any(${p(statusesForBuckets(buckets))}::scheme_status[])`);

  // ── eligibility facets: scheme matches if it admits the citizen ──
  if (filters.personas?.length)
    conds.push(
      `(cardinality(personas) = 0 or personas && ${p(filters.personas)}::text[])`
    );
  if (filters.education_levels?.length)
    conds.push(
      `(cardinality(education_levels) = 0 or education_levels && ${p(
        filters.education_levels
      )}::text[])`
    );
  if (filters.social_categories?.length)
    conds.push(
      `(cardinality(social_categories) = 0 or social_categories && ${p(
        filters.social_categories
      )}::text[])`
    );
  if (filters.gender)
    conds.push(`(gender_eligibility = 'any' or gender_eligibility = ${p(filters.gender)})`);
  if (typeof filters.age === "number") {
    const pAge = p(filters.age);
    conds.push(`(min_age is null or min_age <= ${pAge})`);
    conds.push(`(max_age is null or max_age >= ${pAge})`);
  }
  // income: a scheme admits the citizen if it has no income bar, or its ceiling is at/above them
  if (typeof filters.income === "number")
    conds.push(`(income_ceiling is null or income_ceiling >= ${p(filters.income)})`);
  // disability-exclusive schemes only surface when the citizen indicates a disability
  if (filters.is_for_disabled === false) conds.push(`is_for_disabled = false`);

  // ── category is an INTEREST narrower (not eligibility): overlap with chosen sectors ──
  if (filters.categories?.length)
    conds.push(`categories && ${p(filters.categories)}::text[]`);

  const where = conds.length ? `where ${conds.join("\n         and ")}` : "";
  return query<SchemeListItem>(
    `select ${LIST_COLUMNS} from ${LIST_FROM} ${where} order by ${orderBy} limit ${p(limit)}`,
    params
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One scheme + its department + budget allocations. Returns null for a malformed id
 * or a missing row so the page can render a clean 404 instead of a Postgres error.
 */
export async function getSchemeDetail(id: string): Promise<SchemeDetail | null> {
  if (!UUID_RE.test(id)) return null;

  const [scheme] = await query<Scheme>(`select * from schemes where id = $1`, [id]);
  if (!scheme) return null;

  // The scheme row is fetched first (needed for the FKs below); the remaining six queries are
  // independent of each other, so run them in parallel rather than sequentially (was N+1-ish).
  const [department, allocations, metrics, policies, successor, similar] = await Promise.all([
    scheme.department_id
      ? query<Department>(`select * from departments where id = $1`, [scheme.department_id]).then((r) => r[0] ?? null)
      : Promise.resolve<Department | null>(null),
    query<BudgetAllocation>(
      `select * from budget_allocations where scheme_id = $1 order by fiscal_year`,
      [id]
    ),
    query<SchemeMetric>(
      `select * from scheme_metrics where scheme_id = $1 order by dimension, fiscal_year nulls last`,
      [id]
    ),
    query<{ id: string; name_en: string; name_hi: string | null }>(
      `select p.id, p.name_en, p.name_hi
         from scheme_policy_links l join policies p on p.id = l.policy_id
        where l.scheme_id = $1 order by p.name_en`,
      [id]
    ),
    scheme.successor_scheme_id
      ? query<{ id: string; name_en: string; name_hi: string | null }>(
          `select id, name_en, name_hi from schemes where id = $1`,
          [scheme.successor_scheme_id]
        ).then((r) => r[0] ?? null)
      : Promise.resolve<SchemeDetail["successor"]>(null),
    scheme.categories.length
      ? query<SchemeDetail["similar"][number]>(
          // Mirror the finder's default view: never surface Inactive (lapsed/subsumed/superseded)
          // schemes in this default rail (CLAUDE.md — Inactive is opt-in only).
          `select id, name_en, name_hi, status, categories
             from schemes
            where id <> $1 and categories && $2::text[]
              and status = any($3::scheme_status[])
            order by name_en limit 6`,
          [id, scheme.categories, statusesForBuckets(DEFAULT_BUCKETS)]
        )
      : Promise.resolve<SchemeDetail["similar"]>([]),
  ]);

  return { scheme, department, allocations, metrics, policies, successor, similar };
}

// NOTE: the asserted `p.status` enum is deliberately NOT selected — policy display status is
// DERIVED (lib/policy.ts policyStatusKey) from is_draft/period_end/consultation_end/superseded_by,
// never the stored column. Callers derive; the API emits the derived value (CLAUDE.md: never asserted).
const POLICY_LIST_COLUMNS = `
  p.id, p.name_en, p.name_hi, p.summary_en, p.summary_hi, p.categories,
  p.is_draft, p.policy_type, p.period_start, p.period_end, p.superseded_by,
  p.consultation_end, p.last_verified, p.source_url,
  d.name_en as department_en, d.name_hi as department_hi`;

/** List policies, with optional text search, sector filter, and a drafts-only filter.
 *  Coarse status (in force / lapsed / open) is derived in the UI from the returned fields. */
export async function listPolicies(opts: {
  q?: string;
  categories?: SchemeCategory[];
  draftOnly?: boolean;
}): Promise<PolicyListItem[]> {
  const params: unknown[] = [];
  const p = (v: unknown) => `$${params.push(v)}`;
  const conds: string[] = [];

  const q = (opts.q ?? "").trim();
  if (q) {
    const like = p(`%${q}%`);
    conds.push(
      `(p.name_en ilike ${like} or p.name_hi ilike ${like} or p.summary_en ilike ${like})`
    );
  }
  if (opts.categories?.length)
    conds.push(`p.categories && ${p(opts.categories)}::text[]`);
  if (opts.draftOnly) conds.push(`p.is_draft = true`);

  const where = conds.length ? `where ${conds.join(" and ")}` : "";
  return query<PolicyListItem>(
    `select ${POLICY_LIST_COLUMNS}
       from policies p left join departments d on d.id = p.department_id
       ${where}
      order by p.is_draft desc, p.name_en
      limit 100`,
    params
  );
}

/** One policy + its department + the successor it points to (if superseded). */
export async function getPolicyDetail(id: string): Promise<PolicyDetail | null> {
  if (!UUID_RE.test(id)) return null;

  const [policy] = await query<Policy>(`select * from policies where id = $1`, [id]);
  if (!policy) return null;

  let department: Department | null = null;
  if (policy.department_id) {
    const [dep] = await query<Department>(`select * from departments where id = $1`, [
      policy.department_id,
    ]);
    department = dep ?? null;
  }

  let successor: PolicyDetail["successor"] = null;
  if (policy.superseded_by) {
    const [s] = await query<{ id: string; name_en: string; name_hi: string | null }>(
      `select id, name_en, name_hi from policies where id = $1`,
      [policy.superseded_by]
    );
    successor = s ?? null;
  }

  const schemes = await query<PolicyDetail["schemes"][number]>(
    `select s.id, s.name_en, s.name_hi, s.status
       from scheme_policy_links l join schemes s on s.id = l.scheme_id
      where l.policy_id = $1 order by s.name_en`,
    [id]
  );

  const related = policy.categories.length
    ? await query<PolicyDetail["related"][number]>(
        `select id, name_en, name_hi, is_draft, superseded_by, period_end, consultation_end
           from policies
          where id <> $1 and categories && $2::text[]
          order by name_en limit 6`,
        [id, policy.categories]
      )
    : [];

  return { policy, department, successor, schemes, related };
}
