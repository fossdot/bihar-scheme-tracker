import type { Locale } from "./i18n";
import type {
  EducationLevel,
  Gender,
  Persona,
  SchemeCategory,
  SchemeFilters,
  SocialCategory,
  StatusBucket,
} from "./types";

// Bilingual facet vocabularies for the finder UI. Values MUST stay in sync with the
// migration's CHECK lists (lib/types.ts mirrors them). en/hi are display only.
type Opt<T extends string> = { value: T; en: string; hi: string };

export const PERSONA_OPTIONS: Opt<Persona>[] = [
  { value: "student", en: "Student", hi: "विद्यार्थी" },
  { value: "unemployed_youth", en: "Unemployed youth", hi: "बेरोज़गार युवा" },
  { value: "farmer", en: "Farmer", hi: "किसान" },
  { value: "agricultural_labourer", en: "Agricultural labourer", hi: "कृषि मज़दूर" },
  { value: "salaried_employee", en: "Salaried employee", hi: "वेतनभोगी कर्मचारी" },
  { value: "self_employed_entrepreneur", en: "Self-employed / entrepreneur", hi: "स्वरोज़गार / उद्यमी" },
  { value: "artisan_weaver", en: "Artisan / weaver", hi: "शिल्पकार / बुनकर" },
  { value: "worker_labourer", en: "Worker / labourer", hi: "श्रमिक / मज़दूर" },
  { value: "shg_jeevika_member", en: "SHG / Jeevika member", hi: "स्वयं सहायता समूह / जीविका सदस्य" },
  { value: "senior_citizen", en: "Senior citizen", hi: "वरिष्ठ नागरिक" },
  { value: "widow", en: "Widow", hi: "विधवा" },
  { value: "pregnant_lactating_woman", en: "Pregnant / lactating woman", hi: "गर्भवती / स्तनपान कराने वाली महिला" },
];

// Ordered low → high. The citizen picks their HIGHEST level; we expand DOWN the ladder
// (someone with a degree has also cleared class 12), so "at least X" schemes match.
export const EDUCATION_OPTIONS: Opt<EducationLevel>[] = [
  { value: "none", en: "No formal education", hi: "कोई औपचारिक शिक्षा नहीं" },
  { value: "primary", en: "Primary (class 5)", hi: "प्राथमिक (कक्षा 5)" },
  { value: "secondary", en: "Secondary (class 10)", hi: "माध्यमिक (कक्षा 10)" },
  { value: "senior_secondary", en: "Senior secondary (class 12)", hi: "उच्च माध्यमिक (कक्षा 12)" },
  { value: "iti_diploma", en: "ITI / Diploma", hi: "आईटीआई / डिप्लोमा" },
  { value: "graduate", en: "Graduate", hi: "स्नातक" },
  { value: "postgraduate", en: "Postgraduate", hi: "स्नातकोत्तर" },
];

export const SOCIAL_CATEGORY_OPTIONS: Opt<SocialCategory>[] = [
  { value: "general", en: "General", hi: "सामान्य" },
  { value: "ebc", en: "EBC", hi: "अति पिछड़ा वर्ग" },
  { value: "bc", en: "BC", hi: "पिछड़ा वर्ग" },
  { value: "sc", en: "SC", hi: "अनुसूचित जाति" },
  { value: "st", en: "ST", hi: "अनुसूचित जनजाति" },
  { value: "minority", en: "Minority", hi: "अल्पसंख्यक" },
];

export const GENDER_OPTIONS: Opt<Exclude<Gender, "any">>[] = [
  { value: "female", en: "Female", hi: "महिला" },
  { value: "male", en: "Male", hi: "पुरुष" },
  { value: "transgender", en: "Transgender", hi: "ट्रांसजेंडर" },
];

export const CATEGORY_OPTIONS: Opt<SchemeCategory>[] = [
  { value: "agriculture", en: "Agriculture", hi: "कृषि" },
  { value: "education", en: "Education", hi: "शिक्षा" },
  { value: "employment", en: "Employment", hi: "रोज़गार" },
  { value: "skilling", en: "Skilling", hi: "कौशल" },
  { value: "industry", en: "Industry", hi: "उद्योग" },
  { value: "social_welfare", en: "Social welfare", hi: "सामाजिक कल्याण" },
  { value: "health", en: "Health", hi: "स्वास्थ्य" },
  { value: "women_child", en: "Women & child", hi: "महिला एवं बाल" },
  { value: "housing", en: "Housing", hi: "आवास" },
  { value: "financial_inclusion", en: "Financial inclusion", hi: "वित्तीय समावेशन" },
];

