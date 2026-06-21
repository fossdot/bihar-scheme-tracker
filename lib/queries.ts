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
  SchemeStatus,
} from "./types";

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const LIST_COLUMNS = `
  s.id, s.name_en, s.name_hi, s.categories, s.status, s.objective_en, s.objective_hi,
  s.benefit_type, s.min_age, s.max_age, s.last_verified, s.last_budget_year,
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
  filters: SchemeFilters
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
    `select ${LIST_COLUMNS} from ${LIST_FROM} ${where} order by ${orderBy} limit 50`,
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
          `select id, name_en, name_hi, status, categories
             from schemes
            where id <> $1 and categories && $2::text[]
            order by name_en limit 6`,
          [id, scheme.categories]
        )
      : Promise.resolve<SchemeDetail["similar"]>([]),
  ]);

  return { scheme, department, allocations, metrics, policies, successor, similar };
}

const POLICY_LIST_COLUMNS = `
  p.id, p.name_en, p.name_hi, p.summary_en, p.summary_hi, p.categories, p.status,
  p.is_draft, p.policy_type, p.period_start, p.period_end, p.superseded_by,
  p.consultation_end, p.last_verified,
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

export type PolicyMapGroup = {
  policy: {
    id: string;
    name_en: string;
    name_hi: string | null;
    is_draft: boolean;
    superseded_by: string | null;
    period_end: string | null;
    consultation_end: string | null;
  };
  schemes: { id: string; name_en: string; name_hi: string | null; status: SchemeStatus }[];
};

/** Policies that have ≥1 linked scheme, each with its schemes — powers the Map view. */
export async function getPolicyMap(): Promise<PolicyMapGroup[]> {
  const rows = await query<{
    policy_id: string;
    p_en: string;
    p_hi: string | null;
    is_draft: boolean;
    superseded_by: string | null;
    period_end: string | null;
    consultation_end: string | null;
    scheme_id: string;
    s_en: string;
    s_hi: string | null;
    status: SchemeStatus;
  }>(
    `select p.id as policy_id, p.name_en as p_en, p.name_hi as p_hi, p.is_draft,
            p.superseded_by, p.period_end, p.consultation_end,
            s.id as scheme_id, s.name_en as s_en, s.name_hi as s_hi, s.status
       from scheme_policy_links l
       join policies p on p.id = l.policy_id
       join schemes s on s.id = l.scheme_id
      order by p.name_en, s.name_en`
  );
  const groups = new Map<string, PolicyMapGroup>();
  for (const r of rows) {
    if (!groups.has(r.policy_id)) {
      groups.set(r.policy_id, {
        policy: {
          id: r.policy_id,
          name_en: r.p_en,
          name_hi: r.p_hi,
          is_draft: r.is_draft,
          superseded_by: r.superseded_by,
          period_end: r.period_end,
          consultation_end: r.consultation_end,
        },
        schemes: [],
      });
    }
    groups.get(r.policy_id)!.schemes.push({
      id: r.scheme_id,
      name_en: r.s_en,
      name_hi: r.s_hi,
      status: r.status,
    });
  }
  return Array.from(groups.values());
}
