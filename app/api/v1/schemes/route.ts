import { type NextRequest } from "next/server";
import { apiError, apiJson, preflight } from "@/lib/api";
import { parseFilters } from "@/lib/facets";
import { isDbConfigured, searchSchemes } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const OPTIONS = () => preflight();

// GET /api/v1/schemes — filterable list of scheme summaries (same filters as the finder).
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return apiError(503, "database not configured");
  try {
    // The public API keeps its documented 50-cap (the in-app finder returns all + paginates).
    const results = await searchSchemes(parseFilters(req.nextUrl.searchParams), 50);
    return apiJson({ count: results.length, limit: 50, results });
  } catch (e) {
    console.error("api/v1/schemes:", e);
    return apiError(500, "internal error");
  }
}