function labelMap<T extends string>(
  opts: Opt<T>[]
): (locale: Locale, value: string) => string {
  const m = new Map(opts.map((o) => [o.value as string, o]));
  return (locale, value) => {
    const o = m.get(value);
    return o ? (locale === "hi" ? o.hi : o.en) : value;
  };
}
export const categoryLabel = labelMap(CATEGORY_OPTIONS);
export const personaLabel = labelMap(PERSONA_OPTIONS);
export const educationLabel = labelMap(EDUCATION_OPTIONS);
export const socialLabel = labelMap(SOCIAL_CATEGORY_OPTIONS);
export const genderLabel = labelMap(GENDER_OPTIONS);

const EDU_LADDER = EDUCATION_OPTIONS.map((o) => o.value);
/** Expand a citizen's highest education to every level at or below it, so schemes that
 *  require "at least class 12" match a graduate. ITI/Diploma is treated as ≥ class 12. */
export function expandEducation(highest: EducationLevel): EducationLevel[] {
  const i = EDU_LADDER.indexOf(highest);
  return i < 0 ? [highest] : EDU_LADDER.slice(0, i + 1);
}

const PERSONA_SET = new Set(PERSONA_OPTIONS.map((o) => o.value));
const EDU_SET = new Set(EDU_LADDER);
const SOCIAL_SET = new Set(SOCIAL_CATEGORY_OPTIONS.map((o) => o.value));
const GENDER_SET = new Set(GENDER_OPTIONS.map((o) => o.value));
const CATEGORY_SET = new Set(CATEGORY_OPTIONS.map((o) => o.value));
const BUCKET_SET = new Set<StatusBucket>(["active", "possibly_active", "inactive"]);

function csv(raw: string | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build SchemeFilters from URL query params (shared by the search page SSR and the JSON
 * API). Unknown / malformed values are dropped so only valid facet values reach the query.
 * Param shape: q, persona=a,b  education=<highest>  social=a,b  gender=  age=  category=a,b
 *              buckets=active,possibly_active,inactive (absent → finder default)
 */
export function parseFilters(sp: URLSearchParams): SchemeFilters {
  const filters: SchemeFilters = {};

  const q = sp.get("q")?.trim();
  if (q) filters.q = q;

  const personas = csv(sp.get("persona")).filter((v) => PERSONA_SET.has(v as Persona));
  if (personas.length) filters.personas = personas as Persona[];

  // Single highest education → expanded down the ladder for "at least" matching.
  const edu = sp.get("education")?.trim();
  if (edu && EDU_SET.has(edu as EducationLevel)) {
    filters.education_levels = expandEducation(edu as EducationLevel);
  }

  const social = csv(sp.get("social")).filter((v) => SOCIAL_SET.has(v as SocialCategory));
  if (social.length) filters.social_categories = social as SocialCategory[];

  const gender = sp.get("gender")?.trim();
  if (gender && GENDER_SET.has(gender as Exclude<Gender, "any">)) {
    filters.gender = gender as Exclude<Gender, "any">;
  }

  const ageRaw = sp.get("age")?.trim();
  if (ageRaw) {
    const age = Number(ageRaw);
    if (Number.isFinite(age) && age >= 0 && age <= 120) filters.age = Math.floor(age);
  }

  const incomeRaw = sp.get("income")?.trim();
  if (incomeRaw) {
    const income = Number(incomeRaw);
    if (Number.isFinite(income) && income >= 0) filters.income = Math.floor(income);
  }

  // disability: "false" → citizen has none, hide disability-only schemes; "true" → include all
  const disabled = sp.get("disabled")?.trim();
  if (disabled === "false") filters.is_for_disabled = false;
  else if (disabled === "true") filters.is_for_disabled = true;

  const categories = csv(sp.get("category")).filter((v) =>
    CATEGORY_SET.has(v as SchemeCategory)
  );
  if (categories.length) filters.categories = categories as SchemeCategory[];

  const buckets = csv(sp.get("buckets")).filter((v) => BUCKET_SET.has(v as StatusBucket));
  if (buckets.length) filters.buckets = buckets as StatusBucket[];

  return filters;
}
