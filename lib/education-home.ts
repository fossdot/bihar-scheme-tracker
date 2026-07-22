// Sourced constants for the education-first homepage narrative.
//
// These are figures the standalone `education.*` schema does not (yet) model — learning outcomes,
// dropout/transition, staffing & infrastructure capacity, and the flagship money-flow decomposition.
// They live here as typed constants, each carrying its source, so the honesty rule still holds:
// every number on the page is attributable. Programme & audit figures on the homepage come from the
// live DB (getEducationOverview); everything in this file is the narrative scaffolding around them.
//
// When these graduate into the schema (dropout/outcome dimensions, an SNA-parked fact), delete the
// corresponding block here and read from the DB instead.

export interface Bilingual {
  en: string;
  hi: string;
}

/** One step in the flagship money-flow (Samagra Shiksha, FY 2023-24). All bars share ONE scale
 *  (₹31,145 cr released) so the eye watches the money shrink down the funnel:
 *  green = confirmed & still moving, amber = stopped/parked here, dashed = unverifiable. */
export interface FlowStep {
  key: string;
  label: Bilingual;
  amountLabel: string; // pre-formatted ₹ figure, shown prominently
  greenPct: number; // 0-100 of the shared scale that is confirmed / still moving
  loss?: { pct: number; label: Bilingual; tone: "parked" | "unverified" };
  caption?: Bilingual; // extra context under the bar (used where there is no loss segment)
  chip: { text: Bilingual; tone: "good" | "mid" };
}

// Samagra Shiksha FY 2023-24. Released 31,145.19; ₹14,738.13 cr lay unspent in SNA accounts on
// 31 Mar 2024, so ₹16,407.06 cr (52.7%) was drawn down; ₹0 verified with vouchers to the AG.
// Source: CAG State Finances Audit Report 2023-24 (Report No.1 of 2025), Para 4.19 (PFMS 26.08.2024).
export const FLOW: {
  title: Bilingual;
  subtitle: Bilingual;
  source: string;
  sourceShort: string;
  sourceUrl: string;
  legend: { green: Bilingual; parked: Bilingual; unverified: Bilingual };
  steps: FlowStep[];
  blackHole: Bilingual;
} = {
  title: { en: "Where Bihar’s scheme money stops", hi: "बिहार का योजना-धन कहाँ रुक जाता है" },
  subtitle: {
    en: "The Centre routes Bihar’s scheme money — including every rupee for its schools — through 142 Single Nodal Agencies. This is FY 2023–24 on one scale, so you can watch where it stops.",
    hi: "केंद्र बिहार का योजना-धन — उसके स्कूलों का हर रुपया समेत — 142 एकल नोडल एजेंसियों के ज़रिए भेजता है। यह वित्त वर्ष 2023–24 एक ही पैमाने पर, ताकि दिखे पैसा कहाँ रुकता है।",
  },
  source: "CAG SFAR 2023–24, Para 4.19 (PFMS 26.08.2024)",
  sourceShort: "CAG SFAR 2023–24",
  sourceUrl: "https://cag.gov.in/uploads/download_audit_report/2025/State-Finance-Report-2023-24-(08-04-2025)-ENGLISH-FINAL-with-Signeture-FINAL-FOR-PRINT-06881e24daadd66.83179080.pdf",
  legend: {
    green: { en: "confirmed", hi: "पुष्ट" },
    parked: { en: "parked / unspent", hi: "अव्ययित" },
    unverified: { en: "unverifiable", hi: "असत्यापित" },
  },
  steps: [
    {
      key: "released",
      label: { en: "Released to nodal agencies", hi: "नोडल एजेंसियों को जारी" },
      amountLabel: "₹31,145 cr",
      greenPct: 100,
      caption: {
        en: "Centre ₹18,174 cr + State ₹12,971 cr → Bihar’s 142 SNAs, FY24.",
        hi: "केंद्र ₹18,174 करोड़ + राज्य ₹12,971 करोड़ → बिहार की 142 SNA, वित्त वर्ष 24।",
      },
      chip: { text: { en: "Published · PFMS", hi: "प्रकाशित · PFMS" }, tone: "good" },
    },
    {
      key: "drawn",
      label: { en: "Actually withdrawn", hi: "वास्तव में निकाला गया" },
      amountLabel: "₹16,407 cr",
      greenPct: 52.7,
      loss: {
        pct: 47.3,
        tone: "parked",
        label: {
          en: "₹14,738 cr parked — unspent in SNA accounts on 31 Mar 2024",
          hi: "₹14,738 करोड़ अव्ययित — 31 मार्च 2024 को SNA खातों में पड़ा",
        },
      },
      chip: { text: { en: "Published", hi: "प्रकाशित" }, tone: "good" },
    },
    {
      key: "verified",
      label: { en: "Verified reaching students", hi: "छात्रों तक पहुँचा — सत्यापित" },
      amountLabel: "₹0",
      greenPct: 0,
      loss: {
        pct: 100,
        tone: "unverified",
        label: {
          en: "No vouchers for any of it — none can be verified as reaching a student",
          hi: "किसी का कोई वाउचर नहीं — कुछ भी छात्र तक पहुँचा सत्यापित नहीं",
        },
      },
      chip: { text: { en: "RTI needed", hi: "RTI आवश्यक" }, tone: "mid" },
    },
  ],
  blackHole: {
    en: "The Single Nodal Agency black hole: scheme money is booked as “expenditure” the instant it is transferred to a nodal agency and onward to 1,75,494 child agencies. The Accountant General received no vouchers for any of it — so the state can prove it moved the money, not that it bought anything for a child.",
    hi: "एकल नोडल एजेंसी का ब्लैक होल: योजना का पैसा किसी नोडल एजेंसी और आगे 1,75,494 उप-एजेंसियों को अंतरित होते ही “व्यय” के रूप में दर्ज हो जाता है। महालेखाकार को इसका कोई वाउचर नहीं मिला — यानी राज्य यह सिद्ध कर सकता है कि उसने पैसा हिलाया, यह नहीं कि किसी बच्चे के लिए कुछ खरीदा।",
  },
};

