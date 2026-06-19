/**
 * Seed: Bihar policies (framework documents + a draft open for public comments).
 * Run after the policies_consultation migration.
 *
 *   npm run seed:policies -- --dry-run
 *   npm run seed:policies
 *
 * Principles (CLAUDE.md): every row has a real source_url + last_verified. Validity dates are
 * set ONLY where sourced precisely (e.g. IT Policy 2024 from official highlights); otherwise
 * left null rather than guessed. The draft's consultation window is left null with a "verify
 * at source" note — we do not invent a deadline. Aggregator-sourced rows are flagged to
 * cross-check against the official gazette/department notification.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getPool, query } from "../lib/db";

const ON = "2026-06-19";

const DEPTS = {
  it: {
    name_en: "Department of Information Technology, Government of Bihar",
    name_hi: "सूचना प्रौद्योगिकी विभाग, बिहार सरकार",
    website: "https://it.bihar.gov.in",
  },
  industries: {
    name_en: "Industries Department, Government of Bihar",
    name_hi: "उद्योग विभाग, बिहार सरकार",
    website: "https://industries.bihar.gov.in",
  },
  labour: {
    name_en: "Labour Resources Department, Government of Bihar",
    name_hi: "श्रम संसाधन विभाग, बिहार सरकार",
    website: "https://state.bihar.gov.in/labour",
  },
} as const;

type Dept = keyof typeof DEPTS;

type SeedPolicy = {
  name_en: string;
  name_hi: string;
  dept: Dept;
  summary_en: string;
  summary_hi: string;
  period_start: string | null;
  period_end: string | null;
  status: "active" | "unknown" | "lapsed" | "superseded";
  categories: string[];
  policy_type: string;
  source_url: string;
  document_url: string | null;
  is_draft: boolean;
  consultation_url: string | null;
  consultation_start: string | null;
  consultation_end: string | null;
  how_to_comment_en: string | null;
  how_to_comment_hi: string | null;
};

const POLICIES: SeedPolicy[] = [
  {
    name_en: "Bihar IT Policy 2024",
    name_hi: "बिहार आईटी नीति 2024",
    dept: "it",
    summary_en:
      "Framework to attract investment and employment in IT/ITeS and ESDM. Offers fiscal incentives including up to 30% capital subsidy (capped at ₹30 cr), 10% interest subvention, 50% lease-rental subsidy, 25% power-tariff reimbursement, and EPF/ESI reimbursement — all for up to 5 years.",
    summary_hi:
      "आईटी/आईटीईएस एवं ESDM क्षेत्र में निवेश व रोज़गार आकर्षित करने हेतु रूपरेखा। 30% तक पूंजी सब्सिडी (अधिकतम ₹30 करोड़), 10% ब्याज अनुदान, 50% लीज-किराया सब्सिडी, 25% बिजली-शुल्क प्रतिपूर्ति एवं EPF/ESI प्रतिपूर्ति — सभी 5 वर्ष तक।",
    period_start: "2024-01-09",
    period_end: "2029-12-08",
    status: "active",
    categories: ["industry"],
    policy_type: "framework",
    source_url:
      "https://patnapress.com/bihar-unveils-ambitious-it-policy-2024-to-propel-investment-and-employment-in-the-it-ites-and-esdm-sector/",
    document_url:
      "https://hebe.net.in/wp-content/uploads/2024/06/Highlights_of_Bihar_IT_policy-1.pdf",
    is_draft: false,
    consultation_url: null,
    consultation_start: null,
    consultation_end: null,
    how_to_comment_en: null,
    how_to_comment_hi: null,
  },
  {
    name_en: "Bihar Industrial Investment Promotion Package (BIPPP) 2025",
    name_hi: "बिहार औद्योगिक निवेश प्रोत्साहन पैकेज (BIPPP) 2025",
    dept: "industries",
    summary_en:
      "Industrial promotion package approved by the state cabinet (Aug 2025): land concessions, capital subsidy up to 30%, interest subvention up to ₹40 cr, and free land allotment scaled to investment size (10 acres for >₹100 cr up to 25 acres for >₹1,000 cr). Cross-check details against the official notification.",
    summary_hi:
      "राज्य कैबिनेट द्वारा स्वीकृत औद्योगिक प्रोत्साहन पैकेज (अगस्त 2025): भूमि रियायतें, 30% तक पूंजी सब्सिडी, ₹40 करोड़ तक ब्याज अनुदान, एवं निवेश-आकार के अनुसार नि:शुल्क भूमि आवंटन। विवरण आधिकारिक अधिसूचना से सत्यापित करें।",
    period_start: null,
    period_end: null,
    status: "active",
    categories: ["industry"],
    policy_type: "package",
    source_url:
      "https://www.newsonair.gov.in/bihar-state-gov-has-approved-new-bihar-industrial-investment-promotion-package",
    document_url: null,
    is_draft: false,
    consultation_url: null,
    consultation_start: null,
    consultation_end: null,
    how_to_comment_en: null,
    how_to_comment_hi: null,
  },
  {
    name_en: "Bihar Logistics Policy 2024",
    name_hi: "बिहार लॉजिस्टिक्स नीति 2024",
    dept: "industries",
    summary_en:
      "State logistics policy to develop warehousing, multimodal infrastructure and logistics parks. Listed among Bihar's 2024 industrial-promotion policies; verify scope and incentives against the official policy document.",
    summary_hi:
      "भंडारण, बहुविध अवसंरचना एवं लॉजिस्टिक्स पार्क विकसित करने हेतु राज्य लॉजिस्टिक्स नीति। विवरण आधिकारिक नीति दस्तावेज़ से सत्यापित करें।",
    period_start: null,
    period_end: null,
    status: "active",
    categories: ["industry"],
    policy_type: "framework",
    source_url: "https://hebe.net.in/industries-policies/",
    document_url: null,
    is_draft: false,
    consultation_url: null,
    consultation_start: null,
    consultation_end: null,
    how_to_comment_en: null,
    how_to_comment_hi: null,
  },
  {
    name_en: "Bihar Export Promotion Policy 2024",
    name_hi: "बिहार निर्यात प्रोत्साहन नीति 2024",
    dept: "industries",
    summary_en:
      "Policy to boost exports from Bihar through incentives and export infrastructure. Listed among the state's 2024 industrial policies; verify scope and incentives against the official document.",
    summary_hi:
      "प्रोत्साहन एवं निर्यात अवसंरचना के माध्यम से बिहार से निर्यात बढ़ाने की नीति। विवरण आधिकारिक दस्तावेज़ से सत्यापित करें।",
    period_start: null,
    period_end: null,
    status: "active",
    categories: ["industry"],
    policy_type: "framework",
    source_url: "https://hebe.net.in/industries-policies/",
    document_url: null,
    is_draft: false,
    consultation_url: null,
    consultation_start: null,
    consultation_end: null,
    how_to_comment_en: null,
    how_to_comment_hi: null,
  },
  {
    name_en: "Bihar Electric Vehicle (EV) Policy 2023",
    name_hi: "बिहार इलेक्ट्रिक वाहन (EV) नीति 2023",
    dept: "industries",
    summary_en:
      "Aims for 15% EVs in all vehicle registrations by 2028. Offers up to 75% Motor Vehicle Tax subsidy and purchase incentives up to ₹1.25 lakh for the first 1,000 personal four-wheeler EVs, plus support for charging infrastructure.",
    summary_hi:
      "2028 तक सभी वाहन पंजीकरण में 15% EV का लक्ष्य। 75% तक मोटर वाहन कर सब्सिडी एवं पहले 1,000 निजी चार-पहिया EV हेतु ₹1.25 लाख तक खरीद प्रोत्साहन, साथ ही चार्जिंग अवसंरचना हेतु सहायता।",
    period_start: null,
    period_end: null,
    status: "active",
    categories: ["industry"],
    policy_type: "framework",
    source_url:
      "https://www.deccanherald.com/india/bihar/bihar-cabinet-approves-new-electric-vehicle-policy-2797868",
    document_url: null,
    is_draft: false,
    consultation_url: null,
    consultation_start: null,
    consultation_end: null,
    how_to_comment_en: null,
    how_to_comment_hi: null,
  },
  {
    name_en: "Bihar Semiconductor Policy 2026",
    name_hi: "बिहार सेमीकंडक्टर नीति 2026",
    dept: "industries",
    summary_en:
      "Recently announced policy to build a semiconductor/electronics ecosystem in Bihar, part of the state's 2026 industrial and technology push. Verify incentives and scope against the official policy document.",
    summary_hi:
      "बिहार में सेमीकंडक्टर/इलेक्ट्रॉनिक्स पारिस्थितिकी तंत्र बनाने हेतु हाल में घोषित नीति। प्रोत्साहन एवं दायरा आधिकारिक दस्तावेज़ से सत्यापित करें।",
    period_start: null,
    period_end: null,
    status: "active",
    categories: ["industry"],
    policy_type: "framework",
    source_url:
      "https://yourstory.com/2026/03/bihar-startup-industrial-ecosystem-policy-investment-growth",
    document_url: null,
    is_draft: false,
    consultation_url: null,
    consultation_start: null,
    consultation_end: null,
    how_to_comment_en: null,
    how_to_comment_hi: null,
  },
  {
    name_en: "Bihar Draft Rules under the Labour Codes, 2025",
    name_hi: "श्रम संहिता के अंतर्गत बिहार प्रारूप नियम, 2025",
    dept: "labour",
    summary_en:
      "Draft rules to operationalise the four central Labour Codes (Wages; Industrial Relations; Social Security; Occupational Safety, Health & Working Conditions) in Bihar. Notified for public objections and suggestions (an extended period was notified). Open for public comment — confirm the current deadline and submission address in the official notification.",
    summary_hi:
      "बिहार में चार केंद्रीय श्रम संहिताओं (वेतन; औद्योगिक संबंध; सामाजिक सुरक्षा; व्यावसायिक सुरक्षा, स्वास्थ्य एवं कार्यदशा) को लागू करने हेतु प्रारूप नियम। आम जनता से आपत्ति एवं सुझाव हेतु अधिसूचित। टिप्पणी हेतु खुला — वर्तमान समय-सीमा व पता आधिकारिक अधिसूचना से सत्यापित करें।",
    period_start: null,
    period_end: null,
    status: "unknown",
    categories: ["employment"],
    policy_type: "rules",
    source_url:
      "https://www.simpliance.in/India/LEI/govt_notification/Bihar/notification-regarding-draft-rules-of-various-labour-codes-2025-have-been-formulated-and-regarding-the-extended-period-for-objections-and-suggestions-from-the-general-public-as-per-the-provisions-of-the-code-hindi-version-8763",
    document_url:
      "https://www.simpliance.in/India/LEI/govt_notification/Bihar/notification-regarding-draft-rules-of-various-labour-codes-2025-have-been-formulated-and-regarding-the-extended-period-for-objections-and-suggestions-from-the-general-public-as-per-the-provisions-of-the-code-hindi-version-8763",
    is_draft: true,
    consultation_url: "https://state.bihar.gov.in/labour",
    consultation_start: null,
    consultation_end: null, // window not confirmed — do NOT invent a date
    how_to_comment_en:
      "1. Read the draft rules (document link). 2. Write your objection/suggestion citing the specific rule number. 3. Send it to the Labour Resources Department, Government of Bihar, within the notified period. 4. Confirm the current deadline and exact submission address (email/post) in the official notification before sending.",
    how_to_comment_hi:
      "1. प्रारूप नियम पढ़ें (दस्तावेज़ लिंक)। 2. संबंधित नियम संख्या का उल्लेख करते हुए अपनी आपत्ति/सुझाव लिखें। 3. इसे अधिसूचित अवधि के भीतर श्रम संसाधन विभाग, बिहार सरकार को भेजें। 4. भेजने से पूर्व वर्तमान समय-सीमा एवं सटीक पता (ईमेल/डाक) आधिकारिक अधिसूचना से सत्यापित करें।",
  },
];

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function deptId(d: Dept): Promise<string> {
  const dep = DEPTS[d];
  const existing = await query<{ id: string }>(
    `select id from departments where name_en = $1`,
    [dep.name_en]
  );
  if (existing[0]) return existing[0].id;
  const [row] = await query<{ id: string }>(
    `insert into departments (name_en, name_hi, website) values ($1,$2,$3) returning id`,
    [dep.name_en, dep.name_hi, dep.website]
  );
  return row.id;
}

const COLS = [
  "name_en", "name_hi", "department_id", "summary_en", "summary_hi",
  "period_start", "period_end", "status", "source_url", "last_verified",
  "categories", "policy_type", "document_url", "is_draft",
  "consultation_url", "consultation_start", "consultation_end",
  "how_to_comment_en", "how_to_comment_hi",
];

async function main() {
  if (isDryRun) {
    console.log("DRY RUN — no DB write.\n");
    POLICIES.forEach((p) => console.log(`${p.name_en} [${p.status}${p.is_draft ? ", DRAFT" : ""}]`));
    return;
  }

  const ids: Record<Dept, string> = {
    it: await deptId("it"),
    industries: await deptId("industries"),
    labour: await deptId("labour"),
  };

  const placeholders = COLS.map((_, i) => `$${i + 1}`).join(", ");
  for (const p of POLICIES) {
    const existing = await query<{ id: string }>(
      `select id from policies where name_en = $1`,
      [p.name_en]
    );
    if (existing[0]) {
      console.log(`skip (exists): ${p.name_en}`);
      continue;
    }
    const values = [
      p.name_en, p.name_hi, ids[p.dept], p.summary_en, p.summary_hi,
      p.period_start, p.period_end, p.status, p.source_url, ON,
      p.categories, p.policy_type, p.document_url, p.is_draft,
      p.consultation_url, p.consultation_start, p.consultation_end,
      p.how_to_comment_en, p.how_to_comment_hi,
    ];
    const [row] = await query<{ id: string }>(
      `insert into policies (${COLS.join(", ")}) values (${placeholders}) returning id`,
      values
    );
    console.log(`inserted: ${p.name_en} → ${row.id}`);
  }
  console.log(`\nDone. ${POLICIES.length} policies processed.`);
}

main()
  .catch((err) => {
    console.error("Policies seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!isDryRun) await getPool().end();
  });
