import { apiError, apiJson, preflight } from "@/lib/api";
import { isDbConfigured } from "@/lib/queries";
import { getEducationOverview } from "@/lib/education";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// GET /api/v1/education — the education-money module. Funding programmes with their per-stage
// allocations (approved / released / spent, each with its own provenance + source), audit
// findings, and honest DB-derived aggregates. Bilingual (_en/_hi); spending is never asserted —
// where nothing is published the figure is null with an rti_* provenance, never fabricated.
export async function GET() {
  if (!isDbConfigured()) return apiError(503, "database not configured");
  try {
    const { programmes, audits, stats } = await getEducationOverview();
    return apiJson({
      module: "education",
      stats, // { programmes, flaggedCr, rtiPending }
      counts: { programmes: programmes.length, audits: audits.length },
      programmes, // each: funding, nodal agency, allocations[] with per-stage provenance + source
      audits, // CAG/other findings, amount_flagged_cr, provenance, source_url
    });
  } catch (e) {
    console.error("api/v1/education:", e);
    return apiError(500, "internal error");
  }
}