/** The four defining figures — a curated mix of money, outcome, and accountability. */
export interface ShockStat {
  value: string;
  label: Bilingual;
  sub: Bilingual;
  src: string;
  tone?: "warn";
}

export const FOUR_NUMBERS: ShockStat[] = [
  {
    value: "₹14,738 cr",
    label: { en: "released but sitting unspent in SNA bank accounts", hi: "जारी, पर SNA बैंक खातों में अव्ययित" },
    sub: { en: "31 Mar 2024", hi: "31 मार्च 2024" },
    src: "CAG No.1/2025",
    tone: "warn",
  },
  {
    value: "58%",
    label: { en: "of Samagra Shiksha funds unspent", hi: "समग्र शिक्षा निधि अव्ययित" },
    sub: { en: "2021–24", hi: "2021–24" },
    src: "CAG SFAR, Tbl 3.28",
    tone: "warn",
  },
  {
    value: "31.5%",
    label: { en: "of children reach secondary school (83% nationally)", hi: "बच्चे माध्यमिक तक पहुँचते हैं (देश में 83%)" },
    sub: { en: "UDISE+ 2023–24", hi: "UDISE+ 2023–24" },
    src: "UDISE+",
    tone: "warn",
  },
  {
    value: "₹0",
    label: { en: "vouchers of actual spending the CAG could examine", hi: "वास्तविक व्यय के वाउचर जो CAG जाँच सका" },
    sub: { en: "FY23 & FY24", hi: "वित्त वर्ष 23 व 24" },
    src: "CAG Para 4.19",
    tone: "warn",
  },
];

/** "The children don't stay" — Bihar vs national, where the money should show up. */
export interface OutcomeCmp {
  name: Bilingual;
  delta: Bilingual;
  bihar: number;
  india: number;
}

export const OUTCOMES: { rows: OutcomeCmp[]; source: Bilingual; sourceUrl: string } = {
  rows: [
    {
      name: { en: "Reach secondary school (transition rate)", hi: "माध्यमिक तक पहुँच (संक्रमण दर)" },
      delta: { en: "−52 pts", hi: "−52 अंक" },
      bihar: 31.5,
      india: 83.3,
    },
    {
      name: { en: "Drop out at secondary", hi: "माध्यमिक स्तर पर ड्रॉपआउट" },
      delta: { en: "1.8× national", hi: "देश का 1.8×" },
      bihar: 25.6,
      india: 14.1,
    },
    {
      name: { en: "Drop out at upper primary", hi: "उच्च प्राथमिक पर ड्रॉपआउट" },
      delta: { en: "5× national", hi: "देश का 5×" },
      bihar: 25.9,
      india: 5.2,
    },
  ],
  source: {
    en: "UDISE+ 2023–24 · Bihar led India with 27.7 lakh elementary dropouts, 2022–24",
    hi: "UDISE+ 2023–24 · बिहार में देश में सर्वाधिक 27.7 लाख प्रारंभिक ड्रॉपआउट, 2022–24",
  },
  sourceUrl: "https://dashboard.udiseplus.gov.in",
};

