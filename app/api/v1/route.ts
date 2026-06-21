import { apiJson, preflight } from "@/lib/api";
import { getSchemeCounts, isDbConfigured, listPolicies } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// Discovery endpoint — describes the public API and links every other endpoint.
export async function GET() {
  const base = "https://yojana.bodhya.net/api/v1";
  let counts = { schemes: 0, policies: 0 };
  if (isDbConfigured()) {
    try {
      const [s, p] = await Promise.all([getSchemeCounts(), listPolicies({})]);
      counts = { schemes: s.total, policies: p.length };
    } catch {
      /* leave zeros */
    }
  }
  return apiJson({
    name: "Bihar Policy & Scheme Tracker API",
    version: "v1",
    description:
      "Read-only, public, source-verified registry of Bihar & central government schemes and policies. Bilingual (every record carries _en/_hi fields); status is derived from evidence, never asserted.",
    counts,
    endpoints: {
      schemes: { url: `${base}/schemes`, method: "GET", filters: ["q", "persona", "education", "gender", "social", "category", "age", "income", "disabled", "buckets"], note: "Returns up to 50 summaries." },
      scheme: { url: `${base}/schemes/{id}`, method: "GET", note: "Full detail: eligibility, benefit, budget allocations, metrics, sources, successor + similar schemes." },
      policies: { url: `${base}/policies`, method: "GET", filters: ["q"] },
      policy: { url: `${base}/policies/{id}`, method: "GET" },
    },
    notes: "Every record includes a source_url + last_verified. Figures carry a provenance. No data is fabricated.",
    source: "https://github.com/fossdot/bihar-scheme-tracker",
  });
}
