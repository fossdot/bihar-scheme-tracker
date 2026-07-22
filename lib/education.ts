// Data access for the standalone `education.*` accountability module (separate from the
// citizen finder). Read-only query helpers for the /education overview page.
import { query } from "./db";

export interface EduAllocation {
  fiscal_year: string;
  agency_abbrev: string | null;
  approved_cr: number | null;
  approved_provenance: string | null;
  approved_source_url: string | null;
  approved_source_doc: string | null;
  released_cr: number | null;
  released_centre_cr: number | null;
  released_state_cr: number | null;
  released_provenance: string | null;
  released_source_url: string | null;
  released_source_doc: string | null;
  spent_cr: number | null;
  spent_provenance: string | null;
  spent_source_url: string | null;
  spent_source_doc: string | null;
  note_en: string | null;
  note_hi: string | null;
}

export interface EduProgramme {
  id: string;
  name_en: string;
  name_hi: string | null;
  funding_source: string;
  centre_share_pct: number | null;
  state_share_pct: number | null;
  note_en: string | null;
  note_hi: string | null;
  source_url: string;
  nodal_en: string | null;
  nodal_hi: string | null;
  nodal_abbrev: string | null;
  allocations: EduAllocation[];
}

export interface EduAudit {
  report_ref: string | null;
  programme_en: string | null;
  fiscal_years: string | null;
  finding_en: string;
  finding_hi: string | null;
  amount_flagged_cr: number | null;
  provenance: string;
  source_url: string;
  source_doc: string | null;
}

export interface EduOverview {
  programmes: EduProgramme[];
  audits: EduAudit[];
  stats: { programmes: number; flaggedCr: number; rtiPending: number };
}

/**
 * One programme's headline "allocated vs spent" for the bar view. Prefers the allocation that
 * actually carries a spend figure (so we can show a used %); falls back to the largest committed
 * amount when spend is unpublished (shown as "RTI needed"). `amount` = approved, else released.
 */
export function headline(allocs: EduAllocation[]) {
  const committed = (a: EduAllocation) => a.approved_cr ?? a.released_cr ?? null;
  const withSpend = allocs.filter((a) => a.spent_cr != null);
  const pool = withSpend.length ? withSpend : allocs;
  const pick = pool
    .slice()
    .sort((a, b) => (committed(b) ?? -1) - (committed(a) ?? -1))[0];
  if (!pick) return null;
  const amount = pick.approved_cr ?? pick.released_cr ?? null;
  const amountProv = pick.approved_cr != null ? pick.approved_provenance : pick.released_provenance;
  const amountSrc = pick.approved_cr != null ? pick.approved_source_url : pick.released_source_url;
  const used = pick.spent_cr;
  const pct = used != null && amount ? Math.round((used / amount) * 100) : null;
  return {
    fiscal_year: pick.fiscal_year,
    amount,
    amountProv,
    amountSrc,
    used,
    usedProv: pick.spent_provenance,
    usedSrc: pick.spent_source_url,
    pct,
    note_en: pick.note_en,
    note_hi: pick.note_hi,
  };
}

const AWAITED = new Set(["rti_needed", "rti_filed"]);

export async function getEducationOverview(): Promise<EduOverview> {
  const [programmes, allocRows, audits] = await Promise.all([
    query<Omit<EduProgramme, "allocations">>(
      `select fp.id, fp.name_en, fp.name_hi, fp.funding_source::text as funding_source,
              fp.centre_share_pct, fp.state_share_pct, fp.note_en, fp.note_hi, fp.source_url,
              na.name_en as nodal_en, na.name_hi as nodal_hi, na.abbrev as nodal_abbrev
         from education.funding_programmes fp
         left join lateral (
           select a.name_en, a.name_hi, a.abbrev
             from education.programme_agencies pg
             join education.agencies a on a.id = pg.agency_id
            where pg.programme_id = fp.id and pg.role = 'nodal'
            limit 1
         ) na on true
        order by fp.name_en`
    ),
    query<EduAllocation & { programme_id: string }>(
      `select pa.programme_id, pa.fiscal_year, ag.abbrev as agency_abbrev,
              pa.approved_cr, pa.approved_provenance::text as approved_provenance,
              pa.approved_source_url, pa.approved_source_doc,
              pa.released_cr, pa.released_centre_cr, pa.released_state_cr,
              pa.released_provenance::text as released_provenance,
              pa.released_source_url, pa.released_source_doc,
              pa.spent_cr, pa.spent_provenance::text as spent_provenance,
              pa.spent_source_url, pa.spent_source_doc,
              pa.note_en, pa.note_hi
         from education.programme_allocations pa
         left join education.agencies ag on ag.id = pa.agency_id
        order by pa.fiscal_year`
    ),
    query<EduAudit>(
      `select af.report_ref, fp.name_en as programme_en, af.fiscal_years,
              af.finding_en, af.finding_hi, af.amount_flagged_cr,
              af.provenance::text as provenance, af.source_url, af.source_doc
         from education.audit_findings af
         left join education.funding_programmes fp on fp.id = af.programme_id
        order by af.amount_flagged_cr desc nulls last`
    ),
  ]);

  const byProg = new Map<string, EduAllocation[]>();
  for (const r of allocRows) {
    const { programme_id, ...alloc } = r as EduAllocation & { programme_id: string };
    (byProg.get(programme_id) ?? byProg.set(programme_id, []).get(programme_id)!).push(alloc);
  }
  const withAllocs: EduProgramme[] = programmes.map((p) => ({
    ...p,
    allocations: byProg.get(p.id) ?? [],
  }));

  const rtiPending = allocRows.filter((a) =>
    [a.approved_provenance, a.released_provenance, a.spent_provenance].some(
      (pv) => pv && AWAITED.has(pv)
    )
  ).length;
  const flaggedCr = audits.reduce((sum, a) => sum + (a.amount_flagged_cr ?? 0), 0);

  return {
    programmes: withAllocs,
    audits,
    stats: { programmes: withAllocs.length, flaggedCr, rtiPending },
  };
}