/** "The system is hollow" — staffing & infrastructure capacity. */
export const CAPACITY: ShockStat[] = [
  {
    value: "57%",
    label: { en: "university teaching posts vacant", hi: "विश्वविद्यालय शिक्षण पद रिक्त" },
    sub: { en: "", hi: "" },
    src: "CAG No.5/2024",
    tone: "warn",
  },
  {
    value: "52%",
    label: { en: "DIET academic posts vacant (teacher trainers)", hi: "DIET शैक्षणिक पद रिक्त (शिक्षक-प्रशिक्षक)" },
    sub: { en: "", hi: "" },
    src: "PAB 2021–22",
    tone: "warn",
  },
  {
    value: "12.7%",
    label: { en: "of eligible govt schools have a functional ICT lab", hi: "पात्र सरकारी स्कूलों में चालू ICT लैब" },
    sub: { en: "", hi: "" },
    src: "UDISE+ 2024–25, Tbl 9.9",
    tone: "warn",
  },
  {
    value: "1,865",
    label: { en: "single-teacher schools (1.75 lakh students)", hi: "एकल-शिक्षक विद्यालय (1.75 लाख छात्र)" },
    sub: { en: "", hi: "" },
    src: "UDISE+ 2024–25",
  },
];

/** The honest counterpoint that keeps the page credible. */
export const COUNTERPOINT: { title: Bilingual; body: Bilingual; figs: { label: Bilingual; src: string }[] } = {
  title: { en: "It isn’t that Bihar can’t teach", hi: "बात यह नहीं कि बिहार पढ़ा नहीं सकता" },
  body: {
    en: "Where children stay and are taught, learning is not the disaster the money is. In PARAKH Rashtriya Sarvekshan 2024 and the PGI 2.0 learning-outcomes domain, Bihar held its own against far better-resourced states — ahead of Tamil Nadu, Karnataka, Andhra Pradesh and Telangana. Its failure is delivery: money released but never verifiably spent, and children who never reach the classroom.",
    hi: "जहाँ बच्चे टिकते और पढ़ते हैं, वहाँ सीख उतनी ख़राब नहीं जितनी पैसे की हालत। PARAKH राष्ट्रीय सर्वेक्षण 2024 और PGI 2.0 के अधिगम-परिणाम क्षेत्र में बिहार कहीं बेहतर-संसाधन वाले राज्यों के सामने टिका — तमिलनाडु, कर्नाटक, आंध्र और तेलंगाना से आगे। इसकी विफलता वितरण की है: पैसा जो जारी होता है पर सत्यापित रूप से ख़र्च नहीं होता, और बच्चे जो कक्षा तक पहुँचते ही नहीं।",
  },
  figs: [
    { label: { en: "Learning-outcomes domain: ahead of 4 richer states", hi: "अधिगम-परिणाम क्षेत्र: 4 समृद्ध राज्यों से आगे" }, src: "PGI 2.0, 2023–24" },
    { label: { en: "Infrastructure domain: 64.8 / 190 — lowest grade", hi: "अवसंरचना क्षेत्र: 64.8 / 190 — न्यूनतम श्रेणी" }, src: "PGI 2.0" },
    { label: { en: "PGI band: Akanshi-2 (461–520 / 1000)", hi: "PGI श्रेणी: आकांक्षी-2 (461–520 / 1000)" }, src: "MoE" },
  ],
};

/** Footer "how we know" source list. */
export const HOME_SOURCES: string[] = [
  "CAG State Finances Audit Report 2023–24 (Report No.1 of 2025), Para 4.19 & Table 3.28",
  "CAG Report No.5 of 2024 — state universities performance audit",
  "CAG Report No.20 of 2025 — PMKVY performance audit",
  "UDISE+ 2024–25 national booklet; UDISE+ 2023–24 dropout & transition",
  "PARAKH Rashtriya Sarvekshan 2024 (NCERT); PGI 2.0 2023–24 (Ministry of Education)",
  "MoPR Annual Report 2025–26, Annexure IV (RGSA releases); PM-USHA PAB-3 minutes",
  "Bihar per-capita income ₹66,828 (lowest in India): CAG SFAR 2023–24",
];

/** Pinned scroll-scrub money-flow (the homepage centerpiece). Each scroll step drives one stage
 *  state: a = all green, b = amber "parked" appears, c/d = the green turns to a hollow dashed bar. */
