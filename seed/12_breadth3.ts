/**
 * Breadth pass 3 (2026-06-19) — a large batch widening coverage across education scholarships,
 * women, agriculture, welfare, housing, infrastructure and employment. Public-sourced (myScheme /
 * dept portals / public listings). Conservative 'likely_active'; figures are REPORTED (to verify at
 * the official portal) — none fabricated; structured eligibility set where clearly stated.
 *   npm run seed:breadth3 [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";

const DEPTS: Record<string, { en: string; hi: string; web: string }> = {
  education: { en: "Education Department, Government of Bihar", hi: "शिक्षा विभाग, बिहार सरकार", web: "https://education.bihar.gov.in" },
  socialwelfare: { en: "Social Welfare Department, Government of Bihar", hi: "समाज कल्याण विभाग, बिहार सरकार", web: "https://state.bihar.gov.in/socialwelfare" },
  industries: { en: "Industries Department, Government of Bihar", hi: "उद्योग विभाग, बिहार सरकार", web: "https://industries.bihar.gov.in" },
  agriculture: { en: "Department of Agriculture, Government of Bihar", hi: "कृषि विभाग, बिहार सरकार", web: "https://dbtagriculture.bihar.gov.in" },
  labour: { en: "Labour Resources Department, Government of Bihar", hi: "श्रम संसाधन विभाग, बिहार सरकार", web: "https://state.bihar.gov.in/labour" },
  rural: { en: "Rural Development Department, Government of Bihar", hi: "ग्रामीण विकास विभाग, बिहार सरकार", web: "https://rdd.bihar.gov.in" },
  energy: { en: "Energy Department, Government of Bihar", hi: "ऊर्जा विभाग, बिहार सरकार", web: "https://energy.bihar.gov.in" },
  phed: { en: "Public Health Engineering Department, Government of Bihar", hi: "लोक स्वास्थ्य अभियंत्रण विभाग, बिहार सरकार", web: "https://phed.bihar.gov.in" },
  minority: { en: "Minority Welfare Department, Government of Bihar", hi: "अल्पसंख्यक कल्याण विभाग, बिहार सरकार", web: "https://state.bihar.gov.in/minoritywelfare" },
};
type DeptKey = keyof typeof DEPTS;

type S = {
  name_en: string; name_hi: string; dept: DeptKey; categories: string[];
  objective_en: string; objective_hi: string; eligibility_en: string; eligibility_hi: string;
  benefit_type: string; benefit_detail: string; target_beneficiary: string;
  personas: string[]; education_levels: string[]; gender: string; social: string[];
  min_age: number | null; max_age: number | null; income: number | null; bpl: boolean;
  domicile: string; disabled: boolean; land: string | null;
  portal: string;
};

const mk = (o: Partial<S> & Pick<S, "name_en" | "name_hi" | "dept" | "categories" | "objective_en" | "objective_hi" | "eligibility_en" | "eligibility_hi" | "benefit_type" | "benefit_detail" | "target_beneficiary" | "portal">): S => ({
  personas: [], education_levels: [], gender: "any", social: [], min_age: null, max_age: null,
  income: null, bpl: false, domicile: "bihar", disabled: false, land: null, ...o,
});

const SCHEMES: S[] = [
  mk({ name_en: "Bihar e-Kalyan Scholarship", name_hi: "बिहार ई-कल्याण छात्रवृत्ति", dept: "socialwelfare", categories: ["education"],
    objective_en: "Post-matric scholarships for SC/ST/BC/EBC and minority students pursuing higher studies.", objective_hi: "उच्च शिक्षा हेतु SC/ST/BC/EBC एवं अल्पसंख्यक विद्यार्थियों के लिए पोस्ट-मैट्रिक छात्रवृत्ति।",
    eligibility_en: "Bihar-resident SC/ST/BC/EBC/minority students from Class 11 to PhD; income limits apply per category (verify at e-Kalyan).", eligibility_hi: "बिहार निवासी SC/ST/BC/EBC/अल्पसंख्यक विद्यार्थी, कक्षा 11 से पीएचडी तक; श्रेणी अनुसार आय-सीमा (e-Kalyan पर सत्यापित करें)।",
    benefit_type: "Scholarship", benefit_detail: "Tuition fees + annual maintenance (reported ₹2,000–₹25,000+/year by level). Verify current rates at the portal.", target_beneficiary: "SC/ST/BC/EBC/minority students of Bihar.",
    personas: ["student"], education_levels: ["senior_secondary"], social: ["sc", "st", "bc", "ebc", "minority"], portal: "https://www.ekalyan.bih.nic.in" }),
  mk({ name_en: "Bihar Scholarship Portal (Pre/Post-Matric)", name_hi: "बिहार छात्रवृत्ति पोर्टल (प्री/पोस्ट-मैट्रिक)", dept: "socialwelfare", categories: ["education"],
    objective_en: "Pre- and post-matric scholarships for SC/ST/BC/EBC students across school and college levels.", objective_hi: "विद्यालय व महाविद्यालय स्तर पर SC/ST/BC/EBC विद्यार्थियों हेतु प्री व पोस्ट-मैट्रिक छात्रवृत्ति।",
    eligibility_en: "Bihar-resident SC/ST/BC/EBC students; class and category-based rates; income limits apply.", eligibility_hi: "बिहार निवासी SC/ST/BC/EBC विद्यार्थी; कक्षा व श्रेणी आधारित दरें; आय-सीमा लागू।",
    benefit_type: "Scholarship", benefit_detail: "Reported ₹1,000–₹15,000+/year depending on class and category. Verify at the portal.", target_beneficiary: "SC/ST/BC/EBC students of Bihar.",
    personas: ["student"], social: ["sc", "st", "bc", "ebc"], portal: "https://www.ekalyan.bih.nic.in" }),
  mk({ name_en: "Mukhyamantri Medhavriti Yojana", name_hi: "मुख्यमंत्री मेधावृत्ति योजना", dept: "socialwelfare", categories: ["education", "women_child"],
    objective_en: "Merit incentive for SC/ST girl students who pass Class 12.", objective_hi: "12वीं उत्तीर्ण करने वाली SC/ST छात्राओं हेतु मेधा प्रोत्साहन।",
    eligibility_en: "SC/ST girls of Bihar passing Class 12 from a recognised board.", eligibility_hi: "मान्यता प्राप्त बोर्ड से 12वीं उत्तीर्ण बिहार की SC/ST छात्राएँ।",
    benefit_type: "Cash incentive", benefit_detail: "Reported ₹15,000 (1st division) / ₹10,000 (2nd division). Verify at the portal.", target_beneficiary: "SC/ST girl students of Bihar.",
    personas: ["student"], education_levels: ["senior_secondary"], gender: "female", social: ["sc", "st"], portal: "https://www.medhasoft.bihar.gov.in" }),
  mk({ name_en: "Mukhyamantri Balika Protsahan Yojana (Matric)", name_hi: "मुख्यमंत्री बालिका प्रोत्साहन योजना (मैट्रिक)", dept: "education", categories: ["education", "women_child"],
    objective_en: "Cash incentive for girls who pass the Class 10 (Matric) BSEB exam.", objective_hi: "बिहार बोर्ड से 10वीं (मैट्रिक) उत्तीर्ण बालिकाओं हेतु नकद प्रोत्साहन।",
    eligibility_en: "Girls of Bihar passing Class 10 from BSEB.", eligibility_hi: "बिहार बोर्ड से 10वीं उत्तीर्ण बिहार की बालिकाएँ।",
    benefit_type: "Cash incentive", benefit_detail: "Reported ₹10,000 (1st division) / ₹8,000 (2nd division). Verify at the portal.", target_beneficiary: "Girls passing Class 10 in Bihar.",
    personas: ["student"], education_levels: ["secondary"], gender: "female", portal: "https://www.medhasoft.bihar.gov.in" }),
  mk({ name_en: "Mukhyamantri Balika Protsahan Yojana (Intermediate)", name_hi: "मुख्यमंत्री बालिका प्रोत्साहन योजना (इंटरमीडिएट)", dept: "education", categories: ["education", "women_child"],
    objective_en: "One-time incentive for girls who pass the Class 12 (Intermediate) BSEB exam.", objective_hi: "बिहार बोर्ड से 12वीं (इंटरमीडिएट) उत्तीर्ण बालिकाओं हेतु एकमुश्त प्रोत्साहन।",
    eligibility_en: "Girls of Bihar passing Class 12 from BSEB.", eligibility_hi: "बिहार बोर्ड से 12वीं उत्तीर्ण बिहार की बालिकाएँ।",
    benefit_type: "Cash incentive", benefit_detail: "Reported ₹25,000 one-time. Verify at the portal.", target_beneficiary: "Girls passing Class 12 in Bihar.",
    personas: ["student"], education_levels: ["senior_secondary"], gender: "female", portal: "https://www.medhasoft.bihar.gov.in" }),
  mk({ name_en: "Bihar Nishulk Coaching Yojana", name_hi: "बिहार नि:शुल्क कोचिंग योजना", dept: "socialwelfare", categories: ["education", "skilling"],
    objective_en: "Free competitive-exam coaching for SC/ST/EBC/OBC/minority students from low-income families.", objective_hi: "निम्न-आय परिवारों के SC/ST/EBC/OBC/अल्पसंख्यक विद्यार्थियों हेतु नि:शुल्क प्रतियोगी-परीक्षा कोचिंग।",
    eligibility_en: "Bihar-resident SC/ST/EBC/OBC/minority students with family income below ₹3 lakh/year.", eligibility_hi: "बिहार निवासी SC/ST/EBC/OBC/अल्पसंख्यक विद्यार्थी जिनकी पारिवारिक आय ₹3 लाख/वर्ष से कम हो।",
    benefit_type: "Free coaching + stipend", benefit_detail: "Free coaching plus a reported ₹1,500/month stipend. Verify at the portal.", target_beneficiary: "Low-income SC/ST/EBC/OBC/minority students.",
    personas: ["student"], social: ["sc", "st", "ebc", "bc", "minority"], income: 300000, portal: "https://state.bihar.gov.in/socialwelfare" }),
  mk({ name_en: "Mukhyamantri Mahila Rojgar Yojana", name_hi: "मुख्यमंत्री महिला रोज़गार योजना", dept: "industries", categories: ["employment", "women_child", "financial_inclusion"],
    objective_en: "Stipend, micro-enterprise support and skilling for women to start livelihoods.", objective_hi: "महिलाओं को आजीविका शुरू करने हेतु भत्ता, सूक्ष्म-उद्यम सहायता एवं कौशल।",
    eligibility_en: "Women of Bihar (priority to SHG/Jeevika members); details to verify at source.", eligibility_hi: "बिहार की महिलाएँ (स्वयं सहायता समूह/जीविका सदस्यों को प्राथमिकता); विवरण स्रोत से सत्यापित करें।",
    benefit_type: "Stipend + enterprise support", benefit_detail: "Reported ₹10,000/month stipend + up to ₹2 lakh micro-enterprise support + skill training. Verify current terms.", target_beneficiary: "Women of Bihar.",
    personas: ["self_employed_entrepreneur", "shg_jeevika_member"], gender: "female", portal: "https://industries.bihar.gov.in" }),
  mk({ name_en: "JEEViKA (Bihar Rural Livelihoods) SHG Support", name_hi: "जीविका (बिहार ग्रामीण आजीविका) स्वयं सहायता समूह सहायता", dept: "rural", categories: ["women_child", "financial_inclusion", "employment"],
    objective_en: "Organise rural poor women into Self-Help Groups with revolving funds, bank credit and livelihoods support.", objective_hi: "ग्रामीण निर्धन महिलाओं को स्वयं सहायता समूहों में संगठित कर रिवॉल्विंग फंड, बैंक ऋण व आजीविका सहायता।",
    eligibility_en: "Rural women of Bihar who join a Jeevika SHG.", eligibility_hi: "जीविका स्वयं सहायता समूह से जुड़ने वाली बिहार की ग्रामीण महिलाएँ।",
    benefit_type: "Revolving fund + credit linkage", benefit_detail: "Reported revolving fund per SHG + bank credit linkage + skill training. Verify at source.", target_beneficiary: "Rural poor women (SHG members).",
    personas: ["shg_jeevika_member"], gender: "female", portal: "https://brlps.in" }),
  mk({ name_en: "Bihar Alpsankhyak Rozgar Rin Yojana", name_hi: "बिहार अल्पसंख्यक रोज़गार ऋण योजना", dept: "minority", categories: ["financial_inclusion", "employment"],
    objective_en: "Low-interest business loans for minority-community entrepreneurs.", objective_hi: "अल्पसंख्यक समुदाय के उद्यमियों हेतु कम-ब्याज व्यवसाय ऋण।",
    eligibility_en: "Minority-community residents of Bihar aged 18–50 starting/expanding a business.", eligibility_hi: "बिहार के अल्पसंख्यक समुदाय के निवासी, आयु 18–50, व्यवसाय हेतु।",
    benefit_type: "Business loan", benefit_detail: "Reported up to ₹5 lakh at ~5% (4% for women). Verify current terms.", target_beneficiary: "Minority entrepreneurs of Bihar.",
    personas: ["self_employed_entrepreneur"], social: ["minority"], min_age: 18, max_age: 50, portal: "https://state.bihar.gov.in/minoritywelfare" }),
  mk({ name_en: "Mukhyamantri Pratigya Yojana (Internship)", name_hi: "मुख्यमंत्री प्रतिज्ञा योजना (इंटर्नशिप)", dept: "labour", categories: ["employment", "skilling"],
    objective_en: "Internship/stipend scheme to give unemployed youth work experience.", objective_hi: "बेरोज़गार युवाओं को कार्य-अनुभव देने हेतु इंटर्नशिप/भत्ता योजना।",
    eligibility_en: "Unemployed youth of Bihar aged 18–28 (educational criteria apply; verify at source).", eligibility_hi: "बिहार के बेरोज़गार युवा, आयु 18–28 (शैक्षिक मानदंड लागू; स्रोत से सत्यापित करें)।",
    benefit_type: "Internship stipend", benefit_detail: "Reported ₹4,000–₹6,000/month internship stipend. Verify current terms.", target_beneficiary: "Unemployed youth of Bihar.",
    personas: ["unemployed_youth"], education_levels: ["senior_secondary"], min_age: 18, max_age: 28, portal: "https://state.bihar.gov.in/labour" }),
  mk({ name_en: "Bihar Mukhyamantri Gram Parivahan Yojana", name_hi: "बिहार मुख्यमंत्री ग्राम परिवहन योजना", dept: "socialwelfare", categories: ["employment", "social_welfare"],
    objective_en: "Subsidy to rural SC/ST/EBC youth to buy a passenger vehicle for transport livelihood.", objective_hi: "ग्रामीण SC/ST/EBC युवाओं को यात्री वाहन खरीदने हेतु अनुदान।",
    eligibility_en: "Rural SC/ST/EBC residents of Bihar.", eligibility_hi: "बिहार के ग्रामीण SC/ST/EBC निवासी।",
    benefit_type: "Vehicle subsidy", benefit_detail: "Reported 50% subsidy up to ₹1 lakh on a 3/4-wheeler. Verify current terms.", target_beneficiary: "Rural SC/ST/EBC youth.",
    personas: ["self_employed_entrepreneur"], social: ["sc", "st", "ebc"], portal: "https://state.bihar.gov.in/transport" }),
  mk({ name_en: "Bihar Pravasi Majdoor Durghatna Bima Yojana", name_hi: "बिहार प्रवासी मज़दूर दुर्घटना बीमा योजना", dept: "labour", categories: ["social_welfare", "employment"],
    objective_en: "Accident insurance cover for migrant workers from Bihar.", objective_hi: "बिहार के प्रवासी मज़दूरों हेतु दुर्घटना बीमा।",
    eligibility_en: "Registered migrant workers from Bihar.", eligibility_hi: "बिहार के पंजीकृत प्रवासी मज़दूर।",
    benefit_type: "Accident insurance", benefit_detail: "Reported death ₹2 lakh / full disability ₹1 lakh / partial ₹75,000. Verify current terms.", target_beneficiary: "Migrant workers of Bihar.",
    personas: ["worker_labourer"], portal: "https://state.bihar.gov.in/labour" }),
  mk({ name_en: "MGNREGA (Bihar)", name_hi: "मनरेगा (बिहार)", dept: "rural", categories: ["employment", "social_welfare"],
    objective_en: "Guaranteed wage employment for rural households willing to do unskilled manual work.", objective_hi: "अकुशल शारीरिक कार्य हेतु इच्छुक ग्रामीण परिवारों को गारंटीशुदा मज़दूरी रोज़गार।",
    eligibility_en: "Adult members of rural households in Bihar with a job card.", eligibility_hi: "जॉब कार्ड धारक बिहार के ग्रामीण परिवारों के वयस्क सदस्य।",
    benefit_type: "Guaranteed wage employment", benefit_detail: "Up to 100 days of guaranteed work per household per year at the notified daily wage. Verify the current wage rate.", target_beneficiary: "Rural households of Bihar.",
    personas: ["worker_labourer"], portal: "https://nrega.nic.in" }),
  mk({ name_en: "Jananayak Karpoori Thakur Kisan Samman Nidhi", name_hi: "जननायक कर्पूरी ठाकुर किसान सम्मान निधि", dept: "agriculture", categories: ["agriculture"],
    objective_en: "State income support to farmers (over and above central PM-Kisan).", objective_hi: "किसानों को राज्य आय-सहायता (केंद्रीय पीएम-किसान के अतिरिक्त)।",
    eligibility_en: "Eligible farmer families of Bihar registered on the Agriculture DBT portal.", eligibility_hi: "कृषि DBT पोर्टल पर पंजीकृत बिहार के पात्र किसान परिवार।",
    benefit_type: "Income support (DBT)", benefit_detail: "Reported ₹9,000/year (state support; ₹3,000 more than earlier). Verify current terms.", target_beneficiary: "Farmer families of Bihar.",
    personas: ["farmer"], land: "any", portal: "https://dbtagriculture.bihar.gov.in" }),
  mk({ name_en: "Bihar Rajya Fasal Sahayata Yojana", name_hi: "बिहार राज्य फसल सहायता योजना", dept: "agriculture", categories: ["agriculture"],
    objective_en: "Financial assistance to farmers for crop loss from natural calamities (state crop-protection scheme).", objective_hi: "प्राकृतिक आपदाओं से फसल क्षति पर किसानों को वित्तीय सहायता (राज्य फसल-सुरक्षा योजना)।",
    eligibility_en: "Raiyat and non-Raiyat farmers of Bihar registered for the scheme.", eligibility_hi: "योजना हेतु पंजीकृत बिहार के रैयत व गैर-रैयत किसान।",
    benefit_type: "Crop-loss assistance", benefit_detail: "Reported ₹7,500/ha (loss up to 20%) / ₹10,000/ha (loss above 20%). Verify current rates.", target_beneficiary: "Farmers of Bihar with crop loss.",
    personas: ["farmer"], land: "any", portal: "https://pacsonline.bih.nic.in" }),
  mk({ name_en: "Bihar Krishi Yantra Anudan Yojana", name_hi: "बिहार कृषि यंत्र अनुदान योजना", dept: "agriculture", categories: ["agriculture"],
    objective_en: "Subsidy to farmers for purchasing farm machinery and equipment.", objective_hi: "कृषि यंत्र व उपकरण खरीदने हेतु किसानों को अनुदान।",
    eligibility_en: "Farmers of Bihar registered on the Agriculture DBT portal.", eligibility_hi: "कृषि DBT पोर्टल पर पंजीकृत बिहार के किसान।",
    benefit_type: "Equipment subsidy", benefit_detail: "Reported 40–80% subsidy on 75+ implements. Verify current rates and caps.", target_beneficiary: "Farmers of Bihar.",
    personas: ["farmer"], land: "any", portal: "https://farmech.bih.nic.in" }),
  mk({ name_en: "Bihar Mukhyamantri Bagwani Mission", name_hi: "बिहार मुख्यमंत्री बागवानी मिशन", dept: "agriculture", categories: ["agriculture"],
    objective_en: "Subsidy support for horticulture — fruit and vegetable cultivation.", objective_hi: "बागवानी — फल व सब्ज़ी की खेती हेतु अनुदान सहायता।",
    eligibility_en: "Farmers of Bihar undertaking horticulture cultivation.", eligibility_hi: "बागवानी करने वाले बिहार के किसान।",
    benefit_type: "Cultivation subsidy", benefit_detail: "Reported up to 50% subsidy (₹15,000–₹1,00,000/ha by crop). Verify current rates.", target_beneficiary: "Horticulture farmers of Bihar.",
    personas: ["farmer"], land: "any", portal: "https://horticulture.bihar.gov.in" }),
  mk({ name_en: "Bihar Parvarish Yojana", name_hi: "बिहार परवरिश योजना", dept: "socialwelfare", categories: ["social_welfare", "women_child"],
    objective_en: "Monthly maintenance for orphans, semi-orphans and children of HIV-positive or severely disabled parents.", objective_hi: "अनाथ, अर्ध-अनाथ एवं HIV-संक्रमित या गंभीर दिव्यांग माता-पिता के बच्चों हेतु मासिक भरण-पोषण।",
    eligibility_en: "Eligible vulnerable children of Bihar up to age 18 (per scheme criteria).", eligibility_hi: "योजना मानदंड अनुसार बिहार के पात्र संवेदनशील बच्चे, 18 वर्ष तक।",
    benefit_type: "Monthly maintenance (DBT)", benefit_detail: "Reported ₹900–₹1,000 per child per month. Verify current rate.", target_beneficiary: "Orphans/vulnerable children of Bihar.",
    portal: "https://state.bihar.gov.in/socialwelfare" }),
  mk({ name_en: "Bihar Parivarik Labh Yojana", name_hi: "बिहार पारिवारिक लाभ योजना", dept: "socialwelfare", categories: ["social_welfare"],
    objective_en: "One-time lump-sum support to a BPL family on the death of its primary breadwinner.", objective_hi: "मुख्य कमाने वाले की मृत्यु पर BPL परिवार को एकमुश्त सहायता।",
    eligibility_en: "BPL families of Bihar whose primary earner (aged 18–60) has died.", eligibility_hi: "बिहार के BPL परिवार जिनके मुख्य कमाने वाले (आयु 18–60) की मृत्यु हुई हो।",
    benefit_type: "Lump-sum assistance", benefit_detail: "Reported ₹20,000 one-time. Verify current amount.", target_beneficiary: "BPL families of Bihar.",
    bpl: true, portal: "https://state.bihar.gov.in/socialwelfare" }),
  mk({ name_en: "Bihar Mukhyamantri Gramin Awas Yojana", name_hi: "बिहार मुख्यमंत्री ग्रामीण आवास योजना", dept: "rural", categories: ["housing", "social_welfare"],
    objective_en: "Assistance to rural poor families without a pucca house to build one.", objective_hi: "पक्के मकान से वंचित ग्रामीण निर्धन परिवारों को आवास निर्माण हेतु सहायता।",
    eligibility_en: "Rural BPL families of Bihar without a pucca house.", eligibility_hi: "पक्के मकान से वंचित बिहार के ग्रामीण BPL परिवार।",
    benefit_type: "Housing assistance (DBT)", benefit_detail: "Reported ₹1.20 lakh in 3 instalments + MGNREGA wage days. Verify current terms.", target_beneficiary: "Rural BPL families of Bihar.",
    bpl: true, portal: "https://rdd.bihar.gov.in" }),
  mk({ name_en: "Bihar Har Ghar Bijli Yojana", name_hi: "बिहार हर घर बिजली योजना", dept: "energy", categories: ["social_welfare"],
    objective_en: "Free electricity connection to every un-electrified household in Bihar.", objective_hi: "बिहार के प्रत्येक अविद्युतीकृत घर को नि:शुल्क बिजली कनेक्शन।",
    eligibility_en: "Un-electrified households in Bihar (BPL households get free connection).", eligibility_hi: "बिहार के अविद्युतीकृत घर (BPL परिवारों को नि:शुल्क कनेक्शन)।",
    benefit_type: "Electricity connection", benefit_detail: "Free new connection; subsidised units for BPL. Verify current terms.", target_beneficiary: "Un-electrified households of Bihar.",
    domicile: "bihar", portal: "https://energy.bihar.gov.in" }),
  mk({ name_en: "Bihar Jal Jeevan Mission (Har Ghar Nal Ka Jal)", name_hi: "बिहार जल जीवन मिशन (हर घर नल का जल)", dept: "phed", categories: ["social_welfare", "health"],
    objective_en: "Functional piped tap-water connection to every rural household.", objective_hi: "प्रत्येक ग्रामीण घर को कार्यशील पाइप जल कनेक्शन।",
    eligibility_en: "Rural households of Bihar lacking piped water (SC/ST/BPL free).", eligibility_hi: "पाइप जल से वंचित बिहार के ग्रामीण घर (SC/ST/BPL नि:शुल्क)।",
    benefit_type: "Piped water connection", benefit_detail: "Functional tap connection; free for SC/ST/BPL, nominal for others. Verify current terms.", target_beneficiary: "Rural households of Bihar.",
    portal: "https://phedcms.bihar.gov.in" }),
];

const COLS = [
  "name_en","name_hi","department_id","categories","launch_date","objective_en","objective_hi",
  "eligibility_en","eligibility_hi","benefit_type","benefit_detail","target_beneficiary",
  "personas","education_levels","gender_eligibility","social_categories","min_age","max_age",
  "income_ceiling","requires_bpl","domicile","is_for_disabled","land_ownership",
  "application_portal_url","status","status_evidence","last_budget_year","last_notification_date",
  "source_url","last_verified",
];
const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function deptId(d: DeptKey): Promise<string> {
  const dep = DEPTS[d];
  const e = await query<{ id: string }>(`select id from departments where name_en=$1`, [dep.en]);
  if (e[0]) return e[0].id;
  const [r] = await query<{ id: string }>(`insert into departments (name_en,name_hi,website) values ($1,$2,$3) returning id`, [dep.en, dep.hi, dep.web]);
  return r.id;
}

async function main() {
  if (isDryRun) { console.log(`DRY RUN — ${SCHEMES.length} schemes:`); SCHEMES.forEach((s) => console.log(` ${s.name_en} [${s.dept}]`)); return; }
  const ph = COLS.map((_, i) => `$${i + 1}`).join(", ");
  let added = 0;
  for (const s of SCHEMES) {
    if ((await query(`select 1 from schemes where name_en=$1`, [s.name_en])).length) { console.log(`skip (exists): ${s.name_en}`); continue; }
    const dId = await deptId(s.dept);
    const ev = `Seeded ${ON} as 'likely_active': active state scheme per public listings. Figures are REPORTED — verify current terms at ${s.portal}. Scheme-line budget not verified.`;
    const values = [
      s.name_en, s.name_hi, dId, s.categories, null, s.objective_en, s.objective_hi,
      s.eligibility_en, s.eligibility_hi, s.benefit_type, s.benefit_detail, s.target_beneficiary,
      s.personas, s.education_levels, s.gender, s.social, s.min_age, s.max_age,
      s.income, s.bpl, s.domicile, s.disabled, s.land,
      s.portal, "likely_active", ev, null, null, s.portal, ON,
    ];
    const [r] = await query<{ id: string }>(`insert into schemes (${COLS.join(", ")}) values (${ph}) returning id`, values);
    console.log(`inserted: ${s.name_en} → ${r.id}`);
    added++;
  }
  console.log(`\nDone. ${added} new schemes.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
