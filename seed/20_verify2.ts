/**
 * Verification pass 2 (2026-06-19) — the remaining 45 schemes (41 likely_active + 4 inactive),
 * checked against authoritative current sources (PIB, official portals, newsonair, myScheme) via
 * parallel research agents. Same discipline as seed/19: 'active' only with a concrete current-year
 * signal; otherwise honestly 'likely_active'. Corrections applied; each row gets a dated, sourced
 * status_evidence. A few structural fixes: rename "Shatabdi"→"Mukhyamantri" Niji Nalkoop, and
 * subsume "Balika Protsahan (Intermediate)" into Kanya Utthan (it IS that scheme's inter milestone).
 *   npm run seed:verify2 [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { getPool, query } from "../lib/db";

const ON = "2026-06-19";

type Upd = {
  name: string;
  status?: string;
  evidence: string;
  benefit?: string;
  min_age?: number;
  max_age?: number;
  income_ceiling?: number;
  portal?: string;
  is_for_disabled?: boolean;
  last_notification_date?: string;
  social_categories?: string[];
  new_name_en?: string;
  new_name_hi?: string;
  successor_name?: string;
};

const U: Upd[] = [
  // ── Central: pensions / insurance / savings ──
  { name: "Atal Pension Yojana (APY)", status: "active",
    benefit: "Guaranteed pension of ₹1,000–₹5,000/month after age 60 based on contribution. Income-tax payers are not eligible (since Oct 2022).",
    evidence: "Active — PFRDA confirms it is operational and enrolling (~9.1 crore subscribers by May 2026, a record ~1.35 crore added in FY2025-26). Age 18–40. Verified 2026-06-19. Source: https://www.pfrda.org.in/" },
  { name: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)", status: "active",
    benefit: "Life cover of ₹2 lakh for an annual premium of ₹436 (revised 2022); bank-account holders aged 18–50.",
    evidence: "Active — runs under the Jan Suraksha umbrella (PMJJBY + PMSBY enrolments past 55 crore by 2026); premium ₹436/year since 1 Jun 2022 (PIB). Verified 2026-06-19. Source: https://www.jansuraksha.gov.in/" },
  { name: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)", status: "active",
    benefit: "Accidental death/disability cover of ₹2 lakh for an annual premium of ₹20; bank-account holders aged 18–70.",
    evidence: "Active — Jan Suraksha umbrella, 55+ crore combined enrolments (2026); premium ₹20/year since 1 Jun 2022 (PIB). Verified 2026-06-19. Source: https://www.jansuraksha.gov.in/" },
  { name: "Pradhan Mantri Shram Yogi Maandhan (PM-SYM)", status: "active",
    evidence: "Active — Ministry of Labour confirms operation (PIB 2025): ₹3,000/month pension after 60 with equal (50%) government co-contribution, for unorganised workers 18–40 earning ≤₹15,000/month and not in EPFO/ESIC/NPS. Verified 2026-06-19. Source: https://maandhan.in/" },
  { name: "Pradhan Mantri Jan Dhan Yojana (PMJDY)", status: "active",
    benefit: "Zero-balance account with RuPay card, overdraft up to ₹10,000, and ₹2 lakh accidental insurance cover.",
    evidence: "Active — 11 years in 2025: 56.16 crore accounts and 38.68 crore RuPay cards (PIB, Aug 2025). Verified 2026-06-19. Source: https://pmjdy.gov.in/" },
  { name: "Sukanya Samriddhi Yojana (SSY)", status: "active",
    benefit: "Small-savings deposit for a girl child at 8.2% p.a. (Apr–Jun 2026) with EEE tax benefit; matures for her education/marriage.",
    evidence: "Active — small-savings rates retained, SSY at 8.2% for Q1 FY2026-27 (Finance Ministry, Mar 2026). Verified 2026-06-19. Source: https://www.nsiindia.gov.in/" },

  // ── Central: credit / skilling / LPG ──
  { name: "PM SVANidhi (Street Vendors)", status: "active",
    benefit: "Collateral-free working-capital loans for street vendors — ₹15,000, then ₹25,000, then ₹50,000 (tiers raised in the 2025 restructuring), with interest subsidy; repaying the 2nd loan unlocks a UPI-linked RuPay credit card.",
    evidence: "Active — Cabinet restructured and extended it to 31 Mar 2030 (₹7,332 cr, Aug 2025); ~96 lakh loans disbursed by Jul 2025. Verified 2026-06-19. Source: https://pmsvanidhi.mohua.gov.in/" },
  { name: "PM Vishwakarma", status: "active",
    benefit: "₹500/day training stipend, a ₹15,000 toolkit incentive, and collateral-free loans up to ₹3 lakh (₹1 lakh then ₹2 lakh) at 5% interest.",
    evidence: "Active — 30+ lakh artisans registered and 4.7 lakh loans sanctioned by Aug 2025 (PIB). Verified 2026-06-19. Source: https://pmvishwakarma.gov.in/" },
  { name: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)", status: "active",
    evidence: "Active — PMKVY 4.0 runs under the restructured Skill India Programme (Cabinet, Feb 2025) through FY2025-26, relaunch confirmed Mar 2026; free NSQF training + certification (also on skillindiadigital.gov.in). Verified 2026-06-19. Source: https://www.pmkvyofficial.org/" },
  { name: "Stand-Up India", status: "likely_active",
    evidence: "Likely active — bank loans ₹10 lakh–₹1 crore for SC/ST and women entrepreneurs (greenfield); sanctions continued through Oct 2025 (₹62,807 cr cumulative, IBEF), but the notified scheme period ran to 2025 and a formal post-March-2025 extension was not confirmed. Verified 2026-06-19. Source: https://www.standupmitra.in/" },
  { name: "Pradhan Mantri Mudra Yojana (PMMY)", status: "active",
    benefit: "Loans under Shishu (≤₹50k), Kishore (₹50k–₹5L), Tarun (₹5L–₹10L) and Tarun Plus (₹10L–₹20L, for borrowers who have repaid a Tarun loan). Collateral-free, CGFMU-guaranteed.",
    evidence: "Active — loan limit doubled to ₹20 lakh via the new Tarun Plus category (effective 24 Oct 2024, PIB). Verified 2026-06-19. Source: https://www.mudra.org.in/" },
  { name: "Pradhan Mantri Ujjwala Yojana (PMUY)", status: "active",
    benefit: "Free LPG connection with deposit support (₹1,700 / ₹950) plus first refill and stove; subsidy of ₹300 per 14.2 kg cylinder for up to 9 refills/year (FY2025-26).",
    evidence: "Active — Cabinet continued the targeted subsidy for FY2025-26 (₹12,000 cr); ~10.56 crore connections. Verified 2026-06-19. Source: https://www.pmuy.gov.in/" },

  // ── Central: welfare ──
  { name: "Pradhan Mantri Matru Vandana Yojana (PMMVY)", status: "active", portal: "https://pmmvy.wcd.gov.in/",
    benefit: "₹5,000 for the first child (in two installments); an additional ₹6,000 for a second child if a girl. Paid by DBT.",
    evidence: "Active — special registration drive extended to 15 Aug 2025 (PIB). Verified 2026-06-19. Source: https://pmmvy.wcd.gov.in/" },
  { name: "PM POSHAN (Mid-Day Meal)", status: "active",
    evidence: "Active — material cost revised +9.5% effective 1 May 2025 (~₹954 cr extra in FY2025-26); one hot cooked meal per school day, Bal Vatika–Class 8. Sanctioned through FY2025-26 (continuation beyond Mar 2026 needs fresh approval). Verified 2026-06-19. Source: https://pmposhan.education.gov.in/" },
  { name: "e-Shram (Unorganised Workers Registration)", status: "active",
    benefit: "An e-Shram card is registration/identity for unorganised workers and a gateway to linked welfare schemes (PMSBY, PMJJBY, PM-SYM, PDS, Ayushman, NSAP, etc.). It does not itself provide insurance — linked schemes require separate enrolment.",
    evidence: "Active — ~31 crore registrations by Aug 2025; mobile app launched Feb 2025; 14 schemes integrated (PIB). [Corrected: the card does not auto-provide accident cover.] Verified 2026-06-19. Source: https://eshram.gov.in/" },
  { name: "National Family Benefit Scheme (NFBS)", status: "active",
    evidence: "Active — operating under NSAP with ~3.5 lakh beneficiaries; ₹20,000 one-time on death of a BPL family's primary breadwinner, DBT-delivered (PIB/NSAP 2025). Verified 2026-06-19. Source: https://nsap.nic.in/" },

  // ── Bihar: agriculture ──
  { name: "Bihar Diesel Anudan Yojana", status: "active",
    benefit: "Per-irrigation-round diesel subsidy (rate notified each season; reported ~₹750/acre per round, e.g. ~₹1,500/acre for paddy).",
    evidence: "Active — the official DBT Agriculture portal listed Diesel Subsidy (Kharif) 2025-26 with a 31 Jul–30 Oct 2025 window; runs each season. Verified 2026-06-19. Source: https://dbtagriculture.bihar.gov.in/" },
  { name: "Bihar Krishi Yantra Anudan Yojana", status: "active", portal: "https://farmech.bihar.gov.in/",
    benefit: "Subsidy (commonly up to ~80–90% for priority categories) on ~91 types of farm implements; applied via the OFMAS / DBT Agriculture portal in a seasonal window.",
    evidence: "Active — Bihar's 2026-27 budget allocates ₹176 cr to agricultural mechanisation (PRS); the OFMAS portal (farmech.bihar.gov.in) is live and linked from the DBT Agriculture portal. Applications are seasonal. Verified 2026-06-19. Source: https://dbtagriculture.bihar.gov.in/" },
  { name: "Bihar Mukhyamantri Bagwani Mission", status: "active", portal: "https://horticulture.bihar.gov.in/MainSite/SchemeDetails_CMHM.aspx",
    evidence: "Active — the official CMHM horticulture portal is live with a 2025-26 application year and 2025/2026-dated notices; subsidy up to ~50% varies by component. Verified 2026-06-19. Source: https://horticulture.bihar.gov.in/MainSite/SchemeDetails_CMHM.aspx" },
  { name: "Bihar Shatabdi Niji Nalkoop Yojana", status: "likely_active",
    new_name_en: "Bihar Mukhyamantri Niji Nalkoop Yojana", new_name_hi: "मुख्यमंत्री निजी नलकूप योजना",
    portal: "https://mwrd.bihar.gov.in/mnny/",
    evidence: "Likely active — the official Minor Water Resources portal runs the Mukhyamantri Niji Nalkoop Yojana under Saat Nishchay-2 (target 35,000 borewells); 'Shatabdi Niji Nalkoop' is an older label. No current open-application window confirmed, so not upgraded to active. Verified 2026-06-19. Source: https://mwrd.bihar.gov.in/mnny/" },
  { name: "Jananayak Karpoori Thakur Kisan Samman Nidhi", status: "likely_active",
    benefit: "₹3,000/year Bihar state top-up to farmer income support (₹9,000/year combined with the central PM-KISAN ₹6,000).",
    evidence: "Likely active — newly announced in Bihar's 2026-27 budget (Feb 2026) as a ₹3,000/year state top-up over PM-KISAN (PRS); rollout pending, so not yet 'active'. [Corrected: ₹9,000 is the combined figure, not a ₹9,000 state benefit.] Verified 2026-06-19. Source: https://prsindia.org/budgets/states/bihar-budget-analysis-2026-27" },

  // ── Bihar: education / scholarships ──
  { name: "Mukhyamantri Balak/Balika Cycle Yojana", status: "likely_active",
    evidence: "Likely active — reported running via medhasoft (₹3,000 to Class-9 students for a bicycle; often bundled with the uniform/Poshak grant). First-party medhasoft notification not captured, so not upgraded to active. Verified 2026-06-19. Source: https://medhasoft.bihar.gov.in/" },
  { name: "Mukhyamantri Balika Protsahan Yojana (Intermediate)", status: "subsumed",
    successor_name: "Mukhyamantri Kanya Utthan Yojana",
    evidence: "Subsumed — the intermediate-pass girls' incentive is now administered as the intermediate milestone of the Mukhyamantri Kanya Utthan Yojana (₹25,000 first division / ₹15,000 second division, via medhasoft). Apply under Kanya Utthan. Verified 2026-06-19. Source: https://medhasoft.bihar.gov.in/" },
  { name: "Mukhyamantri Balika Protsahan Yojana (Matric)", status: "likely_active",
    evidence: "Likely active — a Class-10 first-division incentive (reported ₹10,000) is running via medhasoft for 2025; recent reporting suggests it may now cover all first-division students (not girls only), so the exact gender scope needs confirmation. Verified 2026-06-19. Source: https://medhasoft.bihar.gov.in/" },
  { name: "Mukhyamantri Medhavriti Yojana", status: "likely_active",
    evidence: "Likely active — merit scholarship reported running via medhasoft for 2025: ₹15,000 (first division) / ₹10,000 (second division) for SC/ST & minority intermediate-pass students, with a separate BC/EBC variant run by the BC/EBC Welfare Department. [Corrected: it is an intermediate-pass, not matric, incentive.] Verified 2026-06-19. Source: https://medhasoft.bihar.gov.in/" },
  { name: "Bihar Scholarship Portal (Pre/Post-Matric)", status: "active",
    portal: "https://pmsonline.bihar.gov.in", social_categories: ["sc", "st", "bc", "ebc"],
    evidence: "Active — SC/ST and BC/EBC pre/post-matric scholarships ran for 2025-26 (applications/correction windows open into late 2025). SC/ST via scstpmsonline.bihar.gov.in, BC/EBC via pmsonline.bihar.gov.in. Verified 2026-06-19. Source: https://pmsonline.bihar.gov.in/" },
  { name: "Bihar Nishulk Coaching Yojana", status: "likely_active",
    benefit: "Free competitive-exam (UPSC/BPSC/SSC) coaching with a monthly stipend (reported ₹1,500 for local / ₹3,000 for outstation students).",
    evidence: "Likely active — Bihar free-coaching programs reported open in 2025 via Pre-Examination Training Centres; an umbrella of department-specific programs (the prominent one run by the BC/EBC Welfare Department). Stipend reported, not officially published. Verified 2026-06-19. Source: https://bcebconline.bihar.gov.in/" },

  // ── Bihar: social welfare / labour ──
  { name: "Bihar Mukhyamantri Gram Parivahan Yojana", status: "likely_active", social_categories: ["sc", "st", "ebc"],
    benefit: "50% subsidy, capped at ₹1 lakh (standard 3/4-wheeler), ₹70,000 (e-rickshaw) or ₹2 lakh (ambulance), for SC/ST/EBC groups.",
    evidence: "Likely active — listed on the Bihar Transport Dept portal and myScheme and run phase-wise, but the latest hard figures are older (43,917 beneficiaries to Mar 2023) with no current-FY notification found. [Corrected: SC/ST/EBC only; tiered caps.] Verified 2026-06-19. Source: https://state.bihar.gov.in/transport/" },
  { name: "Bihar Parivarik Labh Yojana", status: "likely_active",
    evidence: "Likely active — Bihar's delivery of the National Family Benefit Scheme (₹20,000 one-time on a BPL breadwinner's death, age 18–60), via serviceonline.bihar.gov.in; confirmed on NIC pages but no current-FY notification found. Verified 2026-06-19. Source: https://serviceonline.bihar.gov.in/" },
  { name: "Bihar Parvarish Yojana", status: "active", portal: "https://esuvidha.bihar.gov.in",
    benefit: "₹1,000/month per eligible child (0–18) — orphans, HIV/leprosy/cancer-affected, and children of widows or disabled parents. Paid via DBT.",
    evidence: "Active — listed on myScheme and shown as payable on Bihar's e-Suvidha portal (Mar 2026). Verified 2026-06-19. Source: https://www.myscheme.gov.in/schemes/pybihar" },
  { name: "Mukhyamantri Kanya Vivah Yojana", status: "active",
    benefit: "One-time ₹5,000 to the bride (by DBT) on a registered marriage where the bride is 18+ (BPL family).",
    evidence: "Active — a live statutory RTPS service on serviceonline.bihar.gov.in (21-day timeline). [Corrected: ₹5,000 one-time, not ₹5,000–₹10,000; paid to the bride by DBT.] Verified 2026-06-19. Source: https://serviceonline.bihar.gov.in/" },
  { name: "Mukhyamantri Pratigya Yojana (Internship)", status: "likely_active", portal: "https://cmpratigya.bihar.gov.in/",
    benefit: "Internship stipend of ₹4,000 (12th) / ₹5,000 (ITI or diploma) / ₹6,000 (graduate and above) per month, plus ₹2,000 if interning outside the home district or ₹5,000 if outside Bihar.",
    evidence: "Likely active — approved by the Bihar cabinet on 1 Jul 2025 under Saat Nishchay-2 with an official portal (cmpratigya.bihar.gov.in); employer registration opened, candidate registration rolling out. Verified 2026-06-19. Source: https://cmpratigya.bihar.gov.in/" },
  { name: "Kabir Antyeshti Anudan Yojana", status: "active", portal: "https://esuvidha.bihar.gov.in",
    benefit: "₹3,000 immediate last-rites assistance for a BPL family, routed via the local body's account on e-Suvidha.",
    evidence: "Active — disbursed in FY2024-25 (e.g. Begusarai paid 3,030 cases at ₹3,000 each; Prabhat Khabar, Mar 2025); BPL family + 10-year Bihar residency. Verified 2026-06-19. Source: https://esuvidha.bihar.gov.in/" },
  { name: "Bihar Pravasi Majdoor Durghatna Bima Yojana", status: "active", last_notification_date: "2026-02-09",
    benefit: "For migrant-worker accidents outside Bihar/abroad (within 180 days): ₹4 lakh on death, ₹1 lakh for permanent full disability, ₹50,000 for permanent partial disability — paid by RTGS.",
    evidence: "Active — amounts revised by the Bihar State Migrant Labour Accident Grant (Amendment) Rules, 2026 (S.O. 75, 9 Feb 2026): death ₹2L→₹4L, partial ₹75k→₹50k. Verified 2026-06-19. Source: https://serviceonline.bihar.gov.in/" },

  // ── Bihar: infrastructure / housing / livelihood + district ──
  { name: "Bihar Har Ghar Bijli Yojana", status: "likely_active", portal: "https://hargharbijli.bsphcl.co.in",
    benefit: "Free new domestic electricity connection (the portal stays open for unconnected households). Bihar also gives 125 free units/month to domestic consumers from Aug 2025.",
    evidence: "Likely active — universal household electrification was achieved Oct 2018 (a saturation scheme); BSPHCL's portal stays open for new/missed households. A separate 125-free-units/month benefit began Aug 2025. Verified 2026-06-19. Source: https://hargharbijli.bsphcl.co.in/" },
  { name: "Bihar Jal Jeevan Mission (Har Ghar Nal Ka Jal)", status: "active", portal: "https://phedcgrc.in/",
    evidence: "Active — Jal Jeevan Mission extended to Dec 2028 (JJM 2.0, Cabinet approval Mar 2026); Bihar at ~96% functional tap-connection coverage. Verified 2026-06-19. Source: https://jaljeevanmission.gov.in/" },
  { name: "Bihar Mukhyamantri Gramin Awas Yojana", status: "likely_active", portal: "https://state.bihar.gov.in/rdd/",
    benefit: "Unit assistance of ₹1.20 lakh (₹1.30 lakh in 11 IAP districts) in milestone installments plus MGNREGA wage days, for rural families excluded from PMAY-G.",
    evidence: "Likely active — listed on myScheme as a Bihar Rural Development Dept scheme for PMAY-G-excluded families; no current-FY state budget line or notice fetched, so not upgraded to active. Verified 2026-06-19. Source: https://www.myscheme.gov.in/schemes/mgawb" },
  { name: "Bihar Vaas Bhoomi Yojana", status: "active", portal: "https://state.bihar.gov.in/lrc/",
    benefit: "Free homestead plot of up to 5 decimal (basgeet parcha) to a landless family; where no government land is available, ₹1 lakh cash to buy a plot.",
    evidence: "Active — live campaign 'Abhiyan Basera-2' (15–21 Jun 2026) allotting plots; the cash-purchase assistance was raised from ₹60,000 to ₹1 lakh (Prabhat Khabar, Jun 2026). Verified 2026-06-19. Source: https://state.bihar.gov.in/lrc/" },
  { name: "Bihar Alpsankhyak Rozgar Rin Yojana", status: "likely_active", income_ceiling: 400000, social_categories: ["minority"],
    benefit: "Self-employment loan up to ₹5 lakh at 5% simple interest (with a 0.5% rebate for timely repayment), repaid over 5 years, for minority-community members.",
    evidence: "Likely active — listed by BSMFC and myScheme, but the latest official sanction lists are FY2021-22 with no new 2024-26 cycle confirmed. [Corrected: flat 5% (no separate women's rate); ceiling ₹5 lakh; family income ≤₹4 lakh/yr.] Verified 2026-06-19. Source: https://bsmfc.org/" },
  { name: "Bihar Startup Fund (Seed Funding)", status: "active",
    benefit: "Interest-free seed-funding loan up to ₹10 lakh (10-year repayment), with enhancements for women and SC/ST/PwD founders, under the Bihar Startup Policy 2022.",
    evidence: "Active — the startup.bihar.gov.in portal is live (updated Jun 2026) and SIDBI manages a ₹50 cr Bihar scale-up fund (Jun 2026); ~₹52+ cr disbursed to 900+ startups. [Note: a separate ₹3 lakh grant could not be officially confirmed.] Verified 2026-06-19. Source: https://startup.bihar.gov.in/" },
  { name: "District Mineral Foundation Trust (DMFT) Schemes", status: "active",
    evidence: "Active — DMFs operate across Bihar's mining districts under PMKKKY (revamped Jan 2024); National DMF Summit Mar 2026; live Bihar PMKKKY dashboard. Funds health/education/water/livelihood works in mining-affected areas. Verified 2026-06-19. Source: https://mitra.ibm.gov.in/pmkkky/Bihar/Pages/Dashboard.aspx" },

  // ── Inactive — confirmations ──
  { name: "Indira Awaas Yojana (IAY)", status: "subsumed",
    evidence: "Subsumed — Indira Awaas Yojana was restructured into Pradhan Mantri Awaas Yojana–Gramin with effect from 1 Apr 2016 (PMAY-G launched 20 Nov 2016). Apply under PMAY-G. Verified 2026-06-19. Source: https://pmayg.nic.in/" },
  { name: "Rajiv Awas Yojana (RAY)", status: "subsumed",
    evidence: "Subsumed — Rajiv Awas Yojana was discontinued by Ministry order dated 19 May 2015 and its liabilities folded into the Housing for All mission (PMAY-Urban, launched Jun 2015). Verified 2026-06-19. Source: https://pmay-urban.gov.in/" },
  { name: "Rajiv Gandhi Grameen Vidyutikaran Yojana (RGGVY)", status: "subsumed",
    evidence: "Subsumed — RGGVY was subsumed into the Deen Dayal Upadhyaya Gram Jyoti Yojana (DDUGJY) as its rural-electrification component (2014-15); household electrification later continued under Saubhagya (Oct 2017). Verified 2026-06-19. Source: https://www.pib.gov.in/PressReleasePage.aspx?PRID=1883918" },
  { name: "Backward Regions Grant Fund (BRGF)", status: "lapsed",
    evidence: "Lapsed — the Backward Regions Grant Fund was delinked from central budgetary support from 2015-16 following the 14th Finance Commission (states' tax share raised to 42%); no direct successor. Verified 2026-06-19. Source: https://cprindia.org/briefsreports/budget-brief-2015-16-backward-regions-grant-fund/" },
];

const COL: Record<string, string> = {
  status: "status", benefit: "benefit_detail", min_age: "min_age", max_age: "max_age",
  income_ceiling: "income_ceiling", portal: "application_portal_url", is_for_disabled: "is_for_disabled",
  last_notification_date: "last_notification_date", social_categories: "social_categories",
  new_name_en: "name_en", new_name_hi: "name_hi", evidence: "status_evidence",
};

const isDryRun = process.argv.includes("--dry-run") || !process.env.DATABASE_URL;

async function main() {
  if (isDryRun) {
    console.log(`DRY RUN — ${U.length} schemes`);
    U.forEach((u) => console.log(` ${u.name} → ${u.status ?? "(unchanged)"}`));
    return;
  }
  let done = 0, missing = 0;
  for (const u of U) {
    const sets: string[] = [];
    const vals: unknown[] = [u.name];
    for (const [key, col] of Object.entries(COL)) {
      const v = (u as Record<string, unknown>)[key];
      if (v === undefined) continue;
      vals.push(v);
      sets.push(`${col}=$${vals.length}`);
    }
    if (u.successor_name) {
      const s = await query<{ id: string }>(`select id from schemes where name_en=$1`, [u.successor_name]);
      if (s.length) { vals.push(s[0].id); sets.push(`successor_scheme_id=$${vals.length}`); }
      else console.log(`  ! successor not found: ${u.successor_name}`);
    }
    vals.push(ON);
    sets.push(`last_verified=$${vals.length}`);
    const res = await query<{ id: string }>(
      `update schemes set ${sets.join(", ")} where name_en=$1 returning id`, vals,
    );
    if (!res.length) { console.log(`! not found: ${u.name}`); missing++; continue; }
    console.log(`~ ${u.name} → ${u.status ?? "(unchanged)"}${u.new_name_en ? " [renamed]" : ""}${u.successor_name ? " [successor]" : ""} verified`);
    done++;
  }
  console.log(`\nDone. ${done} verified${missing ? `, ${missing} not found` : ""}.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => { if (!isDryRun) await getPool().end(); });