export const FLOW_SCROLLY: {
  kicker: Bilingual;
  legend: { green: Bilingual; parked: Bilingual; unverified: Bilingual };
  source: string;
  sourceUrl: string;
  steps: { n: string; state: "a" | "b" | "c" | "d"; num: string; warn: boolean; cap: Bilingual; heading: Bilingual; body: Bilingual }[];
  evidence: { label: Bilingual; value: string }[];
} = {
  kicker: { en: "FY 2023–24 · all 142 nodal agencies", hi: "वित्त वर्ष 2023–24 · सभी 142 नोडल एजेंसियाँ" },
  legend: {
    green: { en: "confirmed", hi: "पुष्ट" },
    parked: { en: "parked / unspent", hi: "अव्ययित" },
    unverified: { en: "unverifiable", hi: "असत्यापित" },
  },
  source: "CAG SFAR 2023–24, Para 4.19",
  sourceUrl:
    "https://cag.gov.in/uploads/download_audit_report/2025/State-Finance-Report-2023-24-(08-04-2025)-ENGLISH-FINAL-with-Signeture-FINAL-FOR-PRINT-06881e24daadd66.83179080.pdf",
  steps: [
    {
      n: "01", state: "a", num: "₹31,145 cr", warn: false,
      cap: { en: "sent to Bihar for its schemes and welfare", hi: "बिहार को उसकी योजनाओं व कल्याण के लिए भेजा" },
      heading: { en: "Every year, the Centre sends Bihar its scheme money.", hi: "हर साल केंद्र बिहार को उसका योजना-धन भेजता है।" },
      body: {
        en: "In 2023–24, ₹31,145 crore flowed through Bihar’s 142 Single Nodal Agencies — the same pipe that carries every rupee for its schools.",
        hi: "2023–24 में ₹31,145 करोड़ बिहार की 142 एकल नोडल एजेंसियों से होकर गुज़रा — वही पाइप जो उसके स्कूलों का हर रुपया ले जाता है।",
      },
    },
    {
      n: "02", state: "b", num: "₹14,738 cr", warn: true,
      cap: { en: "never left the account — parked, unspent", hi: "खाते से निकला ही नहीं — अव्ययित पड़ा" },
      heading: { en: "₹14,738 crore never even left the account.", hi: "₹14,738 करोड़ तो खाते से निकला ही नहीं।" },
      body: {
        en: "Nearly half of it simply sat in bank accounts on 31 March 2024 — unspent — while schools went without.",
        hi: "इसका लगभग आधा 31 मार्च 2024 को बैंक खातों में यूँ ही पड़ा रहा — अव्ययित — जबकि स्कूल वंचित रहे।",
      },
    },
    {
      n: "03", state: "c", num: "₹0", warn: true,
      cap: { en: "can be verified as reaching a student", hi: "छात्र तक पहुँचा सत्यापित हो सके" },
      heading: { en: "Of the rest, not one rupee can be shown to have reached a child.", hi: "बाक़ी में से एक रुपया भी किसी बच्चे तक पहुँचा नहीं दिखाया जा सकता।" },
      body: {
        en: "The Accountant General was handed no vouchers of actual expenditure — the money was “spent” on paper the moment it moved onward, to 1,75,494 sub-agencies.",
        hi: "महालेखाकार को वास्तविक व्यय का कोई वाउचर नहीं मिला — पैसा काग़ज़ पर “ख़र्च” उसी क्षण हो गया जब वह आगे 1,75,494 उप-एजेंसियों को गया।",
      },
    },
    {
      n: "04", state: "d", num: "₹0", warn: true,
      cap: { en: "the money moved; nothing is proven to reach a child", hi: "पैसा हिला; कुछ भी बच्चे तक पहुँचा सिद्ध नहीं" },
      heading: { en: "The poorest state can prove it moved the money. Not that it bought anything for a child.", hi: "सबसे ग़रीब राज्य सिद्ध कर सकता है कि उसने पैसा हिलाया। यह नहीं कि किसी बच्चे के लिए कुछ ख़रीदा।" },
      body: { en: "That is the accountability gap — drawn to scale.", hi: "यही जवाबदेही की खाई है — पैमाने पर खींची हुई।" },
    },
  ],
  evidence: [
    { label: { en: "Released to SNAs (FY24)", hi: "SNA को जारी (वित्त वर्ष 24)" }, value: "₹31,145.19 cr (Centre ₹18,173.89 + State ₹12,971.30)" },
    { label: { en: "Unspent on 31 Mar 2024", hi: "31 मार्च 2024 को अव्ययित" }, value: "₹14,738.13 cr" },
    { label: { en: "Vouchers to the AG", hi: "महालेखाकार को वाउचर" }, value: "0 — none produced" },
    { label: { en: "Chain", hi: "शृंखला" }, value: "142 SNAs → 1,75,494 child agencies" },
  ],
};

