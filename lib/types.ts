// Hand-written row types mirroring the migration. (Swap for `supabase gen types`
// output once the CLI is wired up.)

export type SchemeStatus =
  | "active"
  | "likely_active"
  | "dormant"
  | "subsumed"
  | "superseded"
  | "lapsed"
  | "unknown";

// ── Structured-eligibility vocabularies (mirror the migration's CHECK lists) ──
export type SchemeCategory =
  | "agriculture"
  | "education"
  | "employment"
  | "skilling"
  | "industry"
  | "social_welfare"
  | "health"
  | "women_child"
  | "housing"
  | "financial_inclusion";

/** Occupation / life-situation only. Minority/disability/BPL/gender live in their
 *  own fields — one concept, one stored representation. */
export type Persona =
  | "student"
  | "farmer"
  | "agricultural_labourer"
  | "unemployed_youth"
  | "salaried_employee"
  | "self_employed_entrepreneur"
  | "artisan_weaver"
  | "worker_labourer"
  | "shg_jeevika_member"
  | "senior_citizen"
  | "widow"
  | "pregnant_lactating_woman";

export type EducationLevel =
  | "none"
  | "primary"
  | "secondary"
  | "senior_secondary"
  | "iti_diploma"
  | "graduate"
  | "postgraduate";

export type Gender = "any" | "female" | "male" | "transgender";

export type SocialCategory = "sc" | "st" | "ebc" | "bc" | "general" | "minority";

export type Domicile = "bihar" | "any";

export type LandOwnership = "raiyat" | "non_raiyat" | "any";

export interface Department {
  id: string;
  name_en: string;
  name_hi: string | null;
  website: string | null;
}

export interface Policy {
  id: string;
  name_en: string;
  name_hi: string | null;
  department_id: string | null;
  summary_en: string | null;
  summary_hi: string | null;
  period_start: string | null;
  period_end: string | null;
  status: SchemeStatus;
  superseded_by: string | null;
  source_url: string;
  last_verified: string | null;
  created_at: string;
  categories: SchemeCategory[];
  policy_type: string | null; // 'framework' | 'rules' | 'package' | 'regulation' | 'mission'
  document_url: string | null;
  is_draft: boolean;
  consultation_url: string | null;
  consultation_start: string | null;
  consultation_end: string | null;
  how_to_comment_en: string | null;
  how_to_comment_hi: string | null;
}

export type PolicyListItem = Pick<
  Policy,
  | "id"
  | "name_en"
  | "name_hi"
  | "summary_en"
  | "summary_hi"
  | "categories"
  | "status"
  | "is_draft"
  | "policy_type"
  | "period_start"
  | "period_end"
  | "superseded_by"
  | "consultation_end"
  | "last_verified"
> & {
  department_en: string | null;
  department_hi: string | null;
};

export interface PolicyDetail {
  policy: Policy;
  department: Department | null;
  successor: { id: string; name_en: string; name_hi: string | null } | null;
  schemes: {
    id: string;
    name_en: string;
    name_hi: string | null;
    status: SchemeStatus;
  }[];
  related: {
    id: string;
    name_en: string;
    name_hi: string | null;
    is_draft: boolean;
    superseded_by: string | null;
    period_end: string | null;
    consultation_end: string | null;
  }[];
}

export interface BudgetAllocation {
  id: string;
  scheme_id: string;
  fiscal_year: string;
  allocated_cr: number | null;
  revised_cr: number | null;
  source_url: string;
}

export interface Scheme {
  id: string;
  name_en: string;
  name_hi: string | null;
  department_id: string | null;
  categories: SchemeCategory[];
  launch_date: string | null;
  objective_en: string | null;
  objective_hi: string | null;
  eligibility_en: string | null;
  eligibility_hi: string | null;
  benefit_type: string | null;
  benefit_detail: string | null;
  target_beneficiary: string | null;
  // ── structured, filterable eligibility (free-text eligibility_* kept for display) ──
  personas: Persona[];
  education_levels: EducationLevel[];
  gender_eligibility: Gender;
  social_categories: SocialCategory[];
  min_age: number | null;
  max_age: number | null;
  income_ceiling: number | null; // annual ₹; null = no income bar
  requires_bpl: boolean;
  domicile: Domicile;
  is_for_disabled: boolean;
  is_for_startups: boolean;
  land_ownership: LandOwnership | null; // agriculture-only; null = N/A
  successor_scheme_id: string | null;
  application_portal_url: string | null;
  status: SchemeStatus;
  status_evidence: string | null;
  last_budget_year: string | null;
  last_notification_date: string | null;
  source_url: string;
  last_verified: string | null;
  created_at: string;
}

export type SchemeListItem = Pick<
  Scheme,
  | "id"
  | "name_en"
  | "name_hi"
  | "categories"
  | "status"
  | "objective_en"
  | "objective_hi"
  | "benefit_type"
  | "min_age"
  | "max_age"
  | "last_verified"
  | "last_budget_year"
> & {
  department_en: string | null;
  department_hi: string | null;
};

export type DataProvenance =
  | "published"
  | "reported"
  | "rti_received"
  | "rti_filed"
  | "rti_needed"
  | "estimated";

export type MetricDimension =
  | "budget"
  | "beneficiaries"
  | "district"
  | "demographics"
  | "outcomes";

export interface SchemeMetric {
  id: string;
  scheme_id: string;
  dimension: MetricDimension;
  fiscal_year: string | null; // null = dimension-level data-status marker
  label: string | null;
  label_hi: string | null; // Hindi label; null → falls back to `label` at render
  value: number | null; // null while only tracking provenance (e.g. RTI awaited)
  unit: string | null; // 'cr' | 'persons'
  provenance: DataProvenance;
  as_of_date: string | null;
  source_url: string | null;
  note: string | null;
  note_hi: string | null; // Hindi note; null → falls back to `note` at render
  created_at: string;
}

export interface SchemeDetail {
  scheme: Scheme;
  department: Department | null;
  allocations: BudgetAllocation[];
  metrics: SchemeMetric[];
  policies: { id: string; name_en: string; name_hi: string | null }[];
  successor: { id: string; name_en: string; name_hi: string | null } | null;
  similar: {
    id: string;
    name_en: string;
    name_hi: string | null;
    status: SchemeStatus;
    categories: SchemeCategory[];
  }[];
}

// ── Citizen-facing status buckets (the finder's coarse filter, per CLAUDE.md) ──
// "active" + "possibly_active" shown by default; "inactive" is opt-in (never hide
// potentially-live help). The card still shows the precise internal status.
export type StatusBucket = "active" | "possibly_active" | "inactive";

/** The finder's filter set. All fields optional — an absent field = "no constraint".
 *  `age`/`gender`/etc. describe the CITIZEN; we keep schemes whose eligibility admits
 *  them (e.g. a scheme with no age band matches any age). */
export interface SchemeFilters {
  q?: string;
  personas?: Persona[]; // citizen is any of these
  categories?: SchemeCategory[]; // scheme spans any of these sectors
  education_levels?: EducationLevel[]; // citizen has any of these
  social_categories?: SocialCategory[]; // citizen belongs to any of these
  gender?: Exclude<Gender, "any">; // citizen's gender
  age?: number; // citizen's age
  income?: number; // citizen's annual family income (₹) → schemes whose ceiling admits them
  is_for_disabled?: boolean; // citizen is disabled → include disability schemes too
  buckets?: StatusBucket[]; // default ["active","possibly_active"]
}
