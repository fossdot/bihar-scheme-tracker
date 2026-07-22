import { apiJson, preflight } from "@/lib/api";
import { getSchemeCounts, isDbConfigured, listPolicies } from "@/lib/queries";
import { getEducationOverview } from "@/lib/education";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// Discovery endpoint — describes the public API and links every other endpoint.
export async function GET() {
  const base = "https://yojana.bodhya.net/api/v1";
  let counts = { education_programmes: 0, schemes: 0, policies: 0 };
  if (isDbConfigured()) {
    try {
      const [s, p, edu] = await Promise.all([getSchemeCounts(), listPolicies({}), getEducationOverview()]);
      counts = { education_programmes: edu.stats.programmes, schemes: s.total, policies: p.length };
    } catch {
      /* leave zeros */
    }
  }
  return apiJson({
    name: "Bihar Education Money API",
    version: "v1",
    description:
      "Read-only, public, source-verified data on where Bihar's education money goes — funding programmes traced from released to (un)verified spend — plus the underlying registry of Bihar & central schemes and policies. Bilingual (every record carries _en/_hi fields); spending is never asserted, and every figure carries its source.",
    counts,
    endpoints: {
      education: {
        url: `${base}/education`,
        method: "GET",
        note: "The education-money module: funding programmes with per-stage (approved/released/spent) allocations, audit findings, and honest aggregates — each figure with its provenance + source.",
      },
      schemes: { url: `${base}/schemes`, method: "GET", filters: ["q", "persona", "education", "gender", "social", "category", "age", "income", "disabled", "buckets"], note: "Returns up to 50 summaries." },
      scheme: { url: `${base}/schemes/{id}`, method: "GET", note: "Full detail: eligibility, benefit, budget allocations, metrics, sources, successor + similar schemes." },
      policies: { url: `${base}/policies`, method: "GET", filters: ["q"] },
      policy: { url: `${base}/policies/{id}`, method: "GET" },
    },
    notes: "Every record includes a source_url + last_verified. Figures carry a provenance. No data is fabricated.",
    source: "https://github.com/fossdot/bihar-scheme-tracker",
  });
}