/** Narrative scene copy for the scrollytelling homepage (co-located, bilingual). */
export const SCENES: {
  hero: { eyebrow: Bilingual; h1: Bilingual; body: Bilingual; cue: Bilingual };
  seeEvidence: Bilingual;
  children: { kicker: Bilingual; punch: Bilingual; lede: Bilingual; bihar: Bilingual; india: Bilingual };
  capacity: { kicker: Bilingual; punch: Bilingual };
  turn: { punch: Bilingual; shouldLabel: Bilingual; shouldBody: Bilingual };
} = {
  hero: {
    eyebrow: { en: "Where Bihar’s education money goes", hi: "बिहार का शिक्षा-धन कहाँ जाता है" },
    h1: { en: "Bihar is India’s poorest state.", hi: "बिहार भारत का सबसे ग़रीब राज्य है।" },
    body: {
      en: "This is what happens to the money meant to teach its children. Per-capita income ₹66,828 — the lowest in the country. Follow one year’s money, rupee by rupee.",
      hi: "इसके बच्चों को पढ़ाने के लिए आए पैसे का यही हाल होता है। प्रति व्यक्ति आय ₹66,828 — देश में सबसे कम। एक साल के पैसे का पीछा कीजिए, रुपया-रुपया।",
    },
    cue: { en: "Scroll to follow the money", hi: "पैसे का पीछा करने के लिए स्क्रॉल करें" },
  },
  seeEvidence: { en: "See the evidence", hi: "प्रमाण देखें" },
  children: {
    kicker: { en: "And it isn’t only the money", hi: "और सिर्फ़ पैसा ही नहीं" },
    punch: { en: "The children disappear from the system too.", hi: "बच्चे भी व्यवस्था से ग़ायब हो जाते हैं।" },
    lede: {
      en: "Out of every 100 children in Bihar who finish upper-primary school, how many do you think go on to secondary? Drag your guess, then reveal.",
      hi: "बिहार में उच्च-प्राथमिक पूरा करने वाले हर 100 बच्चों में से आपके अनुमान से कितने माध्यमिक तक जाते हैं? अपना अनुमान खींचिए, फिर जवाब देखिए।",
    },
    bihar: { en: "reach secondary in Bihar", hi: "बिहार में माध्यमिक तक पहुँचते हैं" },
    india: { en: "reach secondary nationally", hi: "देश भर में माध्यमिक तक पहुँचते हैं" },
  },
  capacity: {
    kicker: { en: "Why the money can’t land", hi: "पैसा क्यों नहीं पहुँच पाता" },
    punch: { en: "Even the will has nowhere to go. The system is hollow.", hi: "इच्छा हो भी तो उसके जाने की जगह नहीं। व्यवस्था खोखली है।" },
  },
  turn: {
    punch: { en: "None of this is destiny. It’s accounting — and accounting can be demanded.", hi: "यह सब नियति नहीं। यह हिसाब-किताब है — और हिसाब माँगा जा सकता है।" },
    shouldLabel: { en: "What should happen", hi: "क्या होना चाहिए" },
    shouldBody: {
      en: "The money should be spent on time — on classrooms, teachers and meals — and every rupee accounted for with vouchers. That’s not a favour. It’s the law.",
      hi: "पैसा समय पर ख़र्च हो — कक्षाओं, शिक्षकों और भोजन पर — और हर रुपये का वाउचर सहित हिसाब हो। यह कोई एहसान नहीं। यह क़ानून है।",
    },
  },
};

// ── Interactive layer (the four researched patterns wired into the app) ───────────────────────
// Guess-first (NYT You-Draw-It), follow-the-rupee waterfall (details-on-demand), tangible
// converter, explorer v2. All figures sourced; arithmetic shown where derived.

const SRC_SFAR_PDF =
  "https://cag.gov.in/uploads/download_audit_report/2025/State-Finance-Report-2023-24-(08-04-2025)-ENGLISH-FINAL-with-Signeture-FINAL-FOR-PRINT-06881e24daadd66.83179080.pdf";

