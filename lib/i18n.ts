// English-first bilingual layer. English is the default; users toggle to Hindi.
// `pick()` chooses a content field (_en/_hi) by locale with sensible fallback;
// STRINGS holds UI-chrome translations. Pure module (no server-only APIs) so both
// server components and client components can import it.

export type Locale = "en" | "hi";
export const LOCALES: Locale[] = ["en", "hi"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";

/** Pick a bilingual content value for the active locale, falling back to the other
 *  language when the preferred one is empty (so a missing _hi never blanks the UI). */
export function pick(
  locale: Locale,
  en: string | null | undefined,
  hi: string | null | undefined
): string {
  const primary = locale === "hi" ? hi : en;
  const fallback = locale === "hi" ? en : hi;
  return primary && primary.trim() ? primary : (fallback ?? "");
}

export const STRINGS = {
  // header / nav
  appName: { en: "Bihar Scheme Tracker", hi: "बिहार योजना ट्रैकर" },
  tagline: {
    en: "Evidence-based status for Bihar policies & schemes",
    hi: "बिहार की नीतियों व योजनाओं की प्रमाण-आधारित स्थिति",
  },
  navExplore: { en: "Explore", hi: "देखें" },
  navSchemes: { en: "Schemes", hi: "योजनाएँ" },
  navMap: { en: "Map", hi: "मानचित्र" },
  navAbout: { en: "About the data", hi: "डेटा के बारे में" },
  mapTitle: { en: "Policy map", hi: "नीति मानचित्र" },
  mapSubtitle: {
    en: "How schemes sit under Bihar's policy frameworks — tap a policy or a scheme to dive in.",
    hi: "बिहार की नीतिगत रूपरेखाओं के अंतर्गत योजनाएँ कैसे आती हैं — किसी नीति या योजना पर टैप करें।",
  },
  mapEmpty: { en: "No scheme–policy links yet.", hi: "अभी कोई योजना–नीति संबंध नहीं।" },
  searchAllPlaceholder: { en: "Search schemes & policies…", hi: "योजनाएँ व नीतियाँ खोजें…" },
  findTitle: { en: "Search results", hi: "खोज परिणाम" },
  findPrompt: {
    en: "Type a name above to search across schemes and policies.",
    hi: "योजनाओं व नीतियों में खोजने हेतु ऊपर कोई नाम लिखें।",
  },
  findNothing: { en: "Nothing matches", hi: "कुछ मेल नहीं खाता" },
  forQuery: { en: "for", hi: "के लिए" },

  // home
  homeTitle: { en: "Bihar’s schemes, honestly tracked", hi: "बिहार की योजनाएँ, ईमानदारी से दर्ज" },
  homeBody: {
    en: "A source-backed catalogue of Bihar government schemes — explore the landscape, filter by sector and status, or find what you personally qualify for. Every status is derived from budget and notification evidence, never asserted.",
    hi: "बिहार सरकार की योजनाओं की स्रोत-समर्थित सूची — परिदृश्य देखें, क्षेत्र व स्थिति से छाँटें, या जानें कि आप किसके पात्र हैं। हर स्थिति बजट व अधिसूचना के प्रमाण से तय होती है, दावे से नहीं।",
  },
  homeCtaExplore: { en: "Find your schemes", hi: "अपनी योजनाएँ खोजें" },
  homeCtaPolicies: { en: "Explore policies", hi: "नीतियाँ देखें" },
  statSchemes: { en: "Schemes tracked", hi: "दर्ज योजनाएँ" },
  statPolicies: { en: "Policies", hi: "नीतियाँ" },
  statOpenComments: { en: "Open for comments", hi: "टिप्पणी हेतु खुला" },
  openConsultationsTitle: { en: "Open for public comments", hi: "सार्वजनिक टिप्पणी हेतु खुला" },
  openConsultationsNote: {
    en: "Draft policies you can weigh in on right now.",
    hi: "प्रारूप नीतियाँ जिन पर आप अभी अपनी राय दे सकते हैं।",
  },
  homeForCitizens: { en: "For citizens", hi: "नागरिकों के लिए" },
  homeForCitizensBody: {
    en: "Filter by who you are — occupation, age, education, gender, category — to see schemes you likely qualify for.",
    hi: "अपनी पहचान से छाँटें — व्यवसाय, आयु, शिक्षा, लिंग, श्रेणी — और देखें कि आप किन योजनाओं के पात्र हैं।",
  },
  homeForResearch: { en: "For researchers & policymakers", hi: "शोधकर्ताओं व नीति-निर्माताओं के लिए" },
  homeForResearchBody: {
    en: "Browse the full landscape by sector, department, and status. Each scheme carries its evidence, sources, and budget trail.",
    hi: "क्षेत्र, विभाग व स्थिति के अनुसार पूरा परिदृश्य देखें। हर योजना के साथ उसके प्रमाण, स्रोत व बजट का विवरण।",
  },
  homeHonest: { en: "Honest about staleness", hi: "पुरानी जानकारी पर ईमानदार" },
  homeHonestBody: {
    en: "Schemes are Active, Possibly active, or Inactive — with a last-verified date and the evidence behind each call.",
    hi: "योजनाएँ सक्रिय, संभवतः सक्रिय या निष्क्रिय — अंतिम-सत्यापन तिथि व हर निर्णय के पीछे का प्रमाण सहित।",
  },

  // coverage & confidence banner (honest about what this is)
  coverageTitle: { en: "About this data — read first", hi: "इस डेटा के बारे में — पहले पढ़ें" },
  coverageBody: {
    en: "This is a curated, source-checked catalogue — not every scheme in Bihar. Status is derived from evidence (budget lines, official portals, government notifications), each with a verified date and a source link — never asserted. Schemes we haven't verified yet are shown as “Possibly active”, never hidden: an unverified scheme may well be running. Always confirm at the official portal before acting.",
    hi: "यह एक चयनित, स्रोत-जाँचित सूची है — बिहार की हर योजना नहीं। स्थिति प्रमाण से ली जाती है (बजट पंक्तियाँ, आधिकारिक पोर्टल, सरकारी अधिसूचनाएँ), हर एक के साथ सत्यापन तिथि व स्रोत लिंक — कभी अनुमानित नहीं। जिन योजनाओं को हमने अभी सत्यापित नहीं किया, वे “संभवतः सक्रिय” दिखती हैं, छिपाई नहीं जातीं। कार्य करने से पहले आधिकारिक पोर्टल पर पुष्टि करें।",
  },
  coverageStat: {
    en: "verified Active against official sources",
    hi: "आधिकारिक स्रोतों से सत्यापित सक्रिय",
  },
  reportIssue: {
    en: "Spotted something wrong or outdated? Report it",
    hi: "कुछ गलत या पुराना दिखा? रिपोर्ट करें",
  },

  // guided finder ("tell us about you → your schemes")
  guidedTitle: { en: "Find schemes for you", hi: "आपके लिए योजनाएँ खोजें" },
  findIntro: {
    en: "Tell us a little about yourself and we'll show the schemes you likely qualify for. Everything is optional — answer what you can.",
    hi: "अपने बारे में थोड़ा बताएँ और हम आपको वे योजनाएँ दिखाएँगे जिनके लिए आप पात्र हो सकते हैं। सब कुछ वैकल्पिक है — जितना बता सकें बताएँ।",
  },
  orBrowse: { en: "Prefer to browse everything?", hi: "सब कुछ देखना चाहते हैं?" },
  browseAll: { en: "Browse all schemes", hi: "सभी योजनाएँ देखें" },
  qWho: { en: "Who are you?", hi: "आप कौन हैं?" },
  qAge: { en: "Your age", hi: "आपकी आयु" },
  qGender: { en: "Gender", hi: "लिंग" },
  qSocial: { en: "Social category", hi: "सामाजिक श्रेणी" },
  qEducation: { en: "Highest education", hi: "उच्चतम शिक्षा" },
  qIncome: { en: "Annual family income", hi: "वार्षिक पारिवारिक आय" },
  qDisability: { en: "Do you have a disability?", hi: "क्या आप दिव्यांग हैं?" },
  selectAllApply: { en: "select all that apply", hi: "जो लागू हों चुनें" },
  optionalHint: { en: "optional", hi: "वैकल्पिक" },
  agePlaceholder: { en: "e.g. 25", hi: "जैसे 25" },
  yes: { en: "Yes", hi: "हाँ" },
  no: { en: "No", hi: "नहीं" },
  showMySchemes: { en: "Show my schemes", hi: "मेरी योजनाएँ दिखाएँ" },
  clearAnswers: { en: "Clear answers", hi: "उत्तर साफ़ करें" },
  schemesForYou: {
    en: "schemes you may qualify for",
    hi: "योजनाएँ जिनके लिए आप पात्र हो सकते हैं",
  },
  guidedNote: {
    en: "These are schemes you likely qualify for based on what you told us — including some marked “Possibly active”. Always confirm details and apply at the official source.",
    hi: "ये वे योजनाएँ हैं जिनके लिए आपके बताए अनुसार आप संभवतः पात्र हैं — कुछ “संभवतः सक्रिय” सहित। विवरण की पुष्टि करें और आधिकारिक स्रोत पर ही आवेदन करें।",
  },
  noMatches: {
    en: "No schemes matched. Try removing an answer (e.g. age or income) to widen the search.",
    hi: "कोई योजना मेल नहीं खाई। खोज को व्यापक करने हेतु कोई उत्तर हटाएँ (जैसे आयु या आय)।",
  },
  viewDetails: { en: "View details", hi: "विवरण देखें" },
  homeCtaFind: { en: "Find schemes for me", hi: "मेरे लिए योजनाएँ खोजें" },
  mayBeOutdated: {
    en: "This may be outdated — last verified over a year ago, and is due for re-checking.",
    hi: "यह जानकारी पुरानी हो सकती है — एक वर्ष से अधिक पहले सत्यापित; पुनः जाँच आवश्यक।",
  },
  loadError: {
    en: "Couldn't load this right now. Please try again in a moment.",
    hi: "अभी यह लोड नहीं हो सका। कृपया कुछ देर बाद पुनः प्रयास करें।",
  },

  // explore / catalogue
  exploreTitle: { en: "Explore schemes", hi: "योजनाएँ देखें" },
  exploreSubtitle: {
    en: "Filter the catalogue, or describe yourself to find what you qualify for.",
    hi: "सूची को छाँटें, या स्वयं का विवरण देकर अपनी पात्रता जानें।",
  },
  searchPlaceholder: { en: "Search schemes by name…", hi: "नाम से योजना खोजें…" },
  searching: { en: "searching…", hi: "खोज रहे हैं…" },
  filters: { en: "Filters", hi: "फ़िल्टर" },
  clearAll: { en: "Clear all", hi: "सब हटाएँ" },
  status: { en: "Status", hi: "स्थिति" },
  sector: { en: "Sector", hi: "क्षेत्र" },
  eligibilityGroup: { en: "Who it’s for", hi: "किसके लिए" },
  iAmA: { en: "I am a…", hi: "मैं हूँ…" },
  age: { en: "Age", hi: "आयु" },
  education: { en: "Highest education", hi: "उच्चतम शिक्षा" },
  gender: { en: "Gender", hi: "लिंग" },
  socialCategory: { en: "Social category", hi: "सामाजिक श्रेणी" },
  any: { en: "Any", hi: "कोई भी" },
  sortBy: { en: "Sort", hi: "क्रम" },
  sortRelevance: { en: "Best match", hi: "सर्वोत्तम मिलान" },
  sortName: { en: "Name (A–Z)", hi: "नाम (अ–ज्ञ)" },
  sortStatus: { en: "Status (active first)", hi: "स्थिति (सक्रिय पहले)" },
  sortVerified: { en: "Recently verified", hi: "हाल में सत्यापित" },
  resultsOne: { en: "scheme", hi: "योजना" },
  resultsMany: { en: "schemes", hi: "योजनाएँ" },
  matchingProfile: { en: "matching your profile", hi: "आपकी प्रोफ़ाइल के अनुसार" },
  noResults: {
    en: "No schemes match these filters. Try removing one, or include inactive schemes.",
    hi: "इन फ़िल्टरों से कोई योजना मेल नहीं खाती। एक हटाएँ, या निष्क्रिय योजनाएँ शामिल करें।",
  },
  noSchemes: { en: "No schemes yet — run the seed script.", hi: "अभी कोई योजना नहीं — सीड स्क्रिप्ट चलाएँ।" },
  detailsUnverified: { en: "Details not yet verified", hi: "विवरण अभी असत्यापित" },
  department: { en: "Department", hi: "विभाग" },
  verified: { en: "Verified", hi: "सत्यापित" },
  viewCards: { en: "Cards", hi: "कार्ड" },
  viewTable: { en: "Table", hi: "तालिका" },
  colScheme: { en: "Scheme", hi: "योजना" },
  colBudget: { en: "Last budget", hi: "अंतिम बजट" },
  needsReverification: { en: "stale", hi: "पुराना" },

  // detail page
  backToExplore: { en: "← Back to explore", hi: "← सूची पर वापस" },
  statusEvidence: { en: "Status evidence", hi: "स्थिति का आधार" },
  noEvidence: { en: "No evidence recorded.", hi: "कोई प्रमाण दर्ज नहीं।" },
  lastBudgetYear: { en: "Last budget year", hi: "अंतिम बजट वर्ष" },
  lastNotification: { en: "Last notification", hi: "अंतिम अधिसूचना" },
  lastVerified: { en: "Last verified", hi: "अंतिम सत्यापन" },
  details: { en: "Details", hi: "विवरण" },
  objective: { en: "Objective", hi: "उद्देश्य" },
  eligibility: { en: "Eligibility", hi: "पात्रता" },
  benefitType: { en: "Benefit type", hi: "लाभ का प्रकार" },
  benefitDetail: { en: "Benefit detail", hi: "लाभ विवरण" },
  targetBeneficiary: { en: "Target beneficiary", hi: "लक्षित लाभार्थी" },
  launchDate: { en: "Launch date", hi: "आरंभ तिथि" },
  whoCanApply: { en: "Who can apply", hi: "पात्रता एक नज़र में" },
  forLabel: { en: "For", hi: "किसके लिए" },
  incomeLabel: { en: "Income", hi: "आय" },
  domicileLabel: { en: "Domicile", hi: "निवास" },
  anyoneNoOccupation: { en: "Anyone (no occupation restriction)", hi: "कोई भी (व्यवसाय की बाध्यता नहीं)" },
  personsWithDisabilities: { en: "Persons with disabilities", hi: "दिव्यांगजन" },
  orAbove: { en: "or above", hi: "या अधिक" },
  allCategories: { en: "All categories", hi: "सभी श्रेणियाँ" },
  bplRequired: { en: "BPL card required", hi: "बीपीएल कार्ड आवश्यक" },
  noIncomeBar: { en: "No income bar", hi: "कोई आय-सीमा नहीं" },
  biharResident: { en: "Bihar resident", hi: "बिहार निवासी" },
  anyAge: { en: "Any age", hi: "कोई भी आयु" },
  yearsSuffix: { en: "years", hi: "वर्ष" },
  budgetTitle: { en: "Budget allocations", hi: "बजट आवंटन" },
  budgetNote: {
    en: "Year-over-year allocation is the primary signal for whether a scheme is alive. ₹ in crore.",
    hi: "वर्ष-दर-वर्ष आवंटन यह बताने का मुख्य संकेत है कि योजना सक्रिय है या नहीं। ₹ करोड़ में।",
  },
  budgetEmpty: {
    en: "No budget allocations recorded yet — status leans on portal/notification evidence. Next: populate from budget.bihar.gov.in.",
    hi: "अभी कोई बजट आवंटन दर्ज नहीं — स्थिति पोर्टल/अधिसूचना के प्रमाण पर आधारित है। अगला: budget.bihar.gov.in से भरें।",
  },
  fiscalYear: { en: "Fiscal year", hi: "वित्तीय वर्ष" },
  allocatedBE: { en: "Allocated (BE)", hi: "आवंटित (BE)" },
  revisedRE: { en: "Revised (RE)", hi: "संशोधित (RE)" },
  source: { en: "Source", hi: "स्रोत" },
  sourcesTitle: { en: "Sources", hi: "स्रोत" },
  primarySource: { en: "Primary source", hi: "मुख्य स्रोत" },
  applicationPortal: { en: "Application portal", hi: "आवेदन पोर्टल" },
  notYetVerified: { en: "Not yet verified", hi: "अभी असत्यापित" },
  verifyAtSource: { en: "verify at source ↗", hi: "स्रोत पर सत्यापित करें ↗" },
  includeInactive: { en: "Include inactive (ended / replaced)", hi: "निष्क्रिय शामिल करें (समाप्त / प्रतिस्थापित)" },

  // research mode — Data & impact
  dataImpact: { en: "Data & impact", hi: "डेटा व प्रभाव" },
  dataImpactNote: {
    en: "Public figures where available; where Bihar publishes nothing, the data request itself is shown. Every number is sourced — none are estimated.",
    hi: "जहाँ उपलब्ध हो वहाँ सार्वजनिक आँकड़े; जहाँ बिहार कुछ प्रकाशित नहीं करता, वहाँ डेटा-अनुरोध स्वयं दिखाया गया है। हर आँकड़ा स्रोत-समर्थित है — कोई अनुमानित नहीं।",
  },
  byYear: { en: "By year", hi: "वर्ष के अनुसार" },
  funds: { en: "Funds (₹ cr)", hi: "राशि (₹ करोड़)" },
  people: { en: "People", hi: "लोग" },
  provenanceTitle: { en: "Data provenance", hi: "डेटा का स्रोत" },
  dim_budget: { en: "Budget & disbursement", hi: "बजट व वितरण" },
  dim_beneficiaries: { en: "Beneficiaries", hi: "लाभार्थी" },
  dim_district: { en: "District-wise distribution", hi: "ज़िलेवार वितरण" },
  dim_demographics: { en: "Demographic breakdown", hi: "जनसांख्यिकीय विभाजन" },
  dim_outcomes: { en: "Outcomes", hi: "परिणाम" },
  prov_published: { en: "Published", hi: "प्रकाशित" },
  prov_reported: { en: "Reported · verify", hi: "रिपोर्टेड · सत्यापन हेतु" },
  prov_rti_received: { en: "RTI received", hi: "RTI प्राप्त" },
  prov_rti_filed: { en: "RTI filed · awaiting", hi: "RTI दायर · प्रतीक्षारत" },
  prov_rti_needed: { en: "RTI needed", hi: "RTI आवश्यक" },
  prov_public_todo: { en: "Public · to add", hi: "सार्वजनिक · जोड़ना है" },
  prov_estimated: { en: "Estimated", hi: "अनुमानित" },
  lbl_sanctioned: { en: "sanctioned", hi: "स्वीकृत" },
  lbl_disbursed: { en: "disbursed", hi: "वितरित" },
  lbl_target: { en: "target", hi: "लक्ष्य" },
  lbl_students: { en: "students", hi: "विद्यार्थी" },
  lbl_allocated_be: { en: "allocated (BE)", hi: "आवंटित (BE)" },

  applyCta: { en: "Apply on the official portal", hi: "आधिकारिक पोर्टल पर आवेदन करें" },
  howToApply: { en: "How to apply", hi: "आवेदन कैसे करें" },
  timeline: { en: "Timeline", hi: "समयरेखा" },
  partOf: { en: "Part of", hi: "के अंतर्गत" },
  schemesUnder: { en: "Schemes under this", hi: "इसके अंतर्गत योजनाएँ" },
  similarSchemes: { en: "Similar schemes", hi: "मिलती-जुलती योजनाएँ" },
  inactiveSuccessor: {
    en: "This scheme is no longer separately active — it continues via:",
    hi: "यह योजना अब अलग से सक्रिय नहीं — यह इसके माध्यम से जारी है:",
  },
  relatedPolicies: { en: "Related policies", hi: "संबंधित नीतियाँ" },
  launched: { en: "Launched", hi: "आरंभ" },
  ongoing: { en: "ongoing", hi: "जारी" },
  nowLabel: { en: "now", hi: "अभी" },
  supersededLabel: { en: "superseded", hi: "अधिक्रमित" },

  // policies
  navPolicies: { en: "Policies", hi: "नीतियाँ" },
  policiesTitle: { en: "Explore policies", hi: "नीतियाँ देखें" },
  policiesSubtitle: {
    en: "Bihar's policy frameworks and draft rules — in force, lapsed, or open for your comments.",
    hi: "बिहार की नीतिगत रूपरेखाएँ व प्रारूप नियम — लागू, समाप्त, या आपकी टिप्पणी हेतु खुले।",
  },
  searchPoliciesPlaceholder: { en: "Search policies by name…", hi: "नाम से नीति खोजें…" },
  policyView: { en: "Show", hi: "दिखाएँ" },
  viewAll: { en: "All", hi: "सभी" },
  viewOpen: { en: "Open for comments", hi: "टिप्पणी हेतु खुला" },
  viewInForce: { en: "In force", hi: "लागू" },
  viewPast: { en: "Lapsed / replaced", hi: "समाप्त / प्रतिस्थापित" },
  allSectors: { en: "All sectors", hi: "सभी क्षेत्र" },
  policyOne: { en: "policy", hi: "नीति" },
  policyMany: { en: "policies", hi: "नीतियाँ" },
  noPolicies: { en: "No policies match these filters.", hi: "इन फ़िल्टरों से कोई नीति मेल नहीं खाती।" },
  backToPolicies: { en: "← Back to policies", hi: "← नीतियों पर वापस" },
  validity: { en: "Validity", hi: "वैधता अवधि" },
  policyTypeLabel: { en: "Type", hi: "प्रकार" },
  summary: { en: "Summary", hi: "सारांश" },
  readDocument: { en: "Read the policy document", hi: "नीति दस्तावेज़ पढ़ें" },
  readDraft: { en: "Read the draft document", hi: "प्रारूप दस्तावेज़ पढ़ें" },
  consultation: { en: "Public consultation", hi: "सार्वजनिक परामर्श" },
  consultationOpenNote: {
    en: "This draft is open for public objections and suggestions. Confirm the current deadline at the source before you submit.",
    hi: "यह प्रारूप आम जनता की आपत्ति व सुझाव हेतु खुला है। भेजने से पूर्व वर्तमान समय-सीमा स्रोत से सत्यापित करें।",
  },
  consultationClosedNote: {
    en: "The public comment window for this draft has closed.",
    hi: "इस प्रारूप हेतु सार्वजनिक टिप्पणी की अवधि समाप्त हो चुकी है।",
  },
  howToCommentTitle: { en: "How to comment", hi: "टिप्पणी कैसे करें" },
  commentDeadline: { en: "Deadline", hi: "अंतिम तिथि" },
  deadlineVerify: { en: "Verify at source", hi: "स्रोत से सत्यापित करें" },
  goToConsultation: { en: "Go to the consultation portal", hi: "परामर्श पोर्टल पर जाएँ" },
  pt_framework: { en: "Framework", hi: "रूपरेखा" },
  pt_rules: { en: "Draft rules", hi: "प्रारूप नियम" },
  pt_package: { en: "Package", hi: "पैकेज" },
  pt_regulation: { en: "Regulation", hi: "विनियमन" },
  pt_mission: { en: "Mission", hi: "मिशन" },
  policyImpactNote: {
    en: "Policy-level impact (investment attracted, jobs, units approved, budget outlay) isn't published as structured data. We'll add it from official reviews and RTI — shown honestly until then.",
    hi: "नीति-स्तर का प्रभाव (आकर्षित निवेश, रोज़गार, स्वीकृत इकाइयाँ, बजट परिव्यय) संरचित डेटा के रूप में प्रकाशित नहीं है। इसे आधिकारिक समीक्षाओं व RTI से जोड़ा जाएगा — तब तक ईमानदारी से दर्शाया गया।",
  },
  pdim_investment: { en: "Investment attracted", hi: "आकर्षित निवेश" },
  pdim_jobs: { en: "Jobs / employment", hi: "रोज़गार" },
  pdim_units: { en: "Units / approvals", hi: "इकाइयाँ / स्वीकृतियाँ" },
  pdim_outlay: { en: "Budget outlay", hi: "बजट परिव्यय" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(locale: Locale, key: StringKey): string {
  return STRINGS[key][locale];
}

/** Look up a string by a dynamically-built key (e.g. `prov_${x}`), falling back to the
 *  raw value when no translation exists. */
export function tryT(locale: Locale, key: string, fallback: string): string {
  const entry = (STRINGS as Record<string, { en: string; hi: string }>)[key];
  return entry ? entry[locale] : fallback;
}