/** Guess-first copy. {g}/{d} tokens are replaced client-side. */
export const GUESS = {
  reality: { en: "Reality:", hi: "हक़ीक़त:" },
  children: {
    truth: 31.5,
    truthDots: 32,
    realityVal: { en: "31.5 of 100", hi: "100 में 31.5" },
    close: { en: "You guessed {g} — close.", hi: "आपका अनुमान {g} — क़रीब।" },
    off: { en: "You guessed {g} — off by {d}.", hi: "आपका अनुमान {g} — {d} का अंतर।" },
    india: {
      en: "Across India it’s 83 of 100. Source: UDISE+ 2023–24 transition rate.",
      hi: "पूरे भारत में 100 में 83। स्रोत: UDISE+ 2023–24 संक्रमण दर।",
    },
    biharStat: { en: "reach secondary in Bihar", hi: "बिहार में माध्यमिक तक पहुँचते हैं" },
    indiaStat: { en: "reach secondary nationally", hi: "देश भर में माध्यमिक तक पहुँचते हैं" },
  },
  verified: {
    max: 16407,
    lede: {
      en: "Of the ₹16,407 crore Bihar’s nodal agencies actually withdrew in 2023–24, how much could auditors verify reached a student? Drag your guess, then reveal.",
      hi: "2023–24 में बिहार की नोडल एजेंसियों ने जो ₹16,407 करोड़ वास्तव में निकाले, उनमें से कितना छात्रों तक पहुँचा अंकेक्षक सत्यापित कर सके? अपना अनुमान खींचिए, फिर जवाब देखिए।",
    },
    reality: {
      en: "The Accountant General received no vouchers of actual expenditure — not one rupee can be shown to have reached a child. Source: CAG SFAR 2023–24, Para 4.19.",
      hi: "महालेखाकार को वास्तविक व्यय का कोई वाउचर नहीं मिला — एक भी रुपया किसी बच्चे तक पहुँचा नहीं दिखाया जा सकता। स्रोत: CAG SFAR 2023–24, पैरा 4.19।",
    },
    credit: {
      en: "You gave the system credit for ₹{g} cr. So does the treasury — on paper.",
      hi: "आपने व्यवस्था को ₹{g} करोड़ का श्रेय दिया। कोषागार भी यही करता है — काग़ज़ पर।",
    },
    nailed: {
      en: "You guessed it — most people can’t believe it’s zero.",
      hi: "आपने सही पकड़ा — ज़्यादातर लोग मान ही नहीं पाते कि यह शून्य है।",
    },
  },
};

/** Follow-the-rupee waterfall (FY24, all 142 SNAs) — every segment is a provenance tap. */
export interface WfSeg {
  kind: "g" | "a" | "d" | "ghost";
  pct: number;
  label?: Bilingual;
  pop?: { title: Bilingual; value: string; doc: Bilingual; prov: string; src: string };
}
export const WATERFALL: { rows: { name: Bilingual; amt: string; segs: WfSeg[] }[]; srcLabel: string; srcUrl: string } = {
  srcLabel: "CAG SFAR 2023–24, Para 4.19",
  srcUrl: SRC_SFAR_PDF,
  rows: [
    {
      name: { en: "Released to 142 SNAs", hi: "142 SNA को जारी" },
      amt: "₹31,145 cr",
      segs: [
        {
          kind: "g",
          pct: 100,
          label: { en: "₹31,145 cr", hi: "₹31,145 करोड़" },
          pop: {
            title: { en: "Released to Single Nodal Agencies, FY24", hi: "एकल नोडल एजेंसियों को जारी, वित्त वर्ष 24" },
            value: "₹31,145.19 cr",
            doc: { en: "Centre ₹18,173.89 cr + State ₹12,971.30 cr (PFMS, 26.08.2024)", hi: "केंद्र ₹18,173.89 करोड़ + राज्य ₹12,971.30 करोड़ (PFMS, 26.08.2024)" },
            prov: "published",
            src: SRC_SFAR_PDF,
          },
        },
      ],
    },
    {
      name: { en: "What moved vs sat", hi: "क्या चला, क्या पड़ा रहा" },
      amt: "₹16,407 + ₹14,738 cr",
      segs: [
        {
          kind: "g",
          pct: 52.68,
          label: { en: "withdrawn ₹16,407 cr", hi: "निकाले गए ₹16,407 करोड़" },
          pop: {
            title: { en: "Actually withdrawn from SNA accounts", hi: "SNA खातों से वास्तव में निकाला गया" },
            value: "₹16,407.06 cr",
            doc: { en: "Derived: released − parked (31,145.19 − 14,738.13)", hi: "व्युत्पन्न: जारी − अव्ययित (31,145.19 − 14,738.13)" },
            prov: "derived",
            src: SRC_SFAR_PDF,
          },
        },
        {
          kind: "a",
          pct: 47.32,
          label: { en: "parked ₹14,738 cr", hi: "अव्ययित ₹14,738 करोड़" },
          pop: {
            title: { en: "Parked — unspent in SNA bank accounts", hi: "अव्ययित — SNA बैंक खातों में पड़ा" },
            value: "₹14,738.13 cr",
            doc: { en: "Lying unspent on 31 March 2024", hi: "31 मार्च 2024 को अव्ययित पड़ा" },
            prov: "published",
            src: SRC_SFAR_PDF,
          },
        },
      ],
    },
    {
      name: { en: "Verified reaching a child", hi: "बच्चे तक पहुँचा — सत्यापित" },
      amt: "₹0",
      segs: [
        {
          kind: "d",
          pct: 52.68,
          label: { en: "unverifiable — no vouchers", hi: "असत्यापित — कोई वाउचर नहीं" },
          pop: {
            title: { en: "Verified as reaching a beneficiary", hi: "लाभार्थी तक पहुँचा — सत्यापित" },
            value: "₹0",
            doc: {
              en: "The AG received no vouchers of actual expenditure from SNAs; funds flow onward to 1,75,494 child agencies",
              hi: "महालेखाकार को SNA से वास्तविक व्यय का कोई वाउचर नहीं मिला; धन आगे 1,75,494 उप-एजेंसियों को जाता है",
            },
            prov: "rti_needed",
            src: SRC_SFAR_PDF,
          },
        },
        { kind: "ghost", pct: 47.32 },
      ],
    },
  ],
};

/** Tangible converter — the parked ₹14,738.13 cr, translated. Arithmetic shown inline. */
export interface ConvUnit {
  key: string;
  btn: Bilingual;
  n: number;
  dec?: number;
  pre?: string;
  unit: Bilingual;
  what: Bilingual;
  math: string;
  src: Bilingual;
}
export const CONVERSIONS: ConvUnit[] = [
  {
    key: "loans",
    btn: { en: "Student Credit Card loans", hi: "स्टूडेंट क्रेडिट कार्ड ऋण" },
    n: 368453,
    unit: { en: "loans", hi: "ऋण" },
    what: {
      en: "Bihar Student Credit Card loans — a full ₹4-lakh degree loan for 3.68 lakh students, from the parked money alone.",
      hi: "बिहार स्टूडेंट क्रेडिट कार्ड ऋण — केवल अव्ययित पैसे से 3.68 लाख छात्रों को पूरा ₹4 लाख का डिग्री-ऋण।",
    },
    math: "₹14,738.13 cr ÷ ₹4,00,000 = 3,68,453",
    src: { en: "Parked: CAG SFAR 2023–24 · Loan ceiling: 7nishchay portal", hi: "अव्ययित: CAG SFAR 2023–24 · ऋण सीमा: 7निश्चय पोर्टल" },
  },
  {
    key: "meals",
    btn: { en: "Years of mid-day meals", hi: "मध्याह्न भोजन के वर्ष" },
    n: 8.6,
    dec: 1,
    unit: { en: "years", hi: "वर्ष" },
    what: {
      en: "Years of PM POSHAN — the parked money equals ~8.6 years of Bihar’s entire mid-day-meal budget.",
      hi: "पीएम पोषण के वर्ष — अव्ययित पैसा बिहार के पूरे मध्याह्न-भोजन बजट के ~8.6 वर्षों के बराबर है।",
    },
    math: "₹5,132.78 cr / 3 yr ≈ ₹1,710.9 cr/yr · 14,738.13 ÷ 1,710.9 = 8.6",
    src: { en: "Both figures: CAG SFAR 2023–24, Table 3.28 / Para 4.19", hi: "दोनों आँकड़े: CAG SFAR 2023–24, तालिका 3.28 / पैरा 4.19" },
  },
  {
    key: "child",
    btn: { en: "Per enrolled child", hi: "प्रति नामांकित बच्चा" },
    n: 6974,
    pre: "₹",
    unit: { en: "per child", hi: "प्रति बच्चा" },
    what: {
      en: "Per enrolled child in Bihar — more than a Bihar family spends on a child’s whole school year (₹5,656, household survey).",
      hi: "बिहार के प्रति नामांकित बच्चे — जितना एक बिहारी परिवार बच्चे की पूरी स्कूली साल पर ख़र्च करता है (₹5,656, पारिवारिक सर्वे) उससे अधिक।",
    },
    math: "₹14,738.13 cr ÷ 2,11,33,228 = ₹6,974",
    src: {
      en: "Enrolment: UDISE+ 2024–25, Tbl 2.2 · Household spend: NSS CMS 2025 (families, not govt)",
      hi: "नामांकन: UDISE+ 2024–25, तालिका 2.2 · पारिवारिक ख़र्च: NSS CMS 2025 (परिवार, सरकार नहीं)",
    },
  },
];
export const CONV_TOTAL_NOTE: Bilingual = {
  en: "The unit: ₹14,738.13 cr parked unspent in SNA accounts on 31 Mar 2024 (CAG SFAR 2023–24, Para 4.19).",
  hi: "इकाई: 31 मार्च 2024 को SNA खातों में अव्ययित ₹14,738.13 करोड़ (CAG SFAR 2023–24, पैरा 4.19)।",
};

/** Explorer v2 UI copy. */
export const EXPLORER_TEXT = {
  scaleOwn: { en: "% of own budget", hi: "अपने बजट का %" },
  scaleShared: { en: "shared ₹ scale", hi: "साझा ₹ पैमाना" },
  noteOwn: {
    en: "Each bar spans its own budget; the green fill is the share actually spent.",
    hi: "हर पट्टी अपना बजट है; हरा भराव वास्तविक व्यय का हिस्सा।",
  },
  noteShared: {
    en: "Bars drawn on ONE ₹ scale. Skilling money nearly disappears next to the big grants — that disappearance is the finding.",
    hi: "सभी पट्टियाँ एक ही ₹ पैमाने पर। बड़े अनुदानों के आगे कौशल का पैसा लगभग ग़ायब — यही ग़ायब होना निष्कर्ष है।",
  },
  tapHint: {
    en: "Tap any ₹ figure for its provenance and source document.",
    hi: "किसी भी ₹ आँकड़े पर टैप करें — उसका स्रोत-दस्तावेज़ देखें।",
  },
  trainedLabel: { en: "reps trained", hi: "प्रतिनिधि प्रशिक्षित" },
  releasedLabel: { en: "released", hi: "जारी" },
  mismatch: {
    en: "₹0 released — yet {n} trained. The public record doesn’t explain the mismatch (earlier balances? other funds?). That gap is itself a finding → RTI.",
    hi: "₹0 जारी — फिर भी {n} प्रशिक्षित। सार्वजनिक अभिलेख यह विसंगति नहीं समझाते (पुराने शेष? अन्य निधि?)। यह अंतर स्वयं एक निष्कर्ष है → RTI।",
  },
  trainedSrc: {
    en: "Trainees: MoPR Annual Report 2025–26, Annexure V",
    hi: "प्रशिक्षु: MoPR वार्षिक रिपोर्ट 2025–26, अनुलग्नक V",
  },
};

/** RGSA trainee counts by fiscal year (MoPR AR 2025–26, Annexure V) — the DB models money,
 *  not participants, so these ride alongside until the schema grows a trainees dimension. */
export const RGSA_TRAINED: Record<string, number> = {
  "2022-23": 404406,
  "2023-24": 163809,
  "2024-25": 435896,
};

/** Section headers for the /programmes narrative (guess → follow → feel → explore). */
export const PROG_SECTIONS: Record<string, { eyebrow: Bilingual; title: Bilingual; lede?: Bilingual }> = {
  guess: {
    eyebrow: { en: "First — a guess", hi: "पहले — एक अनुमान" },
    title: { en: "How much of the money reached a student?", hi: "कितना पैसा छात्र तक पहुँचा?" },
  },
  follow: {
    eyebrow: { en: "Follow the rupee", hi: "रुपये का पीछा" },
    title: { en: "One year’s money, drawn to scale", hi: "एक साल का पैसा, पैमाने पर" },
    lede: {
      en: "FY 2023–24, all 142 Single Nodal Agencies. Tap any segment for the exact figure, its provenance, and the source document.",
      hi: "वित्त वर्ष 2023–24, सभी 142 एकल नोडल एजेंसियाँ। किसी भी खंड पर टैप करें — सटीक आँकड़ा, उसका स्रोत व दस्तावेज़।",
    },
  },
  feel: {
    eyebrow: { en: "Make it tangible", hi: "इसे महसूस कीजिए" },
    title: { en: "₹14,738 crore is unimaginable. What it could buy isn’t.", hi: "₹14,738 करोड़ अकल्पनीय है। जो वह ख़रीद सकता था, वह नहीं।" },
  },
  explore: {
    eyebrow: { en: "Explore & compare", hi: "देखें व तुलना करें" },
    title: { en: "Six programmes, one honest scale", hi: "छह कार्यक्रम, एक ईमानदार पैमाना" },
  },
};
